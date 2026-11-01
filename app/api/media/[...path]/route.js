// /api/media/** — serve as imagens guardadas no repositório de dados do
// GitHub usando o token no servidor. Funciona com repo PÚBLICO ou PRIVADO e
// não expõe o token ao cliente. O cliente só vê `/api/media/images/…`.
//
// Origem das URLs: lib/media.js (mediaUrlFor / externalToMediaUrl).

import { NextResponse } from 'next/server';
import { BRANCH, REPO, TOKEN } from '@/lib/github';

export const dynamic = 'force-dynamic';

const TYPES = {
  webp: 'image/webp',
  png: 'image/png',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  avif: 'image/avif',
  ico: 'image/x-icon'
};

export async function GET(_req, ctx) {
  if (!REPO) return NextResponse.json({ ok: false, error: 'Mídia não configurada.' }, { status: 404 });

  // params.path → array de segmentos do `[...path]`
  const { path } = await ctx.params;
  const segments = Array.isArray(path) ? path : [];
  if (!segments.length) return NextResponse.json({ ok: false, error: 'Caminho ausente.' }, { status: 400 });

  // Cada segmento vai URL-encoded → "."/"travessia" não escapam do repo.
  const rel = segments.map((s) => encodeURIComponent(s)).join('/');

  const headers = {
    Accept: 'application/vnd.github.raw',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'jrway-media'
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  let res;
  try {
    res = await fetch(`https://api.github.com/repos/${REPO}/contents/${rel}?ref=${encodeURIComponent(BRANCH)}`, {
      headers,
      cache: 'no-store'
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Falha ao buscar mídia.' }, { status: 502 });
  }

  if (!res.ok) return new NextResponse(null, { status: res.status === 403 || res.status === 404 ? 404 : 502 });

  const buf = Buffer.from(await res.arrayBuffer());
  const ext = (segments[segments.length - 1].split('.').pop() || '').toLowerCase();

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // mesmo caminho = mesmo arquivo (upload para outro nome/new path);
      // 1h de cache + revalidação mantém o deploy sempre fresco.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
