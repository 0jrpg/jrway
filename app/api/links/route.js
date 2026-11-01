import { NextResponse } from 'next/server';
import { ensureSchema, getLinksForUser, createLink } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { normalizeLinkUrl, isValidLinkUrl } from '@/lib/validate';

// Lista os links do usuário logado.
export async function GET() {
  await ensureSchema();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 });
  return NextResponse.json({ ok: true, links: await getLinksForUser(user.id) });
}

// Cria um novo link.
export async function POST(req) {
  await ensureSchema();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const label = String(b.label || '').trim().slice(0, 60);
  // https:// automático para web; e-mail puro ("eu@gmail.com") vira mailto:
  const url = normalizeLinkUrl(String(b.url || '').trim().slice(0, 500));
  const icon = String(b.icon || 'link').trim().slice(0, 24) || 'link';
  const custom = typeof b.custom === 'object' ? b.custom : null;

  if (!label) return NextResponse.json({ ok: false, error: 'Dê um título ao link.' }, { status: 400 });
  if (!url || !isValidLinkUrl(url)) {
    return NextResponse.json({ ok: false, error: 'Endereço inválido — algo como "instagram.com/seuperfil" ou um e-mail já basta.' }, { status: 400 });
  }

  const link = await createLink(user.id, { label, url, icon, custom });
  return NextResponse.json({ ok: true, link });
}
