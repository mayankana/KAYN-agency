import { useEffect, useRef } from 'react';

/** Minimal cursor: a small dot plus a soft mint glow that trails it. Fine pointers only. */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const root = document.documentElement;
    root.classList.add('has-cursor');
    let tx = -100, ty = -100, gx = -100, gy = -100, raf = 0, shown = false;

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        gx = tx;
        gy = ty;
        root.classList.add('cursor-on');
      }
    };
    const over = (e: Event) => {
      const t = e.target as Element | null;
      root.classList.toggle('cursor-link', !!t?.closest('a,button,[data-cursor]'));
    };
    const leave = () => {
      shown = false;
      root.classList.remove('cursor-on');
    };
    const loop = () => {
      gx += (tx - gx) * 0.14;
      gy += (ty - gy) * 0.14;
      if (dot.current) dot.current.style.transform = `translate3d(${tx}px,${ty}px,0)`;
      if (glow.current) glow.current.style.transform = `translate3d(${gx}px,${gy}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('mouseover', over, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('mouseover', over);
      document.documentElement.removeEventListener('mouseleave', leave);
      root.classList.remove('has-cursor', 'cursor-on', 'cursor-link');
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor-glow" ref={glow} />
      <div className="cursor-dot" ref={dot} />
    </div>
  );
}
