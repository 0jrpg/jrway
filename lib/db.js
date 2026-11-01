// Camada de dados da plataforma.
//
// Dois modos:
//  1) Postgres serverless (Neon) via DATABASE_URL  → usado em produção (Vercel).
//  2) Arquivo local .data/db.json                  → usado em dev/demo, sem configurar nada.
//
// As duas implementações expõem exatamente as mesmas funções assíncronas.

import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { normalizeTheme, normalizeCustom, normalizeRing, normalizeBadge } from './theme';
import { externalToMediaUrl } from './media';

export const hasDb = Boolean(process.env.DATABASE_URL);

const sql = hasDb ? neon(process.env.DATABASE_URL) : null;

/* ──────────────────────────────────────────────
   Inicialização do schema (Postgres)
   ────────────────────────────────────────────── */

let readyPromise = null;

export function ensureSchema() {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

async function init() {
  if (!sql) return; // modo arquivo: nada a criar
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id           serial PRIMARY KEY,
      username     text UNIQUE NOT NULL,
      email        text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      display_name text NOT NULL,
      bio          text DEFAULT '',
      avatar_url   text DEFAULT '',
      cover_url    text DEFAULT '',
      photos       text DEFAULT '[]',
      theme        text DEFAULT '{}',
      approved     boolean DEFAULT false,
      views        integer DEFAULT 0,
      verified     boolean DEFAULT false,
      suspended    boolean DEFAULT false,
      created_at   timestamptz DEFAULT now()
    )`;
  // Migrações para bancos criados antes da v1.1 (fotos)
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url text DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS photos text DEFAULT '[]'`;
  // Migração v1.2 (aprovação): usuários antigos são preservados como aprovados
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS approved boolean`;
  await sql`UPDATE users SET approved = true WHERE approved IS NULL`;
  await sql`ALTER TABLE users ALTER COLUMN approved SET DEFAULT false`;
  await sql`
    CREATE TABLE IF NOT EXISTS links (
      id       serial PRIMARY KEY,
      user_id  integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label    text NOT NULL,
      url      text NOT NULL,
      icon     text DEFAULT 'link',
      position integer DEFAULT 0,
      active   boolean DEFAULT true,
      clicks   integer DEFAULT 0,
      custom   text DEFAULT '{}'
    )`;
  await sql`CREATE INDEX IF NOT EXISTS links_user_idx ON links(user_id)`;
  // Migração v1.3 (tema por link): estilo individual { bg, fg, grad, brand }
  await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS custom text DEFAULT '{}'`;
  await sql`UPDATE links SET custom = '{}' WHERE custom IS NULL`;
  // Migração v1.5 (aureola, selo reposicionável, selo Admin, mensagem ao admin, watermark):
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ring text DEFAULT '{}'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS badge text DEFAULT 'name'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_badge boolean DEFAULT false`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS message text DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS hide_watermark boolean DEFAULT false`;
  await sql`ALTER TABLE users ALTER COLUMN hide_watermark SET DEFAULT false`;
  await sql`UPDATE users SET ring = '{}' WHERE ring IS NULL`;
  await sql`UPDATE users SET badge = 'name' WHERE badge IS NULL OR badge = ''`;
  await sql`UPDATE users SET message = '' WHERE message IS NULL`;
  // Migração v1.5 (ícones SVG nos links): emoji legado → nome no catálogo de ícones
  await sql`UPDATE links SET icon = 'link' WHERE icon = '🔗' OR icon IS NULL OR icon = ''`;
}

/* ──────────────────────────────────────────────
   Modo arquivo (dev/demo)
   ────────────────────────────────────────────── */

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

let mem = null;

function memGet() {
  if (mem) return mem;
  try {
    mem = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!mem || !Array.isArray(mem.users)) throw new Error('formato inválido');
  } catch {
    mem = { seq: 1000, users: [], links: [] };
  }
  return mem;
}

function memSave() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(mem, null, 2));
}

function nextId() {
  const m = memGet();
  m.seq = (m.seq || 1000) + 1;
  return m.seq;
}

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function safeParse(s) {
  try {
    return JSON.parse(s || '{}');
  } catch {
    return {};
  }
}

function mapUser(row) {
  if (!row) return null;
  const photosRaw = safeParse(row.photos);
  const photos = Array.isArray(photosRaw) ? photosRaw.filter((s) => typeof s === 'string' && s) : [];
  return {
    ...row,
    // URLs gravadas apontado para a CDN externa (jsDelivr/raw) passem a servir
    // pelo próprio site — imagens aparecem mesmo com o repo de dados PRIVADO.
    avatar_url: externalToMediaUrl(row.avatar_url),
    cover_url: externalToMediaUrl(row.cover_url),
    photos: photos.map((p) => externalToMediaUrl(p)),
    theme: normalizeTheme(safeParse(row.theme)),
    ring: normalizeRing(safeParse(row.ring)),
    badge: normalizeBadge(row.badge),
    admin_badge: Boolean(row.admin_badge),
    // false → pendente de aprovação | true/null/undefined → aprovado (legado)
    approved: row.approved !== false,
    hide_watermark: Boolean(row.hide_watermark),
    message: typeof row.message === 'string' ? row.message : ''
  };
}

function mapLink(row) {
  if (!row) return null;
  return {
    ...row,
    active: Boolean(row.active),
    custom: normalizeCustom(safeParse(row.custom))
  };
}

// avatar/capa anel/selo são tratados no mapUser; aqui só os campos graváveis:
const USER_FIELDS = ['display_name', 'bio', 'avatar_url', 'cover_url', 'photos', 'username', 'theme', 'suspended', 'verified', 'approved', 'views', 'ring', 'badge', 'admin_badge', 'message', 'hide_watermark'];
const LINK_FIELDS = ['label', 'url', 'icon', 'active', 'position', 'custom'];

/* ──────────────────────────────────────────────
   Usuários
   ────────────────────────────────────────────── */

export async function createUser({ username, email, password_hash, display_name, message }) {
  const msg = typeof message === 'string' ? message.trim().slice(0, 500) : '';
  if (sql) {
    const rows = await sql`
      INSERT INTO users (username, email, password_hash, display_name, message)
      VALUES (${username}, ${email}, ${password_hash}, ${display_name}, ${msg})
      RETURNING *`;
    return mapUser(rows[0]);
  }
  const m = memGet();
  const user = {
    id: nextId(),
    username,
    email,
    password_hash,
    display_name,
    bio: '',
    avatar_url: '',
    cover_url: '',
    photos: '[]',
    theme: '{}',
    ring: '{}',
    badge: 'name',
    admin_badge: false,
    approved: false,
    views: 0,
    verified: false,
    suspended: false,
    hide_watermark: false,
    created_at: new Date().toISOString()
  };
  if (msg) user.message = msg;
  m.users.push(user);
  memSave();
  return mapUser(user);
}

export async function findUserById(id) {
  if (sql) {
    const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    return mapUser(rows[0]);
  }
  return mapUser(memGet().users.find((u) => u.id === Number(id)));
}

export async function findUserByUsername(username) {
  const u = String(username || '').toLowerCase();
  if (sql) {
    const rows = await sql`SELECT * FROM users WHERE username = ${u} LIMIT 1`;
    return mapUser(rows[0]);
  }
  return mapUser(memGet().users.find((x) => x.username === u));
}

export async function findUserByEmail(email) {
  const e = String(email || '').toLowerCase();
  if (sql) {
    const rows = await sql`SELECT * FROM users WHERE email = ${e} LIMIT 1`;
    return mapUser(rows[0]);
  }
  return mapUser(memGet().users.find((x) => x.email === e));
}

export async function usernameExists(username, exceptId = null) {
  const u = String(username || '').toLowerCase();
  if (sql) {
    const rows = await sql`SELECT 1 FROM users WHERE username = ${u} AND id <> ${exceptId ?? -1} LIMIT 1`;
    return rows.length > 0;
  }
  return memGet().users.some((x) => x.username === u && x.id !== exceptId);
}

export async function emailExists(email) {
  return Boolean(await findUserByEmail(email));
}

export async function updateUser(id, fields) {
  const keys = Object.keys(fields).filter((k) => USER_FIELDS.includes(k));
  if (!keys.length) return;
  if (sql) {
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const params = keys.map((k) => fields[k]);
    params.push(id);
    await sql.query(`UPDATE users SET ${sets} WHERE id = $${keys.length + 1}`, params);
  } else {
    const u = memGet().users.find((x) => x.id === Number(id));
    if (u) {
      Object.assign(u, fields);
      memSave();
    }
  }
}

export async function incrementViews(id) {
  if (sql) {
    await sql`UPDATE users SET views = views + 1 WHERE id = ${id}`;
  } else {
    const u = memGet().users.find((x) => x.id === Number(id));
    if (u) {
      u.views = (u.views || 0) + 1;
      memSave();
    }
  }
}

export async function deleteUser(id) {
  if (sql) {
    await sql`DELETE FROM users WHERE id = ${id}`; // links somem via ON DELETE CASCADE
  } else {
    const m = memGet();
    m.users = m.users.filter((u) => u.id !== Number(id));
    m.links = m.links.filter((l) => l.user_id !== Number(id));
    memSave();
  }
}

/* ──────────────────────────────────────────────
   Links
   ────────────────────────────────────────────── */

export async function getLinksForUser(userId) {
  if (sql) {
    const rows = await sql`SELECT * FROM links WHERE user_id = ${userId} ORDER BY position ASC, id ASC`;
    return rows.map(mapLink);
  }
  return memGet()
    .links.filter((l) => l.user_id === Number(userId))
    .sort((a, b) => (a.position || 0) - (b.position || 0) || a.id - b.id)
    .map(mapLink);
}

export async function getLinkById(id) {
  if (sql) {
    const rows = await sql`SELECT * FROM links WHERE id = ${id} LIMIT 1`;
    return mapLink(rows[0]);
  }
  return mapLink(memGet().links.find((l) => l.id === Number(id)));
}

export async function createLink(userId, { label, url, icon, custom }) {
  const customJson = JSON.stringify(normalizeCustom(custom));
  if (sql) {
    const rows = await sql`
      INSERT INTO links (user_id, label, url, icon, custom, position)
      VALUES (${userId}, ${label}, ${url}, ${icon || 'link'}, ${customJson}, (SELECT coalesce(max(position), 0) + 1 FROM links WHERE user_id = ${userId}))
      RETURNING *`;
    return mapLink(rows[0]);
  }
  const m = memGet();
  const maxPos = m.links.filter((l) => l.user_id === Number(userId)).reduce((mx, l) => Math.max(mx, l.position || 0), 0);
  const link = { id: nextId(), user_id: Number(userId), label, url, icon: icon || 'link', position: maxPos + 1, active: true, clicks: 0, custom: customJson };
  m.links.push(link);
  memSave();
  return mapLink(link);
}

export async function updateLink(id, fields) {
  const keys = Object.keys(fields).filter((k) => LINK_FIELDS.includes(k));
  if (!keys.length) return;
  if (sql) {
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const params = keys.map((k) => fields[k]);
    params.push(id);
    await sql.query(`UPDATE links SET ${sets} WHERE id = $${keys.length + 1}`, params);
  } else {
    const l = memGet().links.find((x) => x.id === Number(id));
    if (l) {
      Object.assign(l, fields);
      memSave();
    }
  }
}

export async function deleteLink(id) {
  if (sql) {
    await sql`DELETE FROM links WHERE id = ${id}`;
  } else {
    const m = memGet();
    m.links = m.links.filter((l) => l.id !== Number(id));
    memSave();
  }
}

export async function incrementClicks(id) {
  if (sql) {
    await sql`UPDATE links SET clicks = clicks + 1 WHERE id = ${id}`;
  } else {
    const l = memGet().links.find((x) => x.id === Number(id));
    if (l) {
      l.clicks = (l.clicks || 0) + 1;
      memSave();
    }
  }
}

/* ──────────────────────────────────────────────
   Admin / estatísticas / sitemap
   ────────────────────────────────────────────── */

export async function listUsers() {
  if (sql) {
    const rows = await sql`
      SELECT u.*,
             (SELECT count(*)::int FROM links l WHERE l.user_id = u.id) AS links_count,
             (SELECT coalesce(sum(clicks), 0)::int FROM links l WHERE l.user_id = u.id) AS clicks_total
      FROM users u ORDER BY u.created_at DESC`;
    return rows.map((r) => ({
      ...mapUser(r),
      links_count: Number(r.links_count || 0),
      clicks_total: Number(r.clicks_total || 0)
    }));
  }
  return memGet()
    .users.slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((u) => {
      const mine = memGet().links.filter((l) => l.user_id === u.id);
      return {
        ...mapUser(u),
        links_count: mine.length,
        clicks_total: mine.reduce((s, l) => s + (l.clicks || 0), 0)
      };
    });
}

export async function adminStats() {
  if (sql) {
    const [u] = await sql`SELECT count(*)::int AS c FROM users`;
    const [l] = await sql`SELECT count(*)::int AS c, coalesce(sum(clicks), 0)::int AS clicks FROM links`;
    const [v] = await sql`SELECT coalesce(sum(views), 0)::int AS c FROM users`;
    const [p] = await sql`SELECT count(*)::int AS c FROM users WHERE approved = false`;
    return {
      users: Number(u?.c || 0),
      links: Number(l?.c || 0),
      clicks: Number(l?.clicks || 0),
      views: Number(v?.c || 0),
      pending: Number(p?.c || 0)
    };
  }
  const m = memGet();
  return {
    users: m.users.length,
    links: m.links.length,
    clicks: m.links.reduce((s, l) => s + (l.clicks || 0), 0),
    views: m.users.reduce((s, u) => s + (u.views || 0), 0),
    pending: m.users.filter((u) => u.approved === false).length
  };
}

export async function listProfileSlugs() {
  if (sql) {
    const rows = await sql`SELECT username, created_at FROM users WHERE suspended = false AND approved = true ORDER BY created_at DESC LIMIT 500`;
    return rows.map((r) => ({ username: r.username, last_modified: r.created_at }));
  }
  return memGet()
    .users.filter((u) => !u.suspended && u.approved !== false)
    .map((u) => ({ username: u.username, last_modified: u.created_at }));
}
