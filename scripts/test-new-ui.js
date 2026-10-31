// Teste e2e do lote "SVG + personalizações" (não faz parte do site):
//  • cadastro com mensagem pro admin + webhook não quebra
//  • aureola (ring) salva e aparece na página pública
//  • selo verificado reposicionável (gate: só verificado grava)
//  • selo de Admin atribuível pelo painel e visível na página
//  • "Criado no JRWay" ocultável só por verificado / des-verificar volta o crédito
//  • ícones de links em SVG + fallback de emoji legado
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
  const uName = `svg-test-${Date.now().toString(36).slice(-5)}`;
  let pass = 0;
  let fail = 0;
  const ok = (cond, label) => {
    console.log(`${cond ? 'OK' : '✘ FALHOU'} — ${label}`);
    cond ? pass++ : fail++;
  };

  // 0) admin logado
  let r = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin-demo-123' })
  });
  adm.absorb(r);
  ok(r.status === 200, 'admin entrou no painel');

  // 1) cadastro COM mensagem (webhook sem config não pode quebrar)
  r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: uName, email: `${uName}@t.com`, password: 'senha123', message: 'Oi! Sou testador.' })
  });
  user.absorb(r);
  ok(r.status === 200, `cadastro com mensagem (HTTP ${r.status})`);
  const db = JSON.parse(fs.readFileSync('.data/db.json', 'utf8'));
  const u = db.users.find((x) => x.username === uName);
  ok(Boolean(u) && u.message === 'Oi! Sou testador.', 'mensagem salvo no banco (modo arquivo)');

  // 2) ainda pendente → 404 na página
  r = await fetch(`${BASE}/${uName}`);
  ok(r.status === 404, 'página pendente = 404');

  // 3) ring customizado (não-verificado pode)
  r = await fetch(`${BASE}/api/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ ring: { style: 'grad', color: '#ff0000', color2: '#00ff00', width: 6 } })
  });
  ok(r.status === 200, `aureola salva (HTTP ${r.status})`);
  const uRing = JSON.parse(fs.readFileSync('.data/db.json', 'utf8')).users.find((x) => x.username === uName);
  ok(uRing.ring === '{"style":"grad","color":"#ff0000","color2":"#00ff00","width":6}', 'ring persistiu normalizado');

  // 4) não-verificado NÃO oculta watermark → 403; badge é ignorado sem erro
  r = await fetch(`${BASE}/api/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ hide_watermark: true })
  });
  ok(r.status === 403, `watermark bloqueado p/ não-verificado (HTTP ${r.status})`);
  r = await fetch(`${BASE}/api/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ badge: 'avatar' })
  });
  ok(r.status === 200 && JSON.parse(fs.readFileSync('.data/db.json', 'utf8')).users.find((x) => x.username === uName).badge === 'name', 'badge ignorado p/ não-verificado (fica name)');

  // 5) link com ícone SVG + link com marca (ícone trocado automaticamente)
  r = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ label: 'Meu site', url: 'exemplo.com', icon: 'briefcase' })
  });
  ok(r.status === 200, 'link com ícone "briefcase" criado');
  const link1 = (await r.json()).link;
  ok(link1.icon === 'briefcase' && link1.url === 'https://exemplo.com', 'https:// automático + ícone nome');
  r = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ label: 'Futo', url: 'tiktok.com/@a', icon: 'link' })
  });
  const link2 = (await r.json()).link;
  r = await fetch(`${BASE}/api/links/${link2.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ custom: { brand: 'tiktok' } })
  });
  ok(r.status === 200, 'custom brand tiktok salvo');

  // 6) admin aprova + verifica + dá selo Admin
  const patch = (body) => fetch(`${BASE}/api/admin/users/${u.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adm.header() },
    body: JSON.stringify(body)
  });
  ok((await patch({ approved: true })).status === 200, 'conta aprovada');
  ok((await patch({ verified: true })).status === 200, 'verificado');

  // badge/watermark são escolhas do próprio usuário verificado (sessão dele)
  r = await fetch(`${BASE}/api/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: user.header() },
    body: JSON.stringify({ badge: 'username', hide_watermark: true })
  });
  ok(r.status === 200, `usuário verificado escolheu badge @ + ocultou watermark (HTTP ${r.status})`);
  r = await patch({ admin_badge: true });
  ok(r.status === 200, 'selo de Admin atribuído');

  // 7) página pública: HTML precisa refletir tudo
  r = await fetch(`${BASE}/${uName}`);
  const html = await r.text();
  ok(r.status === 200, `página pública (HTTP ${r.status})`);
  ok(html.includes('pv-badge--admin'), 'selo de ADMIN aparece (escudo)');
  ok(html.includes('pv-ring--grad') && html.includes('--ring-w:6px'), 'aureola degradê 6px no avatar');
  ok(html.includes('pv-badge--username'), 'selo verificado depois do @');
  ok(html.split('pv-watermark').length === 1, 'watermark oculto na página');
  ok(html.includes('pv-icon-svg') && html.includes('<svg'), 'ícones dos links em SVG');
  ok(html.split('<span class="pv-link-icon').length - 1 === 2, 'dois links renderizados');
  ok(!html.includes('Oi! Sou testador.') && !html.includes('senha123'), 'mensagem privada e hash não vazam no HTML');

  // 8) landing sem emojis novos (logo própria)
  r = await fetch(`${BASE}/`);
  const land = await r.text();
  ok(!land.includes('\u{1F7E3}') && !land.includes('\u{1F3A8}'), 'landing não usa emojis de interface');
  ok(land.includes('logo-mark'), 'logo SVG presente na landing');

  // 9) des-verificar → watermark volta (regra da rota admin)
  ok((await patch({ verified: false })).status === 200, 'verificação removida');
  const u2 = JSON.parse(fs.readFileSync('.data/db.json', 'utf8')).users.find((x) => x.username === uName);
  ok(u2.hide_watermark === false, 'des-verificar restaurou o crédito obrigatório');
  r = await fetch(`${BASE}/${uName}`);
  const html2 = await r.text();
  ok(html2.includes('pv-watermark'), 'watermark de volta na página');

  console.log(`\n${pass} passaram, ${fail} falharam`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('ERRO:', e);
  process.exit(1);
});
