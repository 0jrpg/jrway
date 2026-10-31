import Link from 'next/link';
import Icon from '@/components/Icon';

export default function NotFound() {
  return (
    <main className="nf">
      <div className="nf-card">
        <span className="nf-emoji"><Icon name="sprout" size={52} /></span>
        <h1>Esta página ainda não existe</h1>
        <p>Que tal criar a sua página de links em 1 minuto?</p>
        <Link className="btn btn-primary" href="/entrar?criar=1">
          Criar minha página grátis
        </Link>
      </div>
    </main>
  );
}
