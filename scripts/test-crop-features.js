// Teste end-to-end dos novos recursos (não faz parte do site):
//  • https:// automático em links, avatar e capa
//  • tema por link (custom) salvo e normalizado
//  • classes de marca/cor/gradiente na página pública
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
    console.log(`${cond ? 'OK ✔' : '✘ FALHOU'} — ${label}`);
    cond ? pass++ : fail++;
  };

  // login do admin primeiro (aprovação do usuário de teste)
  let r = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin-demo-123' })
  });
  adm.absorb(r);

  // 1) cadastro + aprovação admin
  r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'crop-test', email: 'crop@test.com', password: 'senha123' })
  });
  user.absorb(r);
  ok(r.status === 200, `cadastro (HTTP ${r.status})`);
  const db = JSON.parse(fs.readFileSync('.data/db.json', 'utf8'));
  const u = db.users.find((x) => x.username === 'crop-test');
  r = await fetch(`${BASE}/api/admin/users/${u.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adm.header() },
    body: JSON.stringify({ approved: true })
  });
  ok(r.status === 200, 'admin aprovou a conta');

  // 2) criação de link SEM https:// → preenchido automaticamente
  r = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ label: 'Meu Insta', url: 'instagram.com/jrway', icon: '🔗', custom: {} })
  });
  let d = await r.json();
  ok(r.status === 200 && d.link.url === 'https://instagram.com/jrway', `https:// automático na criação → "${d.link?.url}"`);

  // 3) esquema perigoso (javascript:) → rejeitado, nunca é armazenado
  r = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ label: 'T', url: 'javascript:alert(1)' })
  });
  ok(r.status === 400, `esquema perigoso rejeitado (HTTP ${r.status})`);

  // 4) lixo total → 400
  r = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ label: 'X', url: '://quebra' })
  });
  ok(r.status === 400, `endereço inválido rejeitado (HTTP ${r.status})`);

  // 5) tema por link na criação: marca whatsapp
  r = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ label: 'Zap', url: 'wa.me/5511999999999', icon: '💬', custom: { brand: 'whatsapp', bg: '#ff0000' } })
  });
  d = await r.json();
  ok(r.status === 200 && d.link.custom.brand === 'whatsapp' && d.link.custom.bg === null, `marca whatsapp salva, bg ignorado (brand vence) → ${JSON.stringify(d.link.custom)}`);

  // 6) PATCH custom com cores + grad → normalizado (minúsculas) e lixo → null
  r = await fetch(`${BASE}/api/links/${d.link.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ custom: { brand: 'myspace', bg: '#FF8800', fg: 'javascript:x', grad: 'SIM' } })
  });
  ok(r.status === 200, `PATCH custom aceito (HTTP ${r.status})`);

  r = await fetch(`${BASE}/api/links`, { headers: { Cookie: user.header() } });
  d = await r.json();
  const zap = d.links.find((l) => l.label === 'Zap');
  ok(
    zap && zap.custom.brand === null && zap.custom.bg === '#ff8800' && zap.custom.fg === null && zap.custom.grad === true,
    `custom normalizado → ${JSON.stringify(zap?.custom)}`
  );

  // 7) perfil: avatar sem esquema ganha https://; relativo /uploads fica intacto
  r = await fetch(`${BASE}/api/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ avatar_url: 'picsum.photos/123', cover_url: '/uploads/demo/capa.webp' })
  });
  d = await r.json();
  ok(d.user.avatar_url === 'https://picsum.photos/123', `avatar ganhou https:// → "${d.user.avatar_url}"`);
  ok(d.user.cover_url === '/uploads/demo/capa.webp', `cover relativo preservado → "${d.user.cover_url}"`);

  // 8) página pública carrega as classes de tema
  r = await fetch(`${BASE}/crop-test`);
  const html = await r.text();
  ok(r.status === 200, `página pública (HTTP ${r.status})`);
  ok(html.includes('pv-link--custom'), 'classe de botão customizado presente na página');
  ok(html.includes('#ff8800'), 'bg customizado presente na página');

  // 9) criação com marca: cores são descartadas e a classe aparece na página
  r = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ label: 'Fotinha', url: 'instagram.com', icon: '🔗', custom: { brand: 'instagram', bg: '#123456', grad: true } })
  });
  d = await r.json();
  ok(
    r.status === 200 && d.link.custom.brand === 'instagram' && d.link.custom.bg === null && d.link.custom.grad === false,
    `marca zera cores na criação → ${JSON.stringify(d.link.custom)}`
  );
  r = await fetch(`${BASE}/crop-test`);
  const html2 = await r.text();
  ok(html2.includes('pv-link--instagram'), 'classe de tema Instagram presente na página');

  console.log(`\n${pass} certos / ${fail} falhas`);
  process.exit(fail ? 1 : 0);
})();
