// Regras de validação compartilhadas.

export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_-]{1,22}[a-z0-9])$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Se a pessoa esqueceu o "https://", preenchemos pra ela.
// URLs relativas (começadas por "/", ex.: arquivos do modo demo) ficam como estão.
export function withHttps(url) {
  const u = String(url || '').trim();
  if (!u || u.startsWith('/')) return u;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

// Valida que a URL (já com esquema) é realmente navegável em http(s).
// Rejeita lixo tipo "https://://quebra" ou esquemas disfarçados.
export function isHttpUrl(u) {
  try {
    const parsed = new URL(String(u));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Links aceitam http(s) OU e-mail (mailto:). Digitou "eu@gmail.com"?
// Vira mailto:eu@gmail.com na hora — https:// não é o único destino de um botão.
export function normalizeLinkUrl(url) {
  const u = String(url || '').trim();
  if (!u) return u;

  // mailto: explícito — valida o endereço (aceita ?subject=Oi&body=...)
  if (/^mailto:/i.test(u)) {
    const [addr, query] = u.slice(7).split('?');
    if (!EMAIL_RE.test(addr.trim())) return '';
    const clean = addr.trim().toLowerCase();
    return query ? `mailto:${clean}?${query}` : `mailto:${clean}`;
  }

  // e-mail puro: tem @, TLD, sem barra nem outro protocolo disfarçado
  if (!u.startsWith('/') && !u.includes('://') && EMAIL_RE.test(u) && !u.includes(':')) {
    return `mailto:${u.toLowerCase()}`;
  }

  // Web normal: https:// automático
  return withHttps(u);
}

// Validador de link completo: http(s) navegável ou mailto: válido.
export function isValidLinkUrl(u) {
  const url = String(u || '');
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+/i.test(url)) return true;
  return isHttpUrl(url);
}

// Base URL do site (NEXT_PUBLIC_BASE_URL), normalizada:
//  • aceita com/sem "https://" ("jrway.vercel.app" vira "https://jrway.vercel.app")
//  • tira barra final e espaços acidentais
//  • nunca quebra o build — valor vazio cai no localhost
export function baseUrl() {
  let raw = String(process.env.NEXT_PUBLIC_BASE_URL || '').trim();
  if (!raw) raw = 'http://localhost:3000';
  return withHttps(raw).replace(/\/+$/, '');
}

// Versão que sempre devolve objeto URL válido (usada no metadataBase do layout):
// se o valor configurado for impossível de parsear, cai no localhost em vez de derrubar o build.
export function safeBaseUrlObject() {
  try {
    return new URL(baseUrl());
  } catch {
    return new URL('http://localhost:3000');
  }
}

// Rotas e nomes que nunca podem virar usernames públicos.
export const RESERVED_USERNAMES = [
  'entrar', 'criar-conta', 'dashboard', 'acess', 'api', 'admin', 'adm', 'auth',
  'login', 'signup', 'register', 'conta', 'perfil', 'settings', 'config',
  '_next', 'public', 'static', 'assets', 'favicon.ico', 'robots.txt',
  'sitemap.xml', 'u', 'user', 'users', 'link', 'links', 'p', 'page',
  'blog', 'sobre', 'termos', 'privacidade', 'suporte', 'ajuda', 'jrway', 'vercel'
];
