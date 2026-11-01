// Hospedagem de fotos em um repositório de dados no GitHub.
//
// Configuração (variáveis de ambiente):
//   GITHUB_TOKEN  → fine-grained PAT com "Contents: Read and write" SÓ no repo de dados
//   GITHUB_REPO   → "usuario/repo" (funciona com repo PÚBLICO **ou PRIVADO**:
//                   com token presente, o site serve as imagens pelo próprio
//                   domínio em `/api/media/…` — ver lib/media.js)
//   GITHUB_BRANCH → padrão "main"
//   GITHUB_CDN_BASE (opcional) → base de leitura pública; padrão: jsDelivr
//   MEDIA_PROXY=0 (opcional) → volta a usar a CDN pública e ignora o proxy
//
// Sem essas variáveis: em dev, as imagens caem em public/uploads (modo demo).

export const REPO = (process.env.GITHUB_REPO || '').replace(/^\/+|\/+$/g, '');
export const BRANCH = process.env.GITHUB_BRANCH || 'main';
export const TOKEN = process.env.GITHUB_TOKEN;

export const hasGithub = Boolean(REPO && TOKEN);

export async function putFile(path, buffer) {
  if (!hasGithub) throw new Error('GitHub não configurado.');

  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'jrway-upload'
    },
    body: JSON.stringify({
      message: `upload: ${path}`,
      content: Buffer.from(buffer).toString('base64'),
      branch: BRANCH
    })
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 140);
    throw new Error(`GitHub recusou o upload (${res.status}). ${detail}`);
  }

  const data = await res.json();
  return data?.content?.path || path;
}

export function publicUrlFor(path) {
  const base = (process.env.GITHUB_CDN_BASE || `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}`).replace(/\/+$/, '');
  return `${base}/${path}`;
}
