import { NextResponse } from 'next/server';
import { clearSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  await clearSession(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
