/**
 * CharacterEngine
 * ---------------------------------------------------------------------------
 * Draws the ORIGINAL character video through WebGL2 and adds two interactive
 * layers on top of it. Nothing else about the video is touched.
 *
 *   1. Eyes   – each iris is lifted from the current video frame and slid
 *               toward the cursor inside the eye opening. The white of the eye
 *               that gets uncovered is filled from the surrounding sclera, and
 *               the iris is clipped by a per-frame eye-opening mask, so it
 *               slides under the lids instead of leaving the socket.
 *   2. Face   – a tiny (≈1–3°) parallax on the head region only. Eyes shift a
 *               little more than the rest of the face, the body/neck/tail stay
 *               exactly as they are in the video.
 *
 * With no interaction (gaze = 0) both layers are inactive and the output is
 * pixel-identical to the source video.
 *
 * Per-frame eye positions, eye-opening masks and slack limits were measured
 * offline from the video (see /tools) and are looked up by video frame index,
 * so the effect stays locked to the animation, including blinks.
 */
import eyeData from '../data/eyeData.json';

type Vec2 = { x: number; y: number };
interface Spring { x: number; y: number; vx: number; vy: number }

const FRAMES = eyeData.frames as number[][][]; // [frame][eye][12]
// per eye: 0 cx, 1 cy, 2 vis, 3 x0, 4 y0, 5..7 sclera rgb, 8..11 slack L,R,U,D
const N_FRAMES = eyeData.n;
const FPS = eyeData.fps;
const R_I = eyeData.rI as number[];
const WIN = eyeData.win * 2; // 160 px window in video space
const TILE = eyeData.tile;
const COLS = eyeData.cols;

export const VIDEO_W = 1920;
export const VIDEO_H = 1080;
/** Stage crop for wide layouts: keeps the frame clear of the video's corner mark. */
export const WIDE_CROP = { x: 100, y: 0, w: 1740, h: 1080 };

const VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 p = vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2));
  vUv = vec2(p.x, 1.0 - p.y);
  gl_Position = vec4(p*2.0-1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uVideo;
uniform sampler2D uMask;
uniform vec2  uVS;
uniform vec2  uAtlas;
uniform vec4  uCrop;
uniform vec4  uHead;
uniform vec4  uPar;
uniform vec4  uFace;
uniform vec4  uA[2];  // cx cy rIris strength
uniform vec4  uB[2];  // shiftX shiftY winX winY
uniform vec4  uC[2];  // scleraRGB tileIndex
in vec2 vUv;
out vec4 outColor;

vec3 tex(vec2 p){ return texture(uVideo, p / uVS).rgb; }

float maskAt(vec2 p, int e){
  vec4 B = uB[e];
  vec2 tp = (p - B.zw) / ${WIN}.0;
  if(tp.x < 0.0 || tp.y < 0.0 || tp.x > 1.0 || tp.y > 1.0) return 0.0;
  float t = uC[e].w;
  vec2 cell = vec2(mod(t, ${COLS}.0), floor(t / ${COLS}.0));
  vec2 uv = (cell * ${TILE}.0 + clamp(tp * ${TILE}.0, vec2(0.5), vec2(${TILE}.0 - 0.5))) / uAtlas;
  return texture(uMask, uv).r;
}

// Sclera (eye white) uncovered when the iris moves: smooth interpolation of
// clean white samples taken on a ring around the iris.
vec3 fillSclera(vec2 p, vec2 c, float rI, vec3 fallback, int e){
  vec3 acc = vec3(0.0); float wsum = 0.0; float cnt = 0.0;
  float R = rI + 9.0;
  for(int k = 0; k < 12; k++){
    float a = 6.2831853 * float(k) / 12.0;
    vec2 q = c + R * vec2(cos(a), sin(a));
    vec3 col = tex(q);
    float mx = max(col.r, max(col.g, col.b));
    float mn = min(col.r, min(col.g, col.b));
    float sat = (mx - mn) / max(mx, 0.001);
    float ok = step(0.5, maskAt(q, e)) * step(sat, 0.14) * step(0.55, mx);
    float w = ok / (dot(p - q, p - q) + 30.0);
    acc += col * w; wsum += w; cnt += ok;
  }
  vec3 interp = wsum > 0.0 ? acc / wsum : fallback;
  return mix(fallback, interp, smoothstep(1.0, 4.0, cnt));
}

// mint skin / eyelid colour: green-dominant, moderately saturated
float skinLike(vec3 c){
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float sat = (mx - mn) / max(mx, 0.001);
  float greenDom = step(c.r, c.g) * step(c.b, c.g * 1.03);
  return greenDom * smoothstep(0.16, 0.2, sat) * (1.0 - smoothstep(0.5, 0.6, sat)) * smoothstep(0.28, 0.34, mx);
}

vec3 eyeComp(vec3 col, vec2 p, int e){
  vec4 A = uA[e]; vec4 B = uB[e]; vec4 C = uC[e];
  float mv = length(B.xy);
  if(A.w < 0.002 || mv < 0.02) return col;
  vec2 c = A.xy; float rI = A.z;
  vec2 rel = p - c;
  if(abs(rel.x) > rI * 2.3 || abs(rel.y) > rI * 2.3) return col;
  float m = smoothstep(0.3, 0.7, maskAt(p, e));
  if(m <= 0.0) return col;
  float oldA = 1.0 - smoothstep(rI + 2.5, rI + 6.5, length(rel));
  vec2 s = p - B.xy;
  float newA = 1.0 - smoothstep(rI - 0.5, rI + 1.5, length(s - c));
  vec3 base = col;
  if(oldA > 0.0) base = mix(col, fillSclera(p, c, rI, C.rgb, e), oldA);
  vec3 res = mix(base, tex(s), newA);
  float allowed = m * (1.0 - skinLike(base));
  float k = A.w * allowed * smoothstep(0.0, 0.6, mv);
  return mix(col, res, k);
}

vec2 faceDisp(vec2 x){
  float d = length((x - uHead.xy) / uHead.zw);
  float wH = 1.0 - smoothstep(0.30, 1.0, d);
  float dE = length((x - uPar.xy) / uPar.zw);
  float wE = 1.0 - smoothstep(0.0, 1.0, dE);
  return wH * uFace.xy + wE * wE * uFace.zw;
}

void main(){
  vec2 x = uCrop.xy + vUv * uCrop.zw;
  vec2 p = x - faceDisp(x);
  vec3 col = tex(p);
  col = eyeComp(col, p, 0);
  col = eyeComp(col, p, 1);
  outColor = vec4(col, 1.0);
}`;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function stepSpring(s: Spring, tx: number, ty: number, k: number, damping: number, dt: number) {
  const c = 2 * Math.sqrt(k) * damping;
  s.vx += (k * (tx - s.x) - c * s.vx) * dt;
  s.vy += (k * (ty - s.y) - c * s.vy) * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
}

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  video: HTMLVideoElement;
  atlas: HTMLImageElement;
  /** called once the first video frame has been drawn */
  onReady?: () => void;
  onFail?: (reason: string) => void;
}

export class CharacterEngine {
  private canvas: HTMLCanvasElement;
  private video: HTMLVideoElement;
  private gl!: WebGL2RenderingContext;
  private U: Record<string, WebGLUniformLocation | null> = {};
  private vTex!: WebGLTexture;
  private texAllocated = false;
  private opts: EngineOptions;

  private raf = 0;
  private vfc = 0;
  private running = false;
  private visible = true;
  private dead = false;
  private readySent = false;
  private lastT = 0;

  private frameIdx = 0;
  private haveFrame = false;
  private lastVideoTime = -1;
  private hasRVFC = false;

  private crop = { ...WIDE_CROP };

  // interaction state
  private pointer: Vec2 | null = null;
  private lastMove = -1e9;
  private auto = false;
  private autoTarget: Vec2 = { x: 0, y: 0 };
  private autoNext = 0;
  private eyeSpring: Spring[] = [
    { x: 0, y: 0, vx: 0, vy: 0 },
    { x: 0, y: 0, vx: 0, vy: 0 },
  ];
  private faceSpring: Spring = { x: 0, y: 0, vx: 0, vy: 0 };
  private strength = [0, 0];
  private debug: { gaze: Vec2; face: Vec2 } | null = null;

  /** tuning (video pixels @1080p) */
  readonly tuning = {
    capX: 13, // horizontal iris travel
    capUp: 9,
    capDown: 6,
    tuckX: 0.24, // × iris radius that may slide under the eye-corner fold
    tuckUp: 0.3, // … under the upper lid
    tuckDown: 0.2, // … under the lower lid
    faceX: 3.4,
    faceY: 2.6,
    parallax: 0.55, // extra shift of the eye line relative to the face
  };

  constructor(opts: EngineOptions) {
    this.opts = opts;
    this.hasRVFC = 'requestVideoFrameCallback' in opts.video;
    this.canvas = opts.canvas;
    this.video = opts.video;
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.canvas.addEventListener('webglcontextlost', this.onLost, false);
    this.init(opts.atlas);
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.fail('context lost');
  };

  private fail(reason: string) {
    if (this.dead) return;
    this.dead = true;
    this.stop();
    this.opts.onFail?.(reason);
  }

  private compile(type: number, src: string) {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('Shader error: ' + gl.getShaderInfoLog(s));
    }
    return s;
  }

  private init(atlas: HTMLImageElement) {
    const gl = this.gl;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, this.compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, this.compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Link error: ' + gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);
    const names = ['uVideo', 'uMask', 'uVS', 'uAtlas', 'uCrop', 'uHead', 'uPar', 'uFace', 'uA', 'uB', 'uC'];
    for (const n of names) this.U[n] = gl.getUniformLocation(prog, n);

    // video texture
    this.vTex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.vTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // eye-opening mask atlas
    const mt = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, mt);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, atlas);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(this.U.uVideo, 0);
    gl.uniform1i(this.U.uMask, 1);
    gl.uniform2f(this.U.uVS, VIDEO_W, VIDEO_H);
    gl.uniform2f(this.U.uAtlas, atlas.naturalWidth, atlas.naturalHeight);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }

  /* ------------------------------------------------------------------ API */

  start() {
    if (this.running || this.dead) return;
    this.running = true;
    this.lastT = performance.now();
    if (this.hasRVFC) {
      const cb = (_n: number, meta: VideoFrameCallbackMetadata) => {
        this.uploadFrame(meta.mediaTime);
        this.vfc = this.video.requestVideoFrameCallback(cb);
      };
      this.vfc = this.video.requestVideoFrameCallback(cb);
    }
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    if (this.vfc && this.hasRVFC) this.video.cancelVideoFrameCallback(this.vfc);
    this.vfc = 0;
  }

  destroy() {
    this.stop();
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
  }

  setVisible(v: boolean) {
    this.visible = v;
  }

  /** Update canvas backing store + which part of the video is shown. */
  resize(cssW: number, cssH: number, dpr: number, focusX = 0.53) {
    const scale = Math.min(dpr, 1.5, 2048 / Math.max(cssW, 1));
    const w = Math.max(2, Math.round(cssW * scale));
    const h = Math.max(2, Math.round(cssH * scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
    const aspect = cssW / cssH;
    const wideAspect = WIDE_CROP.w / WIDE_CROP.h;
    if (aspect >= wideAspect - 0.001) {
      this.crop = { ...WIDE_CROP };
    } else {
      // narrower layouts: keep full height, crop around the character
      const cw = VIDEO_H * aspect;
      const cx = clamp(focusX * VIDEO_W - cw / 2, 0, WIDE_CROP.x + WIDE_CROP.w - cw);
      this.crop = { x: cx, y: 0, w: cw, h: VIDEO_H };
    }
  }

  /** Pointer position in client px (desktop) — or null when it leaves the page. */
  setPointer(x: number | null, y?: number) {
    if (x === null) {
      this.pointer = null;
      return;
    }
    this.pointer = { x, y: y as number };
    this.lastMove = performance.now();
  }

  /** Touch devices: subtle automatic eye movement. */
  setAuto(on: boolean) {
    this.auto = on;
  }

  /** Test hook: force a frame + gaze (used by the QA script only). */
  async debugRender(frame: number, gaze: Vec2, face: Vec2 = { x: 0, y: 0 }) {
    this.video.pause();
    this.video.currentTime = frame / FPS + 0.5 / FPS;
    await new Promise<void>((r) => this.video.addEventListener('seeked', () => r(), { once: true }));
    this.uploadFrame(frame / FPS);
    this.debug = { gaze, face };
    for (const s of this.eyeSpring) { s.x = gaze.x; s.y = gaze.y; s.vx = s.vy = 0; }
    this.faceSpring.x = face.x; this.faceSpring.y = face.y; this.faceSpring.vx = this.faceSpring.vy = 0;
    this.strength = [FRAMES[frame][0][2], FRAMES[frame][1][2]];
    this.draw();
  }

  /* --------------------------------------------------------------- frames */

  private uploadFrame(mediaTime: number) {
    if (this.dead) return;
    const v = this.video;
    if (v.readyState < 2) return;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.vTex);
    try {
      if (!this.texAllocated) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
        this.texAllocated = true;
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, v);
      }
    } catch (err) {
      this.fail('texture upload: ' + (err as Error).message);
      return;
    }
    this.frameIdx = ((Math.round(mediaTime * FPS) % N_FRAMES) + N_FRAMES) % N_FRAMES;
    this.haveFrame = true;
    this.lastVideoTime = mediaTime;
  }

  /* ----------------------------------------------------------------- loop */

  private tick = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, (now - this.lastT) / 1000);
    this.lastT = now;

    // fallback for browsers without requestVideoFrameCallback
    if (!this.hasRVFC) {
      if (this.video.currentTime !== this.lastVideoTime) this.uploadFrame(this.video.currentTime);
    }
    if (!this.haveFrame || !this.visible) return;
    this.update(now, dt);
    this.draw();
    if (!this.readySent) {
      this.readySent = true;
      this.opts.onReady?.();
    }
  };

  private eyeScreen(e: number, rect: DOMRect): Vec2 {
    const d = FRAMES[this.frameIdx][e];
    return {
      x: rect.left + ((d[0] - this.crop.x) / this.crop.w) * rect.width,
      y: rect.top + ((d[1] - this.crop.y) / this.crop.h) * rect.height,
    };
  }

  private update(now: number, dt: number) {
    if (this.debug) return;
    const rect = this.canvas.getBoundingClientRect();
    const norm = clamp(window.innerWidth * 0.22, 180, 380);
    const idle = smooth(1.4, 3.6, (now - this.lastMove) / 1000); // 0 = active, 1 = settled at rest

    const targets: Vec2[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    if (this.auto && !this.pointer) {
      // gentle wandering gaze, occasionally back to camera
      if (now > this.autoNext) {
        const spots: Vec2[] = [
          { x: -0.85, y: -0.15 }, { x: 0.8, y: -0.1 }, { x: 0.15, y: -0.55 }, { x: -0.5, y: 0.35 },
          { x: 0.55, y: 0.3 }, { x: 0, y: 0 }, { x: 0, y: 0 },
        ];
        this.autoTarget = spots[Math.floor(Math.random() * spots.length)];
        this.autoNext = now + 1500 + Math.random() * 2200;
      }
      targets[0] = targets[1] = this.autoTarget;
    } else if (this.pointer) {
      for (let e = 0; e < 2; e++) {
        const s = this.eyeScreen(e, rect);
        const vx = this.pointer.x - s.x;
        const vy = this.pointer.y - s.y;
        const d = Math.hypot(vx, vy);
        if (d > 0.5) {
          const mag = Math.tanh(d / norm);
          targets[e] = { x: (vx / d) * mag * (1 - idle), y: (vy / d) * mag * (1 - idle) };
        }
      }
    }

    // eyes react first (snappy spring), the face follows later and much softer
    for (let e = 0; e < 2; e++) stepSpring(this.eyeSpring[e], targets[e].x, targets[e].y, 120, 0.85, dt);
    const fx = (this.eyeSpring[0].x + this.eyeSpring[1].x) / 2;
    const fy = (this.eyeSpring[0].y + this.eyeSpring[1].y) / 2;
    stepSpring(this.faceSpring, fx, fy, 16, 1.0, dt);

    // blink-aware strength: fades in slowly, out quickly
    const fd = FRAMES[this.frameIdx];
    for (let e = 0; e < 2; e++) {
      const tgt = fd[e][2];
      const tau = tgt > this.strength[e] ? 0.16 : 0.03;
      this.strength[e] += (tgt - this.strength[e]) * (1 - Math.exp(-dt / tau));
    }
  }

  private draw() {
    if (this.dead) return;
    const gl = this.gl;
    const fd = FRAMES[this.frameIdx];
    const T = this.tuning;

    const A = new Float32Array(8);
    const B = new Float32Array(8);
    const C = new Float32Array(8);

    // Both eyes share the same travel limits so they always move as a pair.
    let limL = T.capX, limR = T.capX, limU = T.capUp, limD = T.capDown;
    for (let e = 0; e < 2; e++) {
      const d = fd[e];
      const rI = R_I[e];
      limL = Math.min(limL, d[8] + T.tuckX * rI);
      limR = Math.min(limR, d[9] + T.tuckX * rI);
      limU = Math.min(limU, d[10] + T.tuckUp * rI);
      limD = Math.min(limD, d[11] + T.tuckDown * rI);
    }
    for (let e = 0; e < 2; e++) {
      const d = fd[e];
      const g = this.eyeSpring[e];
      const gx = clamp(g.x, -1.15, 1.15);
      const gy = clamp(g.y, -1.15, 1.15);
      const tx = gx > 0 ? gx * limR : gx * limL;
      const ty = gy > 0 ? gy * limD : gy * limU;
      A.set([d[0], d[1], R_I[e], this.strength[e]], e * 4);
      B.set([tx, ty, d[3], d[4]], e * 4);
      C.set([d[5], d[6], d[7], this.frameIdx * 2 + e], e * 4);
    }

    // head geometry from the measured eye centres
    const l = fd[0], r = fd[1];
    const mx = (l[0] + r[0]) / 2, my = (l[1] + r[1]) / 2;
    const sp = Math.hypot(r[0] - l[0], r[1] - l[1]);
    const f = this.faceSpring;
    const fx = f.x * T.faceX, fy = f.y * T.faceY;

    gl.uniform4f(this.U.uCrop, this.crop.x, this.crop.y, this.crop.w, this.crop.h);
    gl.uniform4f(this.U.uHead, mx, my + sp * 0.3, sp * 1.35, sp * 1.05);
    gl.uniform4f(this.U.uPar, mx, my, sp * 0.95, sp * 0.5);
    gl.uniform4f(this.U.uFace, fx, fy, fx * T.parallax, fy * T.parallax);
    gl.uniform4fv(this.U.uA, A);
    gl.uniform4fv(this.U.uB, B);
    gl.uniform4fv(this.U.uC, C);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
