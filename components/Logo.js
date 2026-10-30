// Logo do JRWay: um "caminho" (way) que serpenteia até um ponto de chegada.
//
// O traço em S remete ao trilho/jornada — a letra J da marca — e o pontinho
// no fim é o destino. Tudo desenhado em SVG puro, com gradiente próprio.
// Usado no mesmo tamanho (proporcional ao texto) nas várias batentes da UI.

export default function Logo({ size = 26, className = 'logo-mark' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="jrw-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#00e0ff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill="url(#jrw-g)" />
      {/* caminho serpenteando até o destino */}
      <path
        d="M16 51c14 0 17-9 10-13.5-8-5-3-14 8-14"
        fill="none"
        stroke="#fff"
        strokeWidth="6.4"
        strokeLinecap="round"
        strokeDasharray="0"
      />
      <circle cx="41.5" cy="17.5" r="6.5" fill="#fff" />
      <circle cx="41.5" cy="17.5" r="2.6" fill="#58c4ff" />
    </svg>
  );
}
