import { NextResponse } from 'next/server';
import { ensureSchema, getLinksForUser, getLinkById, updateLink } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// Move um link para cima/baixo (troca de posição com o vizinho).
export async function POST(req, ctx) {
  await ensureSchema();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 });

  const { id } = await ctx.params;
  const link = await getLinkById(id);
  if (!link || link.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'Link não encontrado.' }, { status: 404 });
  }

  const { dir } = await req.json().catch(() => ({}));
  if (dir !== 'up' && dir !== 'down') {
    return NextResponse.json({ ok: false, error: 'Direção inválida.' }, { status: 400 });
  }

  const links = await getLinksForUser(user.id);
  const idx = links.findIndex((l) => l.id === link.id);
  const j = dir === 'up' ? idx - 1 : idx + 1;

  if (idx !== -1 && j >= 0 && j < links.length) {
    const a = links[idx];
    const b = links[j];
    await updateLink(a.id, { position: b.position ?? j + 1 });
    await updateLink(b.id, { position: a.position ?? idx + 1 });
  }

  return NextResponse.json({ ok: true, links: await getLinksForUser(user.id) });
}
