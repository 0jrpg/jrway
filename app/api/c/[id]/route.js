import { NextResponse } from 'next/server';
import { ensureSchema, getLinkById, findUserById, incrementClicks } from '@/lib/db';

// Rastreador de cliques: /api/c/:id → incrementa e redireciona para o destino.
// ?nr=1 → só conta e responde JSON (usado para links mailto:/tel:, que o
// navegador NÃO segue por redirect — a página abre o destino direto no clique).
export async function GET(req, ctx) {
  const { id } = await ctx.params;
  const linkId = Number(id);

  const noRedirect = new URL(req.url).searchParams.has('nr');

  if (!Number.isInteger(linkId)) {
    if (noRedirect) return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.redirect(new URL('/', req.url));
  }

  await ensureSchema();
  const link = await getLinkById(linkId);
  const owner = link ? await findUserById(link.user_id) : null;

  if (!link || !link.active || !owner || owner.suspended) {
    if (noRedirect) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.redirect(new URL('/', req.url));
  }

  await incrementClicks(link.id);

  if (noRedirect) return NextResponse.json({ ok: true });

  return NextResponse.redirect(link.url, 302);
}
