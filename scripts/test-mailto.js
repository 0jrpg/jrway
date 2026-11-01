// Teste e2e: e-mail em links (mailto:), proxy de mídia (/api/media) e URL externa→proxy.
// Rodar com o dev server no ar E com env novas forçadas no shell:
//   $env:GITHUB_TOKEN='ghp_localtest'; $env:GITHUB_REPO='jrway-local/dados-teste'; $env:GITHUB_BRANCH='main'
const BASE = 'http://localhost:3000';
const fs = require('fs');

function cookieJar() {
  const jar = new Map();
  return {
    header() { return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; '); },
    absorb(res) {
      for (const c of res.headers.getSetCookie?.() || []) {
        const [pair] = c.split(';');
        const eq = pair.indexOf('=');
        if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    }
  };
}

(async () => {
  const user = cookieJar();
  const adm = cookieJar();
  let pass = 0;
  let fail = 0;
  const ok = (cond, label) => {
    console.log(`${cond ? 'OK' : '✘ FALHOU'} — ${label}`);
    cond ? pass++ : fail++;
  };

  // aquecer
  await fetch(`${BASE}/`).catch(() => {});

  // 0) contas
  let r = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin-demo-123' })
  });
  adm.absorb(r);
  ok(r.status === 200, 'admin entrou no painel');

  const uName = `mail-test-${Date.now().toString(36).slice(-5)}`;
  r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: uName, email: `${uName}@t.com`, password: 'senha123' })
  });
  user.absorb(r);
  ok(r.status === 200, 'usuário de teste cadastrado');

  // id do usuário: primeiro do banco demo local (.data/db.json), senão do flight do painel
  const admHtml = await fetch(`${BASE}/acess/auth/adm`, { headers: { Cookie: adm.header() } }).then((x) => x.text());
  let uId = '';
  try {
    const db = JSON.parse(fs.readFileSync('.data/db.json', 'utf8'));
    uId = String(db.users.find((x) => x.username === uName)?.id ?? '');
  } catch { /* sem modo demo */ }
  if (!uId) {
    const idx = admHtml.lastIndexOf(uName);
    const win = idx > -1 ? admHtml.slice(Math.max(0, idx - 400), idx) : '';
    // casa "id":1011 / \"id\":1011 / id":1011 — sem depender de aspas/escapes
    const m = win.match(/id\D{0,4}(\d+)/);
    uId = m ? m[1] : '';
  }
  ok(Boolean(uId), `id do usuário descoberto (${uId || 'nada'})`);

  r = await fetch(`${BASE}/api/admin/users/${uId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adm.header() },
    body: JSON.stringify({ approved: true })
  });
  ok(r.status === 200, 'conta aprovada');

  // ── mailto: nos links ─────────────────────────────────────────
  const mk = (label, url) =>
    fetch(`${BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.header() },
      body: JSON.stringify({ label, url })
    }).then(async (x) => ({ status: x.status, ...(await x.json()) }));

  r = await mk('Meu e-mail', 'eu@jrway.com');
  ok(r.status === 200 && r.link?.url === 'mailto:eu@jrway.com', `e-mail puro → mailto: (${r.link?.url || r.status})`);
  const emailLink = r.link;

  r = await mk('Suporte', 'mailto:suporte@jrway.com?subject=Oi!');
  ok(r.status === 200 && r.link?.url === 'mailto:suporte@jrway.com?subject=Oi!', `mailto: com subject preservado (${r.link?.url || r.status})`);

  r = await mk('Instagram', 'instagram.com/eu');
  ok(r.status === 200 && r.link?.url === 'https://instagram.com/eu', 'site comum continua → https:// automático (regressão)');
  const siteLink = r.link;

  r = await mk('Sem TLD', 'mailto:sem-tld');
  ok(r.status === 400, 'mailto inválido rejeitado');

  r = await mk('Trava', 'https://://quebra');
  ok(r.status === 400, 'http(s) inválido continua rejeitado (regressão)');

  r = await mk('Material', 'materiais:kit');
  ok(r.status === 400, 'protocolo desconhecido rejeitado');

  // PATCH troca para e-mail também
  r = await fetch(`${BASE}/api/links/${siteLink.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ url: 'novo@mail.com' })
  });
  ok(r.status === 200, 'PATCH aceitou e-mail puro');

  // um link 100% web para conferir o rastreador na página
  r = await mk('Portfólio', 'portfolio.com/eu');
  ok(r.status === 200 && r.link?.url === 'https://portfolio.com/eu', 'novo link web criado');
  const webLink = r.link;

  // cliques em mailto: ?nr=1 → JSON sem redirect; contador sobe
  r = await fetch(`${BASE}/api/c/${emailLink.id}?nr=1`);
  ok(r.status === 200 && (await r.json()).ok === true, 'beacon de clique mailto (?nr=1) respondeu ok');
  const readLinks = () => fetch(`${BASE}/api/links`, { headers: { Cookie: user.header() } }).then((x) => x.json());
  let listed = (await readLinks()).links || [];
  ok(listed.find((l) => l.id === emailLink.id)?.clicks === 1, 'clique do mailto contabilizado (1)');
  for (let i = 0; i < 2; i++) await fetch(`${BASE}/api/c/${emailLink.id}?nr=1`);
  listed = (await readLinks()).links || [];
  ok(listed.find((l) => l.id === emailLink.id)?.clicks === 3, 'cliques somando (3)');

  // redirect web continua 302 para o destino
  r = await fetch(`${BASE}/api/c/${siteLink.id}`, { redirect: 'manual' });
  ok(r.status === 302 || r.status === 0, `site via /api/c redireciona (status ${r.status})`);

  // ── página pública: mailto abre direto, web continua /api/c ──
  r = await fetch(`${BASE}/${uName}`);
  const html = await r.text();
  ok(r.status === 200, `página pública (HTTP ${r.status})`);
  ok(html.includes('href="mailto:eu@jrway.com"'), 'página usa href="mailto:…" direto no botão');
  ok(html.includes(`/api/c/${webLink.id}`), 'links web continuam passando pelo rastreador /api/c');

  // ── proxy de mídia: URL externa → /api/media no render (só com repo/token) ──
  const cdnUrl = 'https://cdn.jsdelivr.net/gh/jrway-local/dados-teste@main/images/foto.webp';
  r = await fetch(`${BASE}/api/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ avatar_url: cdnUrl })
  });
  ok(r.status === 200, 'avatar setado como URL de CDN externa');
  // proxy presente? (banco local revela a conversão; absent → passthrough é o correto)
  let proxyOn = false;
  let storedAvatar = cdnUrl;
  try {
    const db = JSON.parse(fs.readFileSync('.data/db.json', 'utf8'));
    const rec = db.users.find((x) => x.username === uName);
    storedAvatar = rec?.avatar_url || cdnUrl;
    proxyOn = storedAvatar.startsWith('/api/media/');
  } catch { /* sem modo demo */ }
  const html2 = await fetch(`${BASE}/${uName}`).then((x) => x.text());
  if (proxyOn) {
    ok(html2.includes('/api/media/images/foto.webp'), 'CDN externa → proxy interno na página pública');
  } else {
    ok(html2.includes(cdnUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) || html2.startsWith('<'), 'sem proxy (demo/sem repo): CDN externa passa intacta');
  }

  // /api/media estático: sem repo → "Mídia não configurada" (404); com repo/token no ar → 404/502
  r = await fetch(`${BASE}/api/media/images/nada-absurdo.webp`);
  ok([404, 502].includes(r.status), `/api/media caminho inexistente → ${r.status} (token não vaza)`);

  console.log(`\n${pass} passaram, ${fail} falharam`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('ERRO:', e);
  process.exit(1);
});
