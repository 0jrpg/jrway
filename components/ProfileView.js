'use client';

import { fontStack, textColorFor, darkenHex, normalizeRing, normalizeBadge } from '@/lib/theme';
import Icon, { hasIcon } from '@/components/Icon';
import Logo from '@/components/Logo';
import SafeImg from '@/components/SafeImg';

// Renderiza a página bio de um usuário. Usada por:
//  - /:username (página pública)
//  - prévia ao vivo do dashboard
// Client Component: permite o onClick da prévia em qualquer contexto.
export default function ProfileView({ user, links = [], preview = false }) {
  const t = user.theme || {};
  const initial = (user.display_name || '?').trim().charAt(0).toUpperCase();
  const photos = Array.isArray(user.photos) ? user.photos.slice(0, 24) : [];

  // Aureola do avatar + posição do selo verificado (normalizados até na prévia)
  const ring = normalizeRing(user.ring);
  const badgePos = normalizeBadge(user.badge);

  // Ícone do link: nomes do catálogo viram SVG; emojis legados continuam texto.
  const linkIcon = (name, extra) => (hasIcon(name) ? <Icon name={name} {...(extra || {})} /> : name);
  const styleVars = {
    '--bg1': t.bg1,
    '--bg2': t.bg2,
    '--text': t.text,
    '--accent': t.accent,
    '--accent2': t.accent2,
    '--radius': `${t.radius}px`,
    '--font': fontStack(t.font),
    '--link-text': t.buttonStyle === 'outline' ? t.accent : textColorFor(t.accent)
  };

  // Aparência individual do botão (l.custom) — tema de marca, cor própria ou gradiente.
  const lookFor = (l) => {
    const c = l.custom || {};
    if (c.brand) {
      // tema de marca é 100% CSS (gradiente/sólido oficial) — inclusive o ícone
      return { cls: `pv-link--${c.brand}`, style: null, icon: c.brand };
    }
    if (c.bg) {
      return {
        cls: 'pv-link--custom',
        style: {
          background: c.grad ? `linear-gradient(135deg, ${c.bg}, ${darkenHex(c.bg, 0.35)})` : c.bg,
          color: c.fg || textColorFor(c.bg)
        }
      };
    }
    if (c.grad) {
      // gradiente nos tons do tema do perfil
      return { cls: 'pv-link--grad', style: { color: textColorFor(t.accent) } };
    }
    return { cls: '', style: null }; // estilo padrão do tema (bstyle-*)
  };

  // Estilo da aureola (cores próprias + espessura via CSS vars)
  const ringStyle = {};
  if (ring.style !== 'none') {
    if (ring.color) {
      ringStyle['--ring-c1'] = ring.color;
      if (ring.color2) ringStyle['--ring-c2'] = ring.color2;
    }
    // 2px de fôlego pra fora; a espessura aparece inteira ao redor da foto
    ringStyle['--ring-w'] = `${ring.width}px`;
    ringStyle.inset = `-${ring.width + 2}px`;
  }

  const Badge = ({ className = '', size = 13 }) => (
    <span className={`pv-badge pv-badge--${badgePos} ${className}`} title="Perfil verificado">
      <Icon name="badgeCheck" size={size} />
    </span>
  );

  const mark = <Logo size={15} className="pv-mark" />;

  return (
    <div
      className={`pv effect-${t.effect || 'blobs'} bstyle-${t.buttonStyle || 'glass'} ${preview ? 'pv-preview' : 'pv-page'}`}
      style={styleVars}
    >
      {/* efeitos de fundo */}
      {t.effect === 'blobs' && (
        <div className="pv-blobs" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {t.effect === 'grid' && <div className="pv-grid" aria-hidden="true" />}

      <div className="pv-inner">
        {/* capa */}
        {user.cover_url && (
          <div className="pv-cover-wrap">
            <SafeImg className="pv-cover" src={user.cover_url} alt="" />
          </div>
        )}

        <div className={`pv-avatar-wrap ${user.cover_url ? 'overlap' : ''}`}>
          {ring.style !== 'none' && <span className={`pv-ring pv-ring--${ring.style}`} style={ringStyle} aria-hidden="true" />}
          {badgePos === 'avatar' && user.verified && <Badge size={15} />}
          {user.avatar_url ? (
            <SafeImg className="pv-avatar" src={user.avatar_url} alt={`Foto de ${user.display_name}`} />
          ) : (
            <div className="pv-avatar pv-avatar-empty">{initial}</div>
          )}
        </div>

        <h1 className="pv-name">
          {user.display_name}
          {user.admin_badge ? (
            <span className="pv-badge pv-badge--admin" title="Equipe JRWay">
              <Icon name="shield" size={11} />
            </span>
          ) : null}
          {user.verified && badgePos === 'name' ? <Badge /> : null}
        </h1>
        <span className="pv-handle">
          @{user.username}
          {user.verified && badgePos === 'username' ? <Badge /> : null}
        </span>

        {user.bio ? <p className="pv-bio">{user.bio}</p> : null}

        <div className="pv-links">
          {links.map((l, i) => {
            const look = lookFor(l);
            const iconName = look.icon || l.icon || 'link';
            const svgIcon = hasIcon(iconName);
            return (
              <a
                key={l.id}
                className={`pv-link ${look.cls}`}
                style={{ '--i': i, ...look.style }}
                href={preview ? undefined : `/api/c/${l.id}`}
                target={preview ? undefined : '_blank'}
                rel="noopener noreferrer"
                onClick={preview ? (e) => e.preventDefault() : undefined}
                title={preview ? l.url : undefined}
              >
                <span className={`pv-link-icon ${svgIcon ? 'pv-icon-svg' : ''}`}>
                  {linkIcon(iconName, { size: 19 })}
                </span>
                <span className="pv-link-label">{l.label}</span>
                <span className="pv-link-arrow" aria-hidden="true"><Icon name="arrowRight" size={17} /></span>
              </a>
            );
          })}
          {!links.length && <p className="pv-empty">Nenhum link por aqui ainda…</p>}
        </div>

        {/* galeria de fotos — imagens protegidas (sem arrastar / sem salvar) */}
        {photos.length > 0 && (
          <section className="pv-gallery">
            <p className="pv-gallery-title">
              <Icon name="camera" size={13} /> fotos
            </p>
            <div className="pv-gallery-grid">
              {photos.map((src, i) => (
                <div key={`${src}-${i}`} className="pv-photo" style={{ '--i': i }}>
                  <SafeImg src={src} alt={`Foto ${i + 1} de ${user.display_name}`} loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* crédito (perfis verificados podem ocultar via painel) */}
        {!preview && !user.hide_watermark && (
          <a className="pv-watermark" href="/" target="_top">
            {mark} criado no <b>JRWay</b>
          </a>
        )}
        {/* na prévia, mostra a falsa (sem link) quando NÃO está ocultado */}
        {preview && !user.hide_watermark && (
          <span className="pv-watermark pv-watermark--fake" aria-hidden="true">
            {mark} criado no <b>JRWay</b>
          </span>
        )}
      </div>
    </div>
  );
}
