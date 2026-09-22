import { useEffect, useState } from 'react';
import { NAV } from '../content';
import { WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../whatsapp';

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={`nav${solid ? ' is-solid' : ''}${open ? ' is-open' : ''}`}>
      <a className="logo" href="#top" aria-label="KAYN — home" onClick={() => setOpen(false)}>
        KAYN
      </a>
      <nav className="nav-links" aria-label="Primary">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
            {n.label}
          </a>
        ))}
      </nav>
      <div className="nav-right">
        <span className="status">
          <i aria-hidden="true" />
          AVAILABLE FOR WORK
        </span>
        <a
          className="btn btn-sm"
          href={buildWhatsAppUrl(WHATSAPP_MESSAGES.general)}
          target="_blank"
          rel="noopener noreferrer"
        >
          START A PROJECT
        </a>
        <button
          className="menu-btn"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
