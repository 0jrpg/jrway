import { NextResponse } from 'next/server';
import { ensureSchema, getLinkById, findUserById, incrementClicks } from '@/lib/db';

// Rastreador de cliques: /api/c/:id → incrementa e redireciona para o destino.
export async function GET(req, ctx) {
  const { id } = await ctx.params;
  const linkId = Number(id);

  if (!Number.isInteger(linkId)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  await ensureSchema();
  const link = await getLinkById(linkId);
  const owner = link ? await findUserById(link.user_id) : null;

  if (!link || !link.active || !owner || owner.suspended) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  await incrementClicks(link.id);
  return NextResponse.redirect(link.url, 302);
}
