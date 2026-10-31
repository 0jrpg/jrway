import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import ProfileView from '@/components/ProfileView';
import Icon from '@/components/Icon';
import { ensureSchema, findUserByUsername, getLinksForUser, incrementViews } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw).toLowerCase();
  try {
    await ensureSchema();
    const user = await findUserByUsername(username);
    if (!user || user.approved === false || user.suspended) {
      return { title: 'Página não encontrada', robots: { index: false } };
    }
    return {
      title: `${user.display_name} (@${user.username})`,
      description: user.bio || `Todos os links de ${user.display_name} em um só lugar.`,
      alternates: { canonical: `/${user.username}` },
      openGraph: {
        title: `${user.display_name} — meus links`,
        description: user.bio || `Todos os links de ${user.display_name} em um só lugar.`,
        images: user.avatar_url ? [{ url: user.avatar_url }] : []
      }
    };
  } catch {
    return { title: 'JRWay' };
  }
}

function SuspendedScreen({ name }) {
  return (
    <main className="nf">
      <div className="nf-card">
        <span className="nf-emoji"><Icon name="ban" size={52} /></span>
        <h1>Página indisponível</h1>
        <p>Esta página foi desativada pela moderação da plataforma.</p>
      </div>
    </main>
  );
}

export default async function ProfilePage({ params }) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw).toLowerCase();

  // Usernames só podem ter o formato permitido no cadastro.
  if (!/^[a-z0-9](?:[a-z0-9_-]{1,22}[a-z0-9])$/.test(username)) notFound();

  await ensureSchema();
  const user = await findUserByUsername(username);
  if (!user) notFound();
  // Conta pendente de aprovação → página ainda não existe publicamente.
  if (user.approved === false) notFound();
  if (user.suspended) return <SuspendedScreen name={user.display_name} />;

  const links = (await getLinksForUser(user.id)).filter((l) => l.active);

  // Contador de visitas (ignorando bots)
  try {
    const ua = (await headers()).get('user-agent') || '';
    if (!/bot|crawler|spider|curl|preview|lighthouse/i.test(ua)) {
      await incrementViews(user.id);
    }
  } catch {
    // contador não deve quebrar a página
  }

  // Higieniza: ProfileView é client component → props vão serializados no HTML.
  // hash de senha e mensagem privada nunca saem aqui.
  const { password_hash, message, ...safeUser } = user;
  return <ProfileView user={safeUser} links={links} />;
}
