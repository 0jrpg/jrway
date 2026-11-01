// sitemap.xml — apenas páginas públicas (home + perfis ativos).
// O admin secreto NUNCA entra no mapa do site.

import { ensureSchema, listProfileSlugs } from '@/lib/db';
import { baseUrl } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const base = baseUrl();

  const entries = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 }
  ];

  try {
    await ensureSchema();
    const slugs = await listProfileSlugs();
    for (const s of slugs) {
      entries.push({
        url: `${base}/${s.username}`,
        lastModified: s.last_modified ? new Date(s.last_modified) : undefined,
        changeFrequency: 'weekly',
        priority: 0.8
      });
    }
  } catch {
    // sem banco configurado: sitemap só com a home
  }

  return entries;
}
