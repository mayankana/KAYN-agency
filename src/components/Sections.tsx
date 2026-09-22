import type { ReactNode } from 'react';
import { CONFIG, PROCESS, SERVICES, WHY, WORK } from '../content';
import { WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../whatsapp';
import Art from './Art';

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l) => (
        <span className="ln" key={l}>
          <span>{l}</span>
        </span>
      ))}
    </>
  );
}

function Head({ label, lines, sub }: { label: string; lines: string[]; sub?: ReactNode }) {
  return (
    <div className="sec-head">
      <p className="sec-label">{label}</p>
      <h2 className="sec-title" data-lines>
        <Lines lines={lines} />
      </h2>
      {sub && <p className="sec-sub">{sub}</p>}
    </div>
  );
}

export function Services() {
  return (
    <section id="services" className="sec services">
      <Head
        label="01 — SERVICES"
        lines={['Four ways we', 'help you grow.']}
        sub="One team across the whole digital surface of your business, so the site, the automation, the video and the socials all speak with one voice."
      />
      <ul className="svc-list">
        {SERVICES.map((s) => (
          <li className="svc" key={s.name}>
            <a
              className="svc-link"
              href={buildWhatsAppUrl(WHATSAPP_MESSAGES.services[s.name] ?? WHATSAPP_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat on WhatsApp about ${s.name}`}
              data-cursor
            >
              <h3 className="svc-name">{s.name}</h3>
              <p className="svc-text">{s.text}</p>
              <ul className="svc-tags" aria-label="Includes">
                {s.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <span className="svc-arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Work() {
  return (
    <section id="work" className="sec work">
      <Head label="02 — SELECTED WORK" lines={['Local brands,', 'built to be noticed.']} />
      <div className="work-grid">
        {WORK.map((w, i) => (
          <a className={`card card-${i + 1}`} href={w.href} key={w.name} data-cursor data-parallax={i > 0 ? '' : undefined}>
            <div className="card-art">
              <Art kind={w.art} />
              <span className="card-view">View project</span>
            </div>
            <div className="card-meta">
              <h3>{w.name}</h3>
              <p className="card-kind">{w.kind}</p>
              <p className="card-text">{w.text}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function Why() {
  return (
    <section id="why" className="sec why">
      <Head label="03 — WHY KAYN" lines={['An agency that', 'ships, not slides.']} />
      <div className="why-grid">
        {WHY.map((w) => (
          <article className="why-item" key={w.name}>
            <h3>{w.name}</h3>
            <p>{w.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Process() {
  return (
    <section id="process" className="sec process">
      <Head label="04 — PROCESS" lines={['From first call', 'to full growth.']} />
      <div className="process-steps">
        <div className="process-line" aria-hidden="true"><i /></div>
        <ol>
          {PROCESS.map((p) => (
            <li key={p.n}>
              <span className="step-n">{p.n}</span>
              <h3>{p.name}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const ABOUT = "We don't just make things look good. We make them work.".split(' ');

export function About() {
  return (
    <section id="about" className="sec about">
      <p className="sec-label">05 — ABOUT</p>
      <p className="about-text" aria-label="We don't just make things look good. We make them work.">
        {ABOUT.map((w, i) => (
          <span className="about-word" aria-hidden="true" key={i}>
            {w}{' '}
          </span>
        ))}
      </p>
      <p className="about-body">
        KAYN is a digital agency for businesses that want more than a nice-looking page. Websites, AI agents, video and social
        media come from the same team, built around one goal: your growth.
      </p>
    </section>
  );
}

export function Cta() {
  return (
    <section id="contact" className="cta">
      <h2 data-lines>
        <Lines lines={['Ready to build', "what's next?"]} />
      </h2>
      <a
        className="btn btn-xl"
        href={buildWhatsAppUrl(WHATSAPP_MESSAGES.general)}
        target="_blank"
        rel="noopener noreferrer"
      >
        START A PROJECT →
      </a>
      <ul className="cta-links" aria-label="Contact">
        <li>
          <a className="cta-wa" href={buildWhatsAppUrl(WHATSAPP_MESSAGES.general)} target="_blank" rel="noopener noreferrer">
            Chat on WhatsApp
          </a>
        </li>
        <li><a href={CONFIG.contactHref}>{CONFIG.contactLabel}</a></li>
        {CONFIG.phones.map((ph) => (
          <li key={ph.href}><a href={ph.href}>{ph.label}</a></li>
        ))}
        <li><a href={CONFIG.instagramHref} target="_blank" rel="noopener noreferrer">Instagram {CONFIG.instagramLabel}</a></li>
      </ul>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer-mark" aria-hidden="true">KAYN</p>
      <div className="footer-row">
        <p>{CONFIG.tagline}</p>
        <p className="footer-links">
          <a href={buildWhatsAppUrl(WHATSAPP_MESSAGES.general)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href={CONFIG.contactHref}>Email</a>
          <a href={CONFIG.instagramHref} target="_blank" rel="noopener noreferrer">Instagram</a>
          {CONFIG.phones.map((ph) => (
            <a key={ph.href} href={ph.href}>Call</a>
          ))}
        </p>
        <p>© 2026 KAYN. All rights reserved.</p>
      </div>
    </footer>
  );
}
