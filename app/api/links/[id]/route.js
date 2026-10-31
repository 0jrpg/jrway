import { NextResponse } from 'next/server';
import { ensureSchema, getLinkById, updateLink, deleteLink } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { withHttps, isHttpUrl } from '@/lib/validate';
import { normalizeCustom } from '@/lib/theme';

function ownLinkOr404(link, user) {
  return link && link.user_id === user.id;
}

export async function PATCH(req, ctx) {
  await ensureSchema();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 });

  const { id } = await ctx.params;
  const link = await getLinkById(id);
  if (!ownLinkOr404(link, user)) return NextResponse.json({ ok: false, error: 'Link não encontrado.' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const fields = {};
  if (b.label !== undefined) fields.label = String(b.label).trim().slice(0, 60) || link.label;
  if (b.icon !== undefined) fields.icon = String(b.icon).trim().slice(0, 24) || 'link';
  if (b.active !== undefined) fields.active = Boolean(b.active);
  if (b.url !== undefined) {
    // Preenche https:// automaticamente se a pessoa esqueceu o protocolo
    const url = withHttps(String(b.url).trim().slice(0, 500));
    if (!/^https?:\/\/.+/i.test(url) || !isHttpUrl(url)) {
      return NextResponse.json({ ok: false, error: 'Endereço inválido — algo como "instagram.com/seuperfil" já basta.' }, { status: 400 });
    }
    fields.url = url;
  }
  if (b.custom !== undefined) {
    // Tema individual do botão: { bg, fg, grad, brand } — sanitizado por normalizeCustom
    fields.custom = JSON.stringify(normalizeCustom(typeof b.custom === 'object' ? b.custom : {}));
  }

  await updateLink(link.id, fields);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, ctx) {
  await ensureSchema();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 });

  const { id } = await ctx.params;
  const link = await getLinkById(id);
  if (!ownLinkOr404(link, user)) return NextResponse.json({ ok: false, error: 'Link não encontrado.' }, { status: 404 });

  await deleteLink(link.id);
  return NextResponse.json({ ok: true });
}
