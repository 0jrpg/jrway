// Autenticação: senhas (scrypt, sem dependências externas) e sessões
// assinadas com HMAC em cookies httpOnly.

import { cookies } from 'next/headers';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { findUserById } from './db';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

export const SESSION_COOKIE = 'jrway_session';
export const ADMIN_COOKIE = 'jrway_adm';

/* ── Senhas ── */

export function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(pw), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    const a = Buffer.from(hash, 'hex');
    const b = scryptSync(String(pw), salt, 64);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/* ── Tokens assinados ── */

function sign(body) {
  return createHmac('sha256', SECRET).update(body).digest('base64url');
}

export function makeToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function readToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = Buffer.from(sign(body));
  const received = Buffer.from(sig);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ── Cookies de sessão ── */

export async function setSession(name, data, days = 7) {
  const jar = await cookies();
  const exp = Date.now() + days * 86400000;
  jar.set(name, makeToken({ ...data, exp }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor((exp - Date.now()) / 1000)
  });
}

export async function clearSession(name) {
  const jar = await cookies();
  jar.set(name, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}

/* ── Atalhos de leitura ── */

export async function getSessionUser() {
  const jar = await cookies();
  const payload = readToken(jar.get(SESSION_COOKIE)?.value);
  if (!payload?.uid) return null;
  return findUserById(payload.uid);
}

export async function isAdmin() {
  const jar = await cookies();
  const payload = readToken(jar.get(ADMIN_COOKIE)?.value);
  return Boolean(payload?.adm);
}
