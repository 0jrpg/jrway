import { NextResponse } from 'next/server';
import { ensureSchema, updateUser, usernameExists, findUserById } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { normalizeTheme, normalizeRing, normalizeBadge } from '@/lib/theme';
import { USERNAME_RE, RESERVED_USERNAMES, withHttps, isHttpUrl } from '@/lib/validate';

// Atualiza perfil e/ou tema do usuário logado.
export async function PATCH(req) {
  await ensureSchema();

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  }

  const b = await req.json().catch(() => ({}));
  const fields = {};

  if (b.username !== undefined && b.username !== user.username) {
    const u = String(b.username).trim().toLowerCase();
    if (!USERNAME_RE.test(u)) {
      return NextResponse.json({ ok: false, error: 'Usuário inválido: 3–24 caracteres (a-z, 0-9, _ ou -).' }, { status: 400 });
    }
    if (RESERVED_USERNAMES.includes(u)) {
      return NextResponse.json({ ok: false, error: 'Este nome é reservado pelo sistema.' }, { status: 400 });
    }
    if (await usernameExists(u, user.id)) {
      return NextResponse.json({ ok: false, error: 'Este nome de usuário já está em uso.' }, { status: 409 });
    }
    fields.username = u;
  }
  if (b.display_name !== undefined) fields.display_name = String(b.display_name).trim().slice(0, 40) || user.username;
  if (b.bio !== undefined) fields.bio = String(b.bio).trim().slice(0, 160);
  // avatar/capa: https:// automático; URLs relativas (/uploads/…) preservadas; lixo → rejeitado
  if (b.avatar_url !== undefined) {
    const v = withHttps(String(b.avatar_url).trim().slice(0, 500));
    if (v && !v.startsWith('/') && !isHttpUrl(v)) {
      return NextResponse.json({ ok: false, error: 'Endereço de foto inválido.' }, { status: 400 });
    }
    fields.avatar_url = v;
  }
  if (b.cover_url !== undefined) {
    const v = withHttps(String(b.cover_url).trim().slice(0, 500));
    if (v && !v.startsWith('/') && !isHttpUrl(v)) {
      return NextResponse.json({ ok: false, error: 'Endereço de capa inválido.' }, { status: 400 });
    }
    fields.cover_url = v;
  }
  if (b.photos !== undefined) {
    const list = Array.isArray(b.photos) ? b.photos : [];
    fields.photos = JSON.stringify(
      list
        .filter((u) => typeof u === 'string' && /^https?:\/\/|^\//.test(u.trim()))
        .map((u) => u.trim().slice(0, 500))
        .slice(0, 24)
    );
  }
  if (b.theme !== undefined) fields.theme = JSON.stringify(normalizeTheme(b.theme));

  // Aureola do avatar (disponível pra todo mundo)
  if (b.ring !== undefined) fields.ring = JSON.stringify(normalizeRing(b.ring));

  // Exclusivas de perfis VERIFICADOS (a API reforça o mesmo gate da UI)
  if (user.verified) {
    if (b.badge !== undefined) fields.badge = normalizeBadge(b.badge);
    if (b.hide_watermark !== undefined) fields.hide_watermark = Boolean(b.hide_watermark);
  } else if (b.hide_watermark === true && user.hide_watermark !== true) {
    return NextResponse.json({ ok: false, error: 'Só perfis verificados podem ocultar o crédito “Criado no JRWay”.' }, { status: 403 });
  }

  if (!Object.keys(fields).length) {
    return NextResponse.json({ ok: true, user });
  }

  await updateUser(user.id, fields);
  const fresh = await findUserById(user.id);
  return NextResponse.json({ ok: true, user: fresh });
}
