// Teste end-to-end do upload de imagens (não faz parte do site)
const BASE = 'http://localhost:3000';
const fs = require('fs');

function cookieJar() {
  const jar = new Map();
  return {
    header() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    },
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
  const jar = cookieJar();
  const png = fs.readFileSync('test-avatar.png');
  const jpg = fs.readFileSync('test-foto.jpg');

  const post = (path, body, ct) =>
    fetch(`${BASE}${path}`, { method: 'POST', headers: { Cookie: jar.header(), ...(ct ? { 'Content-Type': ct } : {}) }, body });

  // 0) cadastro (ou login se já existir)
  let r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'teste-foto', email: 'foto@test.com', password: 'senha123' })
  });
  jar.absorb(r);
  let d = await r.json().catch(() => ({}));
  if (!d.ok) {
    r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: jar.header() },
      body: JSON.stringify({ email: 'foto@test.com', password: 'senha123' })
    });
    jar.absorb(r);
  }
  console.log('0) login/cadastro:', r.status);

  const upload = async (buf, type, name, kind) => {
    const fd = new FormData();
    fd.append('kind', kind);
    fd.append('file', new Blob([buf], { type }), name);
    const rr = await post('/api/upload', fd);
    return { status: rr.status, data: await rr.json().catch(() => ({})) };
  };

  // 1) avatar: PNG → WebP
  const a1 = await upload(png, 'image/png', 'test-avatar.png', 'avatar');
  console.log(`1) avatar: HTTP ${a1.status} | ${a1.data.ok ? 'OK ✔ ' + a1.data.url : '✘ ' + a1.data.error}`);

  // 2) galeria: JPG → WebP
  const a2 = await upload(jpg, 'image/jpeg', 'test-foto.jpg', 'photo');
  console.log(`2) foto galeria: HTTP ${a2.status} | ${a2.data.ok ? 'OK ✔ ' + a2.data.url : '✘ ' + a2.data.error}`);

  // 3) arquivo falso deve ser rejeitado
  const a3 = await upload(Buffer.from('conteudo falso'), 'text/plain', 'fake.txt', 'photo');
  console.log(`3) fake rejeitado: HTTP ${a3.status} | ${a3.data.ok === false ? 'OK ✔' : 'FALHOU ✘'}`);

  // 4) a URL do avatar serve um WebP de verdade?
  r = await fetch(`${BASE}${a1.data.url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const isWebp = buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP';
  console.log(`4) serve imagem: HTTP ${r.status} | ${r.headers.get('content-type')} | ${buf.length} bytes | magic WEBP: ${isWebp ? 'OK ✔' : 'FALHOU ✘'}`);

  // 5) publica avatar + capa + galeria
  r = await fetch(`${BASE}/api/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: jar.header() },
    body: JSON.stringify({
      avatar_url: a1.data.url,
      cover_url: a1.data.url,
      photos: [a2.data.url, a1.data.url],
      display_name: 'Teste Foto',
      bio: 'testando uploads 🖼️'
    })
  });
  d = await r.json();
  console.log(`5) perfil salvo: HTTP ${r.status} | ${d.ok ? 'OK ✔' : JSON.stringify(d)}`);

  // 6) página pública mostra tudo?
  r = await fetch(`${BASE}/teste-foto`);
  const html = await r.text();
  console.log(`6) página pública: HTTP ${r.status} | capa: ${html.includes('pv-cover')} | galeria: ${html.includes('pv-gallery')} | .webp: ${html.includes('.webp')} | JRWay: ${html.includes('JRWay')}`);
})();
