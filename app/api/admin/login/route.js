import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { setSession, clearSession, ADMIN_COOKIE } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// Login do painel admin — senha definida em ADMIN_PASSWORD.
export async function POST(req) {
  // Máx. 5 tentativas por IP a cada 15 min
  if (!rateLimit(`adm:${clientIp(req)}`, 5, 900000)) {
    return NextResponse.json({ ok: false, error: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { ok: false, error: 'O servidor não tem ADMIN_PASSWORD configurado. Defina a variável de ambiente primeiro.' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const pw = String(body.password || '');

  // Comparação em tempo constante para evitar ataque de tempo.
  const ok =
    pw.length === adminPassword.length &&
    timingSafeEqual(Buffer.from(pw), Buffer.from(adminPassword));

  if (!ok) {
    await clearSession(ADMIN_COOKIE);
    return NextResponse.json({ ok: false, error: 'Senha incorreta.' }, { status: 401 });
  }

  await setSession(ADMIN_COOKIE, { adm: true }, 0.5); // sessão de 12h
  return NextResponse.json({ ok: true });
}
