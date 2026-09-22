# KAYN — agency website

Cinematic one-page site for KAYN ("We Build. You Grow."), built with React,
TypeScript and Vite. The hero features an interactive 3D character: the
original character video plays through WebGL2, with the eyes and a subtle
head parallax tracking the visitor's cursor.

## Getting started

```bash
npm install
npm run dev        # local dev server, http://localhost:5173
```

## Building

```bash
npm run build         # standard site: dist/index.html + separate asset files
npm run build:single  # one self-contained dist/index.html (video/fonts inlined)
```

Use `build` for normal hosting (Vercel, Netlify, Cloudflare Pages, S3, etc.) —
it's smaller to transfer since assets are cacheable separately. Use
`build:single` only if you need a single portable HTML file.

## Editing content

Almost everything you'd want to change lives in one file:

- **`src/content.ts`** — brand name, tagline, nav links, service copy, work
  case studies, "why us" / process copy, email, phone numbers, Instagram.
- **`src/whatsapp.ts`** — the WhatsApp number and every pre-filled message
  template. Change `WHATSAPP_NUMBER` here and every WhatsApp button/link on
  the site updates automatically.
- **`src/styles.css`** — all colors, type, spacing. Design tokens (mint,
  ink, pink accent, fonts) are CSS variables at the top of the file.
- **`src/components/`** — one file per section (`Hero.tsx`, `Sections.tsx`,
  `Nav.tsx`, `WhatsAppButton.tsx`, `Cursor.tsx`, `CharacterStage.tsx`).

## The interactive character

- `src/assets/gecko.mp4` — the source character video (plays through WebGL2
  as a texture; never re-rendered or regenerated).
- `src/assets/eye-atlas.png` + `src/data/eyeData.json` — per-frame eye
  position, eye-opening mask, blink visibility and travel limits, measured
  offline from the video. This is what lets the iris slide toward the
  cursor without leaving the eye socket or distorting during blinks.
- `src/engine/CharacterEngine.ts` — the WebGL2 engine: draws the video,
  composites the eyes, applies the small head parallax.

**If you ever replace the video**, the eye data must be regenerated to
match the new footage — see `tools/README.md` for the offline pipeline
(Python + OpenCV) used to produce it.

## Tech

React 19 · TypeScript · Vite · GSAP (scroll animation) · raw WebGL2 (no
Three.js — a single full-screen shader was lighter for this use case).

## Known placeholders

- Work section case studies (`WORK` in `content.ts`) use placeholder
  descriptions and simple line-art in place of real screenshots.
- No backend/CMS — all content is static, edited directly in the source.
