// Teste end-to-end do fluxo de aprovação (não faz parte do site)
const BASE = 'http://localhost:3000';

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

  // 1) cadastro → conta nasce pendente
  let r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'joao-novo', email: 'joao@test.com', password: 'senha123' })
  });
  user.absorb(r);
  let d = await r.json().catch(() => ({}));
  const novo = d.ok && d.pending;
  console.log(`1) cadastro: HTTP ${r.status} | pendente: ${novo ? 'OK ✔' : '✘ ' + JSON.stringify(d)}`);

  // 2) página pública ANTES da aprovação → deve dar 404
  r = await fetch(`${BASE}/joao-novo`);
  console.log(`2) página antes da aprovação: HTTP ${r.status} | ${r.status === 404 ? 'OK ✔ (invisível)' : '✘ FALHOU'}`);

  // 3) sitemap NÃO deve listar pendente
  r = await fetch(`${BASE}/sitemap.xml`);
  const xml = await r.text();
  console.log(`3) sitemap sem pendente: ${xml.includes('joao-novo') ? '✘ listou (FALHOU)' : 'OK ✔'}`);

  // 4) pendente pode usar o dashboard (preparar página)
  r = await fetch(`${BASE}/dashboard`, { headers: { Cookie: user.header() } });
  console.log(`4) dashboard pendente: HTTP ${r.status} | ${r.status === 200 ? 'OK ✔' : '✘'}`);

  // 5) admin entra e aprova
  r = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin-demo-123' })
  });
  adm.absorb(r);
  console.log(`5) admin login: HTTP ${r.status}`);

  // descobre o id do usuário pela listagem (html) → usa PATCH por email não dá; usa a API de admin via busca no html? Melhor: aprova via PATCH direto com id — pegamos o id no db.json (demo)
  const fs = require('fs');
  const db = JSON.parse(fs.readFileSync('.data/db.json', 'utf8'));
  const u = db.users.find((x) => x.username === 'joao-novo');
  r = await fetch(`${BASE}/api/admin/users/${u.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adm.header() },
    body: JSON.stringify({ approved: true })
  });
  d = await r.json().catch(() => ({}));
  console.log(`6) aprovação: HTTP ${r.status} | ${d.ok ? 'OK ✔' : '✘ ' + JSON.stringify(d)}`);

  // 6) página pública DEPOIS da aprovação → 200
  r = await fetch(`${BASE}/joao-novo`);
  console.log(`7) página depois da aprovação: HTTP ${r.status} | ${r.status === 200 ? 'OK ✔ (pública)' : '✘ FALHOU'}`);

  // 7) sitemap agora lista
  r = await fetch(`${BASE}/sitemap.xml`);
  const xml2 = await r.text();
  console.log(`8) sitemap com aprovado: ${xml2.includes('joao-novo') ? 'OK ✔' : '✘ FALHOU'}`);

  // 8) usuário comum NÃO pode aprovar ninguém
  r = await fetch(`${BASE}/api/admin/users/${u.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ suspended: true })
  });
  console.log(`9) comum tentando usar API admin: HTTP ${r.status} | ${r.status === 403 ? 'OK ✔ bloqueado' : '✘ FALHOU'}`);

  // 9) admin sem login também bloqueado
  r = await fetch(`${BASE}/api/admin/users/${u.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suspended: true })
  });
  console.log(`10) sem login na API admin: HTTP ${r.status} | ${r.status === 403 ? 'OK ✔ bloqueado' : '✘ FALHOU'}`);
})();
