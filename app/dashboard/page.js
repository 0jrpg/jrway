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
  return <DashboardClient initialUser={user} initialLinks={links} demoMode={!hasDb} />;
}
