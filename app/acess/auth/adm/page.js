import { ensureSchema, listUsers, adminStats } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import Icon from '@/components/Icon';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';

// ─────────────────────────────────────────────────────────────
// PAINEL ADMIN SECRETO — /acess/auth/adm
//
// • NÃO listado no robots.txt (proposito: não revelar a URL secreta)
// • NÃO listado no sitemap.xml
// • Protegido com noindex (meta + header X-Robots-Tag) e senha
// ─────────────────────────────────────────────────────────────

export const metadata = {
  title: 'Administração',
  robots: { index: false, follow: false, nocache: true }
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await ensureSchema();

  if (!(await isAdmin())) {
    return <AdminLogin />;
  }

  let users = [];
  let stats = { users: 0, links: 0, clicks: 0, views: 0 };
  let dbError = null;

  try {
    [users, stats] = await Promise.all([listUsers(), adminStats()]);
  } catch (e) {
    dbError = e?.message || 'Erro ao consultar o banco de dados.';
  }

  if (dbError) {
    return (
      <main className="nf">
        <div className="nf-card">
          <span className="nf-emoji"><Icon name="wrench" size={52} /></span>
          <h1>Banco indisponível</h1>
          <p>{dbError}</p>
          <p className="muted">Verifique a variável DATABASE_URL.</p>
        </div>
      </main>
    );
  }

  return <AdminPanel users={users.map(({ password_hash, ...u }) => u)} stats={stats} />;
}
