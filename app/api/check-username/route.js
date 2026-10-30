import { NextResponse } from 'next/server';
import { ensureSchema, usernameExists } from '@/lib/db';
import { USERNAME_RE, RESERVED_USERNAMES } from '@/lib/validate';

// Verifica disponibilidade de username em tempo real na tela de cadastro.
export async function GET(req) {
  const u = new URL(req.url).searchParams.get('u') || '';
  const username = u.trim().toLowerCase();

  if (!USERNAME_RE.test(username) || RESERVED_USERNAMES.includes(username)) {
    return NextResponse.json({ ok: true, available: false, reason: 'invalid' });
  }

  await ensureSchema();
  const taken = await usernameExists(username);
  return NextResponse.json({ ok: true, available: !taken });
}
