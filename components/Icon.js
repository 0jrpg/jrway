// Catálogo de ícones SVG inline — substitui os emojis da interface toda.
// Estilo: traço (stroke) herdando `currentColor`, viewBox 24, sem dependências.
//
// Els aceitos por ícone:
//   'path-d'                → <path d>, traço
//   { t:'c', x, y, r }      → <circle>, traço
//   { t:'c', x, y, r, f:1 } → <circle>, preenchido
//   { d, f:1 }              → <path>, preenchido
//   { d, w }                → <path> com espessura própria

const ICONS = {
  /* ── ícones de links (equivalentes ao antigo picker de emojis) ── */
  link: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  briefcase: ['M5 7.5h14a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2z', 'M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5', 'M3 12.5h18'],
  camera: ['M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5l-2-3z', { t: 'c', x: 12, y: 13, r: 3.4 }],
  film: ['M4 4h16a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 4 4z', 'M7.5 4v16', 'M16.5 4v16', 'M3 12h4.5', 'M16.5 12H21', 'M7.5 8h9', 'M7.5 16h9'],
  music: ['M9.5 18V5.5l10-2v12.5', { t: 'c', x: 7, y: 18, r: 2.4 }, { t: 'c', x: 17, y: 16, r: 2.4 }],
  bird: ['M22 4.6c-.8.4-1.6.7-2.4.8a4.3 4.3 0 0 0 1.9-2.4c-.9.6-1.8 1-2.8 1.2a4.2 4.2 0 0 0-7.3 3.9A12.1 12.1 0 0 1 3 3.7a4.2 4.2 0 0 0 1.3 5.6c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.7 3.4 4.1-.6.2-1.3.2-1.9.1a4.2 4.2 0 0 0 4 3 8.6 8.6 0 0 1-6.4 1.8A12.2 12.2 0 0 0 8.4 20c7.7 0 11.9-6.4 11.9-11.9v-.6c.8-.7 1.5-1.6 2-2.4z'],
  play: [{ d: 'M7.5 4.8v14.4L20 12z', f: 1 }],
  mail: ['M3.5 6.5A2 2 0 0 1 5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11z', 'M3.8 7.2 12 13l8.2-5.8'],
  cart: [{ t: 'c', x: 9, y: 20, r: 1.5 }, { t: 'c', x: 17, y: 20, r: 1.5 }, 'M3 4h2l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L21 8H5.9'],
  coffee: ['M4.5 8.5h11.5v5.5a5 5 0 0 1-5 5h-1.5a5 5 0 0 1-5-5V8.5z', 'M16 9.5h1.8a2.5 2.5 0 0 1 0 5H16', 'M6.5 3.5v2', 'M10 3v2.5', 'M13.5 3.5v2'],
  gamepad: ['M7 6.5h10a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5h-.6a3 3 0 0 1-2.3-1.1L12 14.8l-2.1 2.6A3 3 0 0 1 7.6 18.5H7a5 5 0 0 1-5-5v-2a5 5 0 0 1 5-5z', 'M6.5 11.5h4', { d: 'M8.5 9.5v4', w: 2 }, { t: 'c', x: 15.5, y: 10.5, r: 1, f: 1 }, { t: 'c', x: 17.8, y: 13, r: 1, f: 1 }],
  book: ['M4 19.5a2.5 2.5 0 0 1 2.5-2.5H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  rocket: ['M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z', 'M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z', 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0', 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5'],
  chat: ['M20.5 12.4a8.6 8.6 0 0 1-12.3 7.6L3.5 20.7l1.2-4.4A8.6 8.6 0 1 1 20.5 12.4z', 'M8.5 11.4h7', 'M8.5 14.6h4.5'],
  globe: [{ t: 'c', x: 12, y: 12, r: 9 }, 'M3 12h18', 'M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z'],
  coin: [{ t: 'c', x: 12, y: 12, r: 9 }, 'M12 6.8v10.4', 'M14.8 9.5A2.6 2.6 0 0 0 12.3 8c-1.4 0-2.5.8-2.5 2 0 2.7 5.5 1.6 5.5 4.3 0 1.2-1.1 2-2.7 2-1.3 0-2.4-.6-2.9-1.5'],

  /* ── interface ── */
  user: [{ t: 'c', x: 12, y: 8, r: 3.6 }, 'M5 20a7 7 0 0 1 14 0'],
  palette: ['M12 3a9 9 0 1 0 .3 18h1.9a2 2 0 0 0 1.3-3.5 2 2 0 0 1 1.3-3.5H19a2.5 2.5 0 0 0 2.5-2.5A9 9 0 0 0 12 3z', { t: 'c', x: 7.2, y: 10.2, r: 1 }, { t: 'c', x: 11.8, y: 7.4, r: 1 }, { t: 'c', x: 16.4, y: 9.4, r: 1 }],
  image: ['M5.5 3.5h13A2 2 0 0 1 20.5 5.5v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z', { t: 'c', x: 9, y: 9.5, r: 1.7 }, 'M20 16.5l-5-5-4.5 4.5L8 13.5l-4.5 4.5'],
  chart: ['M5 20v-6', 'M11 20V8', 'M17 20v-10', 'M3 20h18'],
  bolt: ['M13 2.5 3.5 14H10l-1 7.5L18.5 10H12l1-7.5z'],
  sparkle: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', 'M18.5 3.5v2.4', 'M17.3 4.7h2.4'],
  scissors: [{ t: 'c', x: 6, y: 6, r: 2.8 }, { t: 'c', x: 6, y: 18, r: 2.8 }, 'M20 4 8.2 15.7', { d: 'M14.6 14.6 20 20', w: 2 }, { d: 'M8.2 8.2 12 12', w: 2 }],
  bell: ['M18 9.5a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17s-2.5-1-2.5-7z', 'M10 20a2.2 2.2 0 0 0 4 0'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M8 11V7.5a4 4 0 0 1 8 0V11'],
  trash: ['M4 7h16', 'M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7', 'M6 7l.8 12.2A2 2 0 0 0 8.8 21h6.4a2 2 0 0 0 2-1.8L18 7', 'M10 11v6', 'M14 11v6'],
  eye: ['M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z', { t: 'c', x: 12, y: 12, r: 2.8 }],
  eyeOff: ['M4 4l16 16', 'M9.9 5.9A10.9 10.9 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17.9 17.9 0 0 1-3.2 3.9', 'M6.6 6.6C3.8 8.5 2 12 2 12s3.6 6.5 10 6.5a10.4 10.4 0 0 0 4.3-.9', 'M9.9 9.9a2.8 2.8 0 0 0 4 3.9'],
  arrowUp: ['M12 19.5V4.5', 'M6 10.5l6-6 6 6'],
  arrowDown: ['M12 4.5v15', 'M6 13.5l6 6 6-6'],
  arrowRight: ['M4.5 12h15', 'M13.5 6l6 6-6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  x: ['M6 6l12 12', 'M18 6 6 18'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  clock: [{ t: 'c', x: 12, y: 12, r: 9 }, 'M12 7.5V12l3 2'],
  warn: ['M10.3 4.3 2.6 17.5a2.3 2.3 0 0 0 2 3.5h14.8a2.3 2.3 0 0 0 2-3.5L13.7 4.3a2 2 0 0 0-3.4 0z', 'M12 9.5v4.7', 'M12 17.1v.01'],
  copy: ['M9.5 9.5a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-7.5a2 2 0 0 1-2-2V9.5z', 'M5 15H4.5A2.5 2.5 0 0 1 2 12.5v-8A2.5 2.5 0 0 1 4.5 2h8A2.5 2.5 0 0 1 15 4.5V5'],
  external: ['M14 4h6v6', 'M20 4l-8.5 8.5', 'M19 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.5'],
  rotateCcw: ['M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8', 'M3 3v5h5'],
  rotateCw: ['M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L21 8', 'M21 3v5h-5'],
  flip: ['M12 3.5v17', 'M7.5 8 3.5 12l4 4', 'M16.5 8l4 4-4 4'],
  pause: ['M8.5 5v14', 'M15.5 5v14'],
  shield: ['M12 2.5l8 3.5v5.5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6z', 'M8.5 11.5l2.5 2.5 4.5-4.5'],
  wrench: ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-8 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-8z'],
  ban: [{ t: 'c', x: 12, y: 12, r: 9 }, 'M5.7 5.7l12.6 12.6'],
  sprout: ['M12 21.5v-7.5', 'M12 14c0-3.4-2.4-5.9-6-6.3.3 3.4 2.9 6 6 6.3z', 'M12 12.5c0-2.8 2.1-5 5.5-5.4-.3 2.9-2.4 5.1-5.5 5.4z', 'M6.5 21.5h11'],
  pointer: [{ d: 'M5 3l7.3 17.5 2.5-6.9 6.9-2.5z', f: 1 }],
  heart: [{ d: 'M12 20.6S3.5 15.4 3.5 9.3A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.7c0 6.1-8.5 11.3-8.5 11.3z', f: 1 }],
  send: ['M21.5 2.5 11 13', 'M21.5 2.5 14.5 21l-3.5-8-8-3.5z'],
  bell2: ['M18 9.5a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17s-2.5-1-2.5-7z', 'M10 20a2.2 2.2 0 0 0 4 0'],

  /* ── glifos de marca (simplificados, traço corrente) ── */
  instagram: ['M7 3.5h10a3.5 3.5 0 0 1 3.5 3.5v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5z', { t: 'c', x: 12, y: 12, r: 4 }, { t: 'c', x: 16.9, y: 7.1, r: 1.1, f: 1 }],
  tiktok: ['M14 3.5v10.9a4.4 4.4 0 1 1-3-4.2', 'M14 3.5c.4 2.4 2.1 4 4.5 4.3'],
  whatsapp: ['M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1.1-4.5A8.5 8.5 0 1 1 20.5 12z', 'M9.3 8.5c.3-.8.8-.9 1.1-.3l.7 1.3c.1.3.1.5-.1.7l-.5.5c.4 1 1.6 2.2 2.6 2.6l.5-.5c.2-.2.4-.2.7-.1l1.4.7c.6.3.5.8-.3 1.1-2.4.6-6.7-3.7-6.1-6z'],
};

// Selo de verificado: CIRCULO fica por conta do CSS (.pv-badge tem fundo em
// gradiente); o SVG desenha só o "check" branco no centro.
function BadgeCheck({ size, className, style }) {
  return (
    <svg className={`icn ${className || ''}`} width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true" focusable="false">
      <path d="M6.4 12.6l4 4 7-7.6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function hasIcon(name) {
  return name === 'badgeCheck' || Boolean(ICONS[name]);
}

export default function Icon({ name, size = 16, strokeWidth = 2, className = '', style }) {
  if (name === 'badgeCheck') return <BadgeCheck size={size} className={className} style={style} />;
  const els = ICONS[name];
  if (!els) return null;
  return (
    <svg
      className={`icn ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {els.map((el, i) => {
        if (typeof el === 'string') return <path key={i} d={el} />;
        if (el.t === 'c') {
          return el.f
            ? <circle key={i} cx={el.x} cy={el.y} r={el.r} fill="currentColor" stroke="none" />
            : <circle key={i} cx={el.x} cy={el.y} r={el.r} />;
        }
        return <path key={i} d={el.d} fill={el.f ? 'currentColor' : 'none'} strokeWidth={el.w || strokeWidth} />;
      })}
    </svg>
  );
}

// Ícones disponíveis para o usuário escolher em um link.
export const LINK_ICONS = [
  'link', 'briefcase', 'camera', 'film', 'music', 'bird', 'play', 'mail',
  'cart', 'coffee', 'gamepad', 'book', 'rocket', 'chat', 'globe', 'coin'
];
