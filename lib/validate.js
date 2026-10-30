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

// Rotas e nomes que nunca podem virar usernames públicos.
export const RESERVED_USERNAMES = [
  'entrar', 'criar-conta', 'dashboard', 'acess', 'api', 'admin', 'adm', 'auth',
  'login', 'signup', 'register', 'conta', 'perfil', 'settings', 'config',
  '_next', 'public', 'static', 'assets', 'favicon.ico', 'robots.txt',
  'sitemap.xml', 'u', 'user', 'users', 'link', 'links', 'p', 'page',
  'blog', 'sobre', 'termos', 'privacidade', 'suporte', 'ajuda', 'jrway', 'vercel'
];
