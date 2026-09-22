import { useEffect, useRef, useState } from 'react';
import videoSrc from '../assets/gecko.mp4';
import atlasSrc from '../assets/eye-atlas.png';
import type { CharacterEngine } from '../engine/CharacterEngine';

type Mode = 'loading' | 'live' | 'fallback';

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('atlas failed'));
    img.src = src;
  });
}

function dataUriToBlobUrl(uri: string) {
  const [head, b64] = uri.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'video/mp4';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

function whenReady(video: HTMLVideoElement) {
  return new Promise<void>((res, rej) => {
    let retried = false;
    const ok = () => {
      cleanup();
      res();
    };
    const bad = () => {
      if (!retried && video.src.startsWith('data:')) {
        retried = true; // some hosts block data: media — retry as a blob
        video.src = dataUriToBlobUrl(video.src);
        video.load();
        return;
      }
      cleanup();
      rej(new Error('video failed'));
    };
    const cleanup = () => {
      video.removeEventListener('loadeddata', ok);
      video.removeEventListener('error', bad);
    };
    video.addEventListener('loadeddata', ok);
    video.addEventListener('error', bad);
    if (video.readyState >= 2) ok();
  });
}

export default function CharacterStage({ onLive }: { onLive?: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>('loading');

  useEffect(() => {
    const wrapEl = wrap.current!;
    const canvasEl = canvas.current!;
    const videoEl = video.current!;
    let engine: CharacterEngine | null = null;
    let cancelled = false;
    let touchTimer = 0;
    const undo: Array<() => void> = [];

    const tryPlay = () => videoEl.play().catch(() => undefined);

    (async () => {
      try {
        const [{ CharacterEngine }, atlas] = await Promise.all([import('../engine/CharacterEngine'), loadImage(atlasSrc)]);
        await whenReady(videoEl);
        if (cancelled) return;
        tryPlay();
        engine = new CharacterEngine({
          canvas: canvasEl,
          video: videoEl,
          atlas,
          onReady: () => {
            setMode('live');
            onLive?.();
          },
          onFail: () => setMode('fallback'),
        });
        const eng = engine;

        const fit = () => eng.resize(wrapEl.clientWidth, wrapEl.clientHeight, window.devicePixelRatio || 1);
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(wrapEl);
        undo.push(() => ro.disconnect());

        const io = new IntersectionObserver(([e]) => {
          eng.setVisible(e.isIntersecting);
          if (e.isIntersecting) tryPlay();
          else videoEl.pause();
        });
        io.observe(wrapEl);
        undo.push(() => io.disconnect());

        const onMove = (e: PointerEvent) => {
          eng.setPointer(e.clientX, e.clientY);
          if (e.pointerType === 'touch') {
            window.clearTimeout(touchTimer);
            touchTimer = window.setTimeout(() => eng.setPointer(null), 1800);
          }
        };
        const onLeave = () => eng.setPointer(null);
        window.addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('mouseleave', onLeave);
        undo.push(() => {
          window.removeEventListener('pointermove', onMove);
          document.documentElement.removeEventListener('mouseleave', onLeave);
        });

        // no mouse → the character glances around on its own
        const coarse = window.matchMedia('(pointer: coarse)');
        eng.setAuto(coarse.matches);
        const onCoarse = () => eng.setAuto(coarse.matches);
        coarse.addEventListener('change', onCoarse);
        undo.push(() => coarse.removeEventListener('change', onCoarse));

        const onVis = () => (document.hidden ? videoEl.pause() : tryPlay());
        document.addEventListener('visibilitychange', onVis);
        undo.push(() => document.removeEventListener('visibilitychange', onVis));
        const unlock = () => tryPlay();
        window.addEventListener('pointerdown', unlock, { once: true });
        undo.push(() => window.removeEventListener('pointerdown', unlock));

        eng.start();
      } catch (err) {
        console.warn('[KAYN] interactive character unavailable, showing plain video:', err);
        if (!cancelled) {
          setMode('fallback');
          tryPlay();
          onLive?.();
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(touchTimer);
      undo.forEach((f) => f());
      engine?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`stage is-${mode}`} ref={wrap} aria-hidden="true">
      <canvas ref={canvas} className="stage-canvas" />
      <video ref={video} className="stage-video" src={videoSrc} muted loop playsInline autoPlay preload="auto" />
    </div>
  );
}
