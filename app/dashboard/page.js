import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { ensureSchema, getLinksForUser } from '@/lib/db';
import { hasDb } from '@/lib/db';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Meu painel',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await ensureSchema();
  const user = await getSessionUser();
  if (!user) redirect('/entrar');

  const links = await getLinksForUser(user.id);
  // Higieniza o que vai pro client: hash de senha e mensagem do cadastro não precisam aqui
  const { password_hash, message, ...safeUser } = user;
  return <DashboardClient initialUser={safeUser} initialLinks={links} demoMode={!hasDb} />;
}
