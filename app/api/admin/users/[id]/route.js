import { NextResponse } from 'next/server';
import { ensureSchema, updateUser, deleteUser } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

// Ações do admin sobre um usuário: verificar, suspender, excluir.
export async function PATCH(req, ctx) {
  await ensureSchema();
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: 'Acesso negado.' }, { status: 403 });

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) return NextResponse.json({ ok: false, error: 'ID inválido.' }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const fields = {};
  if (b.approved !== undefined) fields.approved = Boolean(b.approved);
  if (b.suspended !== undefined) fields.suspended = Boolean(b.suspended);
  if (b.verified !== undefined) {
    fields.verified = Boolean(b.verified);
    // Removeu o selo volta também o crédito obrigatório (o prêmio acabou)
    if (!fields.verified) fields.hide_watermark = false;
  }

  if (!Object.keys(fields).length) return NextResponse.json({ ok: false, error: 'Nada a atualizar.' }, { status: 400 });

  await updateUser(userId, fields);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, ctx) {
  await ensureSchema();
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: 'Acesso negado.' }, { status: 403 });

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) return NextResponse.json({ ok: false, error: 'ID inválido.' }, { status: 400 });

  await deleteUser(userId);
  return NextResponse.json({ ok: true });
}
