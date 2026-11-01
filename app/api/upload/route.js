import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { ensureSchema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { hasGithub, putFile } from '@/lib/github';
import { mediaUrlFor } from '@/lib/media';
import { toWebP, isAllowedUpload } from '@/lib/imaging';

// Aceita qualquer arquivo de imagem (jpg, png, webp, gif, avif, tiff, bmp…),
// converte para WebP com sharp e hospeda no repositório de dados no GitHub.
export async function POST(req) {
  await ensureSchema();

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: 'Envio inválido.' }, { status: 400 });

  const file = form.get('file');
  const kindRaw = String(form.get('kind') || 'photo');
  const kind = ['avatar', 'cover', 'photo'].includes(kindRaw) ? kindRaw : 'photo';

  if (!isAllowedUpload(file)) {
    return NextResponse.json({ ok: false, error: 'Envie um arquivo de imagem válido (até 10 MB, SVG não é aceito).' }, { status: 400 });
  }

  let webpBuffer;
  try {
    webpBuffer = await toWebP(Buffer.from(await file.arrayBuffer()), kind);
  } catch {
    return NextResponse.json({ ok: false, error: 'Não consegui processar este arquivo como imagem.' }, { status: 400 });
  }

  const fname = `${kind}-${user.username}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.webp`;

  // ── Produção: repositório de dados no GitHub ──
  if (hasGithub) {
    try {
      const ghPath = await putFile(`images/${user.username}/${fname}`, webpBuffer);
      return NextResponse.json({ ok: true, url: mediaUrlFor(ghPath) });
    } catch (e) {
      return NextResponse.json({ ok: false, error: e.message || 'Falha no upload para o GitHub.' }, { status: 502 });
    }
  }

  // ── Modo demo (dev, sem GitHub configurado): salva em public/uploads ──
  if (process.env.NODE_ENV !== 'production') {
    const dir = path.join(process.cwd(), 'public', 'uploads', user.username);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, fname), webpBuffer);
    return NextResponse.json({ ok: true, url: `/uploads/${user.username}/${fname}`, demo: true });
  }

  return NextResponse.json(
    { ok: false, error: 'Upload não configurado neste servidor: defina GITHUB_TOKEN e GITHUB_REPO.' },
    { status: 500 }
  );
}
