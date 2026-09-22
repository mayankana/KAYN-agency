/** Placeholder artwork for the work cards — swap for real project imagery. */
export default function Art({ kind }: { kind: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (kind === 'wheel')
    return (
      <svg viewBox="0 0 240 240" aria-hidden="true" {...common}>
        <circle cx="120" cy="120" r="92" />
        <circle cx="120" cy="120" r="70" />
        <circle cx="120" cy="120" r="16" />
        <path d="M120 104V50M106 130 62 170M134 130l44 40" />
      </svg>
    );
  if (kind === 'weights')
    return (
      <svg viewBox="0 0 240 240" aria-hidden="true" {...common}>
        <rect x="20" y="84" width="26" height="72" rx="6" />
        <rect x="52" y="64" width="26" height="112" rx="6" />
        <path d="M78 120h84" />
        <rect x="162" y="64" width="26" height="112" rx="6" />
        <rect x="194" y="84" width="26" height="72" rx="6" />
        <path d="M100 196h40M120 196v22" opacity=".4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 240 240" aria-hidden="true" {...common}>
      <rect x="56" y="124" width="128" height="56" rx="10" />
      <rect x="76" y="82" width="88" height="42" rx="10" />
      <path d="M56 146c14 12 24 12 34 0 10 12 20 12 30 0 10 12 20 12 30 0 10 12 20 12 34 0" />
      <path d="M120 82V58" />
      <path d="M120 40c8 8 8 14 0 18-8-4-8-10 0-18Z" />
      <path d="M40 180h160" opacity=".4" />
    </svg>
  );
}
