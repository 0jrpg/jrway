// Temas prontos + utilidades de tema usadas pela plataforma inteira.

export const PRESETS = {
  'meia-noite': {
    name: 'Meia-noite',
    bg1: '#0b0f1a',
    bg2: '#141b30',
    text: '#eef2ff',
    accent: '#7c5cff',
    accent2: '#00e0ff',
    effect: 'blobs'
  },
  crepusculo: {
    name: 'Crepúsculo',
    bg1: '#1c0f2e',
    bg2: '#3a1150',
    text: '#ffeaff',
    accent: '#ff6ec7',
    accent2: '#ffb86c',
    effect: 'blobs'
  },
  neon: {
    name: 'Neon',
    bg1: '#05060a',
    bg2: '#0b1216',
    text: '#f4fff8',
    accent: '#39ff14',
    accent2: '#00ffe1',
    effect: 'grid'
  },
  oceano: {
    name: 'Oceano',
    bg1: '#021830',
    bg2: '#063a66',
    text: '#e6f7ff',
    accent: '#22d3ee',
    accent2: '#6ee7b7',
    effect: 'blobs'
  },
  rosé: {
    name: 'Rosé',
    bg1: '#2b0d16',
    bg2: '#4a1020',
    text: '#ffe4ec',
    accent: '#ff8fab',
    accent2: '#ffd6a5',
    effect: 'blobs'
  },
  claro: {
    name: 'Minimal claro',
    bg1: '#f7f8fc',
    bg2: '#eaedfa',
    text: '#191c2b',
    accent: '#5b5bd6',
    accent2: '#0ea56b',
    effect: 'grid'
  }
};

export const DEFAULT_THEME = {
  preset: 'meia-noite',
  bg1: PRESETS['meia-noite'].bg1,
  bg2: PRESETS['meia-noite'].bg2,
  text: PRESETS['meia-noite'].text,
  accent: PRESETS['meia-noite'].accent,
  accent2: PRESETS['meia-noite'].accent2,
  buttonStyle: 'glass',
  radius: 16,
  font: 'inter',
  effect: PRESETS['meia-noite'].effect
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Normaliza e sanitiza qualquer tema recebido (do banco ou do formulário).
export function normalizeTheme(input) {
  const obj = input && typeof input === 'object' ? input : {};
  const t = { ...DEFAULT_THEME, ...obj };
  const hex = (v, fb) => (typeof v === 'string' && HEX_RE.test(v) ? v.toLowerCase() : fb);

  t.bg1 = hex(t.bg1, DEFAULT_THEME.bg1);
  t.bg2 = hex(t.bg2, DEFAULT_THEME.bg2);
  t.text = hex(t.text, DEFAULT_THEME.text);
  t.accent = hex(t.accent, DEFAULT_THEME.accent);
  t.accent2 = hex(t.accent2, DEFAULT_THEME.accent2);

  // Se veio só o id do preset (sem cores explícitas), adota as cores do preset.
  if (t.preset && PRESETS[t.preset]) {
    const explicit = ['bg1', 'bg2', 'text', 'accent', 'accent2'].some(
      (k) => obj[k] !== undefined && HEX_RE.test(String(obj[k]))
    );
    if (!explicit) {
      const p = PRESETS[t.preset];
      t.bg1 = p.bg1;
      t.bg2 = p.bg2;
      t.text = p.text;
      t.accent = p.accent;
      t.accent2 = p.accent2;
      t.effect = p.effect;
    }
  } else if (t.preset && !PRESETS[t.preset]) {
    t.preset = null;
  }

  t.radius = Math.min(28, Math.max(4, Number.parseInt(t.radius, 10) || DEFAULT_THEME.radius));
  if (!['glass', 'solid', 'gradient', 'outline'].includes(t.buttonStyle)) t.buttonStyle = 'glass';
  if (!['inter', 'grotesk', 'mono'].includes(t.font)) t.font = 'inter';
  if (!['blobs', 'grid', 'none'].includes(t.effect)) t.effect = 'blobs';

  return t;
}

// Aplica um tema pronto preservando as escolhas pessoais (botão, raio, fonte).
export function applyPreset(current, id) {
  const p = PRESETS[id];
  if (!p) return current;
  return {
    ...current,
    preset: id,
    bg1: p.bg1,
    bg2: p.bg2,
    text: p.text,
    accent: p.accent,
    accent2: p.accent2,
    effect: p.effect
  };
}

const FONT_STACKS = {
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  grotesk: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  mono: "ui-monospace, 'Cascadia Code', 'Consolas', monospace"
};

export function fontStack(font) {
  return FONT_STACKS[font] || FONT_STACKS.inter;
}

// Escolhe texto preto ou branco conforme a luminância da cor de fundo.
export function textColorFor(hex) {
  try {
    const c = String(hex).replace('#', '');
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.62 ? '#0c0e1a' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

/* ──────────────────────────────────────────────
   Aureola do avatar (anel em volta da foto)
   ────────────────────────────────────────────── */

// estilos: 'spin' (arco animado no tema da página) | 'solid' (anel sólido)
//          'grad' (anel degradê estático) | 'none' (sem anel)
export const DEFAULT_RING = { style: 'spin', color: null, color2: null, width: 4 };

export function normalizeRing(input) {
  const obj = input && typeof input === 'object' ? input : {};
  const hex = (v) => (typeof v === 'string' && HEX_RE.test(v) ? v.toLowerCase() : null);
  const style = ['spin', 'solid', 'grad', 'none'].includes(obj.style) ? obj.style : DEFAULT_RING.style;
  const width = Math.min(10, Math.max(2, Number.parseInt(obj.width, 10) || DEFAULT_RING.width));
  return {
    style,
    color: hex(obj.color),
    color2: hex(obj.color2),
    width: style === 'none' ? DEFAULT_RING.width : width
  };
}

/* ──────────────────────────────────────────────
   Posição do selo verificado (só perfis verificados)
   ────────────────────────────────────────────── */

export const BADGE_POSITIONS = {
  name: 'Ao lado do nome',
  username: 'Depois do @',
  avatar: 'Canto do avatar'
};

export function normalizeBadge(input) {
  return BADGE_POSITIONS[input] ? input : 'name';
}

/* ──────────────────────────────────────────────
   Temas por link (botão individual)
   ────────────────────────────────────────────── */

// Temas de marca aplicáveis a um link individual (opcional).
// Renderizados como classes CSS: pv-link--instagram, pv-link--tiktok, pv-link--whatsapp.
// icon = nome no catálogo de SVGs (components/Icon.js).
export const LINK_BRANDS = {
  instagram: { name: 'Instagram', icon: 'instagram' },
  tiktok: { name: 'TikTok', icon: 'tiktok' },
  whatsapp: { name: 'WhatsApp', icon: 'whatsapp' },
  email: { name: 'E-mail', icon: 'mail' }
};

// Lê/cria um link; sanitiza o objeto de estilo individual { bg, fg, grad, brand }.
//   bg    → cor sólida de fundo do botão (hex #rrggbb ou null)
//   fg    → cor do texto quando bg está definido (padrão: automático por luminância)
//   grad  → true → usa gradiente (do tema quando não há bg, misturado ao bg quando há)
//   brand → 'instagram' | 'tiktok' | 'whatsapp' | null (ignora bg/fg; usa tema fixo)
export function normalizeCustom(input) {
  const obj = input && typeof input === 'object' ? input : {};
  const hex = (v) => (typeof v === 'string' && HEX_RE.test(v) ? v.toLowerCase() : null);
  const brand = obj.brand && LINK_BRANDS[obj.brand] ? obj.brand : null;
  // Marca = look oficial completo: cores/gradiente próprios são descartados.
  return brand
    ? { bg: null, fg: null, grad: false, brand }
    : { bg: hex(obj.bg), fg: hex(obj.fg), grad: Boolean(obj.grad), brand: null };
}

// Escurece um hex (mistura com preto). Usado no gradiente de botão com bg customizado.
export function darkenHex(hex, f) {
  try {
    const c = String(hex).replace('#', '');
    const ch = (i) => Math.max(0, Math.round(parseInt(c.slice(i, i + 2), 16) * (1 - f)));
    return `#${[0, 2, 4].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return hex;
  }
}
