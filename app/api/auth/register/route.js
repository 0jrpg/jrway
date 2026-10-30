import { NextResponse } from 'next/server';
import { ensureSchema, createUser, usernameExists, emailExists } from '@/lib/db';
import { hashPassword, setSession, SESSION_COOKIE } from '@/lib/auth';
import { USERNAME_RE, EMAIL_RE, RESERVED_USERNAMES } from '@/lib/validate';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { notifySignup } from '@/lib/notify';

export async function POST(req) {
  await ensureSchema();

  // Anti-spam: máx. 10 cadastros por IP por hora
  if (!rateLimit(`reg:${clientIp(req)}`, 10, 3600000)) {
    return NextResponse.json({ ok: false, error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '').trim().toLowerCase();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ ok: false, error: 'Usuário inválido: use de 3 a 24 caracteres (a-z, 0-9, _ ou -), começando com letra ou número.' }, { status: 400 });
  }
  if (RESERVED_USERNAMES.includes(username)) {
    return NextResponse.json({ ok: false, error: 'Este nome de usuário é reservado pelo sistema.' }, { status: 409 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Digite um e-mail válido.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 });
  }
  if (await usernameExists(username)) {
    return NextResponse.json({ ok: false, error: 'Este nome de usuário já está em uso.' }, { status: 409 });
  }
  if (await emailExists(email)) {
    return NextResponse.json({ ok: false, error: 'Este e-mail já possui uma conta.' }, { status: 409 });
  }

  // Mensagem opcional para o admin (apenas texto aparado)
  const message = String(body.message || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, 500);

  const user = await createUser({
    username,
    email,
    password_hash: hashPassword(password),
    display_name: username,
    message
  });

  // Aviso pro admin (Discord/Telegram quando configurado) — nunca quebra o cadastro.
  await notifySignup({ username, message });

  await setSession(SESSION_COOKIE, { uid: user.id });
  // A conta nasce PENDENTE: só fica pública após aprovação do admin.
  return NextResponse.json({ ok: true, pending: true, user: { username: user.username } });
}
