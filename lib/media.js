// URLs de imagens hospedadas no GitHub.
//
// O plano A era a CDN pública (jsDelivr) — funciona só com repo PÚBLICO e
// tem tempo de propagação. Agora o padrão é o Plano B que sempre funciona:
// o próprio site serve a imagem em `/api/media/…` (rota `app/api/media`),
// usando o token no servidor. Com poucos ou nenhum ajuste na Vercel.
//
//   hasGithub + MEDIA_PROXY≠0  →  `/api/media/images/usuario/arquivo.webp`
//   MEDIA_PROXY=0 (opt-out)    →  volta para a CDN pública (como antes)

import { hasGithub, publicUrlFor, REPO, BRANCH } from './github';

function proxyAtivo() {
  return hasGithub && process.env.MEDIA_PROXY !== '0';
}

// URL para servir um arquivo recém-ou-alguma-vez enviado ao repo.
export function mediaUrlFor(path) {
  if (proxyAtivo()) return `/api/media/${path}`;
  return publicUrlFor(path);
}

// Normaliza em tempo de LEITURA (mapUser): URLs antigas gravadas com base na
// CDN pública (jsDelivr, raw.githubusercontent ou GITHUB_CDN_BASE customizada)
// passam a apontar para o proxy interno. Qualquer outra URL (demo /uploads,
// avatares de serviço externo) passa intocada.
export function externalToMediaUrl(url) {
  const u = String(url || '');
  if (!u || !proxyAtivo()) return u;

  const bases = [
    process.env.GITHUB_CDN_BASE,
    `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}`,
    `https://raw.githubusercontent.com/${REPO}/${BRANCH}`
  ].filter(Boolean);

  for (const rawBase of bases) {
    const base = String(rawBase).replace(/\/+$/, '');
    if (u.startsWith(`${base}/`)) return `/api/media/${u.slice(base.length + 1)}`;
  }
  return u;
}
