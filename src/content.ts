/** All copy and links live here so they are easy to edit. */
export const CONFIG = {
  brand: 'KAYN',
  tagline: 'We Build. You Grow.',
  contactHref: 'mailto:kaynn.agency@gmail.com',
  contactLabel: 'kaynn.agency@gmail.com',
  instagramHref: 'https://instagram.com/kaynn.agency',
  instagramLabel: '@kaynn.agency',
  phones: [
    { label: '+91 87551 60302', href: 'tel:+918755160302' },
    // NOTE: this number has 11 digits, one more than a standard Indian mobile number — please double-check it
    { label: '+91 72175 277967', href: 'tel:+9172175277967' },
  ],
};

export const NAV = [
  { href: '#services', label: '// services' },
  { href: '#work', label: '// work' },
  { href: '#why', label: '// why us' },
  { href: '#process', label: '// process' },
  { href: '#about', label: '// about' },
];

export const SERVICES = [
  {
    name: 'Website Development',
    text: 'Fast, custom-built websites that turn visitors into customers. Designed around your brand and coded for speed.',
    tags: ['landing pages', 'business sites', 'web apps'],
  },
  {
    name: 'AI Agents & Automation',
    text: 'Agents that answer, qualify and follow up, plus automations that take repetitive work off your plate.',
    tags: ['chat agents', 'workflows', 'integrations'],
  },
  {
    name: 'Video Editing',
    text: 'Reels, ads and long-form edits with the pacing and polish to hold attention and match your brand.',
    tags: ['reels', 'ads', 'long-form'],
  },
  {
    name: 'Social Media Management',
    text: 'Planning, content and posting handled end to end, so your pages stay active and on brand.',
    tags: ['content plans', 'posting', 'community'],
  },
];

// TODO: swap the placeholder descriptions, links and artwork for real case studies
export const WORK = [
  {
    name: 'Nambardar Self Drive',
    kind: 'Self-drive car rental',
    text: 'A booking-ready web presence for a self-drive rental brand.',
    art: 'wheel',
    href: '#',
  },
  {
    name: 'Powerhouse Gym Meerut',
    kind: 'Fitness club',
    text: 'A strong digital home for a Meerut gym: programs, memberships and community.',
    art: 'weights',
    href: '#',
  },
  {
    name: 'The Cake Factory Meerut',
    kind: 'Bakery',
    text: 'An online storefront that makes a Meerut bakery look as good as it tastes.',
    art: 'cake',
    href: '#',
  },
];

export const WHY = [
  { name: 'Built With Purpose', text: 'Every page, agent and edit starts from a business goal, never from a template.' },
  { name: 'Modern By Default', text: 'Current tools and clean code, so what we build stays fast and easy to change.' },
  { name: 'Creative + Technical', text: 'Design, development, AI and video under one roof, so nothing gets lost between teams.' },
  { name: 'Built to Grow', text: 'Foundations that scale with your traffic, your content and your ambitions.' },
];

export const PROCESS = [
  { n: '01', name: 'Discover', text: 'We learn your business, your audience and what success looks like.' },
  { n: '02', name: 'Plan', text: 'We map the scope, structure and timeline before anything is built.' },
  { n: '03', name: 'Build', text: 'Design and development in the open, with you in the loop at every step.' },
  { n: '04', name: 'Launch & Grow', text: 'We go live, watch what happens and keep improving what works.' },
];
