import { NextResponse } from 'next/server';
import { clearSession, ADMIN_COOKIE } from '@/lib/auth';

export async function POST() {
  await clearSession(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
