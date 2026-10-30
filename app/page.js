import Link from 'next/link';
import ProfileView from '@/components/ProfileView';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import { PRESETS, normalizeTheme } from '@/lib/theme';

const DEMO_USER = {
  username: 'anaruby',
  display_name: 'Ana Ruby',
  bio: 'Dev front-end • designer • viciada em café',
  avatar_url: 'https://i.pravatar.cc/240?img=47',
  cover_url: 'https://picsum.photos/seed/jrway-cover/800/260',
  photos: [
    'https://picsum.photos/seed/jrway-a/400/400',
    'https://picsum.photos/seed/jrway-b/400/400',
    'https://picsum.photos/seed/jrway-c/400/400'
  ],
  verified: true
};

const DEMO_LINKS = [
  { id: 1, icon: 'briefcase', label: 'Meu portfólio', url: '#' },
  { id: 2, icon: 'film', label: 'Último vídeo no YouTube', url: '#' },
  { id: 3, icon: 'camera', label: 'Instagram', url: '#' },
  { id: 4, icon: 'mail', label: 'Assine minha newsletter', url: '#' }
];

const FEATURES = [
  { icon: 'palette', title: 'Personalize tudo', text: 'Temas prontos, cores customizadas, fonte, efeitos de fundo e estilo dos botões — sua cara, seu estilo.' },
  { icon: 'image',
    title: 'Hospede fotos',
    text: 'Envie qualquer imagem: convertemos para WebP e guardamos no repositório de dados. Capa, avatar e galeria.' },
  { icon: 'link', title: 'Links ilimitados', text: 'Adicione, reordene, oculte e exclua links quando quiser. Com ícones e contador de cliques.' },
  { icon: 'chart', title: 'Estatísticas', text: 'Acompanhe visitas na sua página e cliques em cada link direto do painel.' },
  { icon: 'bolt', title: 'Rápido e grátis', text: 'Sua página fica no ar em segundos, com URL própria e carregamento instantâneo.' }
];

export default function Home() {
  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true" />

      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="logo">
            <Logo size={24} /> <b>JRWay</b>
          </Link>
          <div className="nav-links">
            <a href="#como">Como funciona</a>
            <a href="#temas">Temas</a>
            <Link href="/entrar" className="btn btn-ghost btn-sm">Entrar</Link>
            <Link href="/entrar?criar=1" className="btn btn-primary btn-sm">Criar página</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="badge-pill"><Icon name="sparkle" size={14} /> Links + fotos em um só lugar</span>
            <h1 className="hero-title">
              Uma página. <span className="grad-text">Infinitas possibilidades.</span>
            </h1>
            <p className="hero-sub">
              Crie sua conta, monte sua página bio com tema, cores, efeitos e fotos — e compartilhe
              <b> seunome.jrway.app</b> em qualquer lugar. Estilo Linktree, mas com a sua identidade.
            </p>
            <div className="cta-row">
              <Link href="/entrar?criar=1" className="btn btn-primary btn-lg">Criar minha página grátis</Link>
              <Link href="/entrar" className="btn btn-ghost btn-lg">Já tenho conta</Link>
            </div>
            <p className="hero-note">Grátis • Sem cartão de crédito • Pronto em 1 minuto</p>
          </div>

          <div className="hero-demo">
            <div className="phone float">
              <div className="phone-screen">
                <ProfileView user={{ ...DEMO_USER, theme: normalizeTheme({ preset: 'meia-noite' }) }} links={DEMO_LINKS} preview />
              </div>
            </div>
            <span className="hero-demo-tag"><Icon name="heart" size={14} /> assim pode ficar a sua</span>
          </div>
        </div>
      </header>

      {/* COMO FUNCIONA */}
      <section className="section" id="como">
        <Reveal>
          <h2 className="section-title">Como funciona</h2>
          <p className="section-sub">Três passos e sua página está no ar.</p>
        </Reveal>
        <div className="steps">
          <Reveal delay={0}><div className="step"><span className="step-num">1</span><h3>Crie sua conta</h3><p>Escolha seu @username — ele vira o endereço da sua página.</p></div></Reveal>
          <Reveal delay={120}><div className="step"><span className="step-num">2</span><h3>Personalize</h3><p>Temas, cores, fonte, efeitos, avatar e fotos. Tudo com prévia em tempo real.</p></div></Reveal>
          <Reveal delay={240}><div className="step"><span className="step-num">3</span><h3>Compartilhe</h3><p>Coloque o link na bio do Instagram, TikTok, YouTube… e pronto.</p></div></Reveal>
        </div>
      </section>

      {/* RECURSOS */}
      <section className="section">
        <Reveal>
          <h2 className="section-title">Feito pra brilhar</h2>
          <p className="section-sub">Tudo o que você precisa para uma página memorável.</p>
        </Reveal>
        <div className="features">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div className="feature">
                <span className="feature-icon"><Icon name={f.icon} size={30} strokeWidth={2} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TEMAS */}
      <section className="section" id="temas">
        <Reveal>
          <h2 className="section-title">Temas prontos</h2>
          <p className="section-sub">Ou crie o seu próprio com o seletor de cores.</p>
        </Reveal>
        <div className="themes-strip">
          {Object.entries(PRESETS).map(([id, p], i) => (
            <Reveal key={id} delay={i * 80}>
              <div className="swatch">
                <span className="swatch-ball" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }} />
                <span>{p.name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section">
        <Reveal>
          <div className="cta-card">
            <h2>Pronto para aparecer na bio?</h2>
            <p>Leva menos de um minuto. Depois é só colar o link em todo lugar.</p>
            <Link href="/entrar?criar=1" className="btn btn-primary btn-lg">Começar agora — é grátis</Link>
          </div>
        </Reveal>
      </section>

      <footer className="footer">
        <p><Logo size={18} /> <b>JRWay</b> — sua página de links • Next.js + Vercel</p>
      </footer>
    </div>
  );
}
