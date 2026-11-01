// robots.txt — Importante: o caminho secreto do admin (/acess/auth/adm) NÃO é
// listado aqui de propósito. Colocá-lo no robots.txt revelaria a URL secreta.
// A proteção contra indexação é feita com meta noindex + header X-Robots-Tag.

import { baseUrl } from '@/lib/validate';

export default function robots() {
  const base = baseUrl();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${base}/sitemap.xml`
  };
}
