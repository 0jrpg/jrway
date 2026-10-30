import AuthForm from './AuthForm';

export const metadata = {
  title: 'Entrar ou criar conta',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function EntrarPage({ searchParams }) {
  const { criar } = await searchParams;
  return <AuthForm initialTab={criar ? 'criar' : 'entrar'} />;
}
