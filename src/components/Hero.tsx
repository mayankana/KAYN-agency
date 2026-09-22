import { useEffect, useState } from 'react';
import CharacterStage from './CharacterStage';

export default function Hero() {
  const [live, setLive] = useState(false);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setLive(true), 3500); // never leave the page blank
    const on = () => setMoved(true);
    window.addEventListener('pointermove', on, { once: true, passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('pointermove', on);
    };
  }, []);

  return (
    <section id="top" className={`hero${live ? ' is-live' : ''}`}>
      <CharacterStage onLive={() => setLive(true)} />
      <div className="hero-glow" aria-hidden="true" />

      <h1 className="hero-title">
        <span className="sr-only">We Build. You Grow.</span>
        <span className="hl hl-left" aria-hidden="true">
          <span className="ln"><span>We</span></span>
          <span className="ln"><span>Build.</span></span>
        </span>
        <span className="hl hl-right" aria-hidden="true">
          <span className="ln"><span>You</span></span>
          <span className="ln"><span>Grow.</span></span>
        </span>
      </h1>

      <div className="hero-foot">
        <p className="hero-sub">Websites, AI agents, video and social media. One team, one standard.</p>
        <p className={`hero-hint${moved ? ' is-hidden' : ''}`}>Move your cursor. Someone is watching.</p>
      </div>
    </section>
  );
}
