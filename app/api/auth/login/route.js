import { NextResponse } from 'next/server';
import { ensureSchema, findUserByEmail, findUserByUsername } from '@/lib/db';
import { verifyPassword, setSession, SESSION_COOKIE } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export async function POST(req) {
  await ensureSchema();

  // Proteção contra força bruta: máx. 10 tentativas por IP a cada 5 min
  if (!rateLimit(`login:${clientIp(req)}`, 10, 300000)) {
    return NextResponse.json({ ok: false, error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!id || !password) {
    return NextResponse.json({ ok: false, error: 'Preencha e-mail/usuário e senha.' }, { status: 400 });
  }

  // Aceita login por e-mail ou por username.
  const user = (await findUserByEmail(id)) || (await findUserByUsername(id));
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ ok: false, error: 'Credenciais inválidas.' }, { status: 401 });
  }

  await setSession(SESSION_COOKIE, { uid: user.id });
  return NextResponse.json({ ok: true, user: { username: user.username } });
}
