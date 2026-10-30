// Conversão de imagens para WebP com sharp.
// avatar → quadrado 512×512 | cover → 1200×400 | photo → máximo 1440px

import sharp from 'sharp';

const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB

export const ACCEPTED_MIME_PREFIX = 'image/';

export function isAllowedUpload(file) {
  if (!file || typeof file === 'string') return false;
  if (file.size > MAX_INPUT_BYTES) return false;
  if (!String(file.type || '').startsWith(ACCEPTED_MIME_PREFIX)) return false;
  // SVG pode carregar scripts → não aceitamos como upload de usuário
  if (/svg/i.test(file.type) || /\.svg$/i.test(file.name || '')) return false;
  return true;
}

export async function toWebP(buffer, kind) {
  let pipeline = sharp(buffer, { failOn: 'error', animated: false });

  if (kind === 'avatar') {
    pipeline = pipeline.resize(512, 512, { fit: 'cover', position: 'attention' });
  } else if (kind === 'cover') {
    pipeline = pipeline.resize(1200, 400, { fit: 'cover', position: 'attention' });
  } else {
    pipeline = pipeline.resize(1440, 1440, { fit: 'inside', withoutEnlargement: true });
  }

  const out = await pipeline.webp({ quality: 82 }).toBuffer();
  return out;
}
