/**
 * WhatsApp integration — single source of truth.
 *
 * To change the number the site messages, edit WHATSAPP_NUMBER below.
 * It must be digits only, with the country code and no +, spaces, or dashes
 * (wa.me requires this exact format).
 */
export const WHATSAPP_NUMBER = '917217527797'; // 91 = India country code + 7217527797

export const WHATSAPP_MESSAGES = {
  general:
    "Hi KAYN 👋\nI'm interested in working with you.\n\n" +
    "I'd like to discuss:\n• Website Development\n• AI Agents & Automation\n• Video Editing\n• Social Media Management\n\n" +
    'Please share more details.',
  services: {
    'Website Development':
      "Hi KAYN 👋\nI'm interested in Website Development.\nI'd like to discuss my project.",
    'AI Agents & Automation':
      "Hi KAYN 👋\nI'm interested in AI Agents & Automation.\nI'd like to discuss my requirements.",
    'Video Editing': "Hi KAYN 👋\nI'm interested in Video Editing.\nI'd like to discuss my project.",
    'Social Media Management':
      "Hi KAYN 👋\nI'm interested in Social Media Management.\nI'd like to discuss my requirements.",
  } as Record<string, string>,
};

/** Builds a wa.me click-to-chat link. Works as a plain href on desktop and mobile alike. */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Programmatic open, for cases with no natural <a href> (e.g. after a form submit). */
export function openWhatsApp(message: string): void {
  const win = window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
  if (win) win.opener = null;
}

/** Turns a submitted inquiry into the WhatsApp message format KAYN asked for. */
export function buildInquiryMessage(fields: { name?: string; service?: string; budget?: string; description?: string }): string {
  const { name = '—', service = '—', budget, description = '—' } = fields;
  const budgetLine = budget ? `Budget: ${budget}\n` : '';
  return (
    'Hi KAYN 👋\n\nNew Project Inquiry\n\n' +
    `Name: ${name}\nService: ${service}\n${budgetLine}\nProject Details:\n${description}\n\n` +
    "I'd like to discuss this project further."
  );
}
