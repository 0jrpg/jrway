// robots.txt — Importante: o caminho secreto do admin (/acess/auth/adm) NÃO é
// listado aqui de propósito. Colocá-lo no robots.txt revelaria a URL secreta.
// A proteção contra indexação é feita com meta noindex + header X-Robots-Tag.

export default function robots() {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${base}/sitemap.xml`
  };
}
