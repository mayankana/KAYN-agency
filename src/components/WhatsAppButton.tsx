import { WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../whatsapp';

/** Fixed bottom-right chat entry point. A plain <a href> so it works with JS disabled too. */
export default function WhatsAppButton() {
  return (
    <a
      className="wa-fab"
      href={buildWhatsAppUrl(WHATSAPP_MESSAGES.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      data-cursor
    >
      <span className="wa-fab-tip">Chat on WhatsApp</span>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="wa-fab-icon">
        <path
          fill="currentColor"
          d="M16 4C9.4 4 4 9.4 4 16c0 2.2.6 4.3 1.7 6.1L4 28l6.1-1.6A11.9 11.9 0 0 0 16 28c6.6 0 12-5.4 12-12S22.6 4 16 4Z"
          opacity=".14"
        />
        <path
          fill="currentColor"
          d="M16 5.6C10.3 5.6 5.6 10.3 5.6 16c0 1.9.5 3.7 1.5 5.3l.2.4-1 3.7 3.8-1 .4.2c1.5.9 3.3 1.4 5.1 1.4 5.7 0 10.4-4.7 10.4-10.4S21.7 5.6 16 5.6Zm5.9 14.6c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.6-.6-2.9-1.2-4.8-4.1-4.9-4.3-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.2-.3.3-.1.6.2.3.9 1.5 1.9 2.4 1.3 1.2 2.4 1.5 2.7 1.7.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.7-.1.3.1 1.7.8 2 1 .3.1.5.2.6.3.1.2.1.9-.1 1.6Z"
        />
      </svg>
    </a>
  );
}
