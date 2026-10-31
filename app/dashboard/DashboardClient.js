'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProfileView from '@/components/ProfileView';
import ImageCropper from '@/components/ImageCropper';
import Icon, { hasIcon, LINK_ICONS } from '@/components/Icon';
import Logo from '@/components/Logo';
import { PRESETS, applyPreset, LINK_BRANDS, BADGE_POSITIONS } from '@/lib/theme';
import { withHttps } from '@/lib/validate';

const BTN_STYLES = { glass: 'Vidro', solid: 'Sólido', gradient: 'Gradiente', outline: 'Contorno' };
const EFFECTS = { blobs: 'Manchas', grid: 'Grade', none: 'Nenhum' };
const FONTS = { inter: 'Inter', grotesk: 'Space Grotesk', mono: 'Monoespaçada' };
const RING_STYLES = { spin: 'Arco animado', solid: 'Anel sólido', grad: 'Degradê', none: 'Nenhuma' };

// Seletor de ícone em SVG (substitui o antigo <select> de emojis).
// Com ícones legados (emoji salvo no banco), mostra o emoji cru até ser trocado.
function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="icon-pick">
      <button
        type="button"
        className="icon-pick-btn"
        onClick={() => setOpen((o) => !o)}
        title="Trocar ícone"
        aria-label="Trocar ícone do link"
        aria-expanded={open}
      >
        {hasIcon(value) ? <Icon name={value} size={18} strokeWidth={2.2} /> : (value || <Icon name="link" size={18} strokeWidth={2.2} />)}
      </button>
      {open && (
        <div className="icon-pick-pop" role="listbox" aria-label="Escolha o ícone">
          {LINK_ICONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`icon-pick-opt ${n === value ? 'on' : ''}`}
              onClick={() => { onChange(n); setOpen(false); }}
              aria-label={n}
              title={n}
            >
              <Icon name={n} size={17} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardClient({ initialUser, initialLinks, demoMode }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [links, setLinks] = useState(initialLinks);
  const [theme, setTheme] = useState(initialUser.theme);
  const [ring, setRing] = useState(initialUser.ring || { style: 'spin', color: null, color2: null, width: 4 });
  const [tab, setTab] = useState('perfil');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(''); // 'avatar' | 'cover' | 'photo' | ''
  const [newLink, setNewLink] = useState({ label: '', url: '', icon: 'link' });
  const [crop, setCrop] = useState(null); // { kind, file } → editor de recorte
  const [styleFor, setStyleFor] = useState(null); // id do link com painel de tema aberto

  const firstTheme = useRef(true);
  const firstRing = useRef(true);
  const timers = useRef({});
  const avatarInput = useRef(null);
  const coverInput = useRef(null);
  const photosInput = useRef(null);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const api = async (url, opts = {}) => {
    const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.ok === false) throw new Error(d.error || 'Algo deu errado.');
    return d;
  };

  // Salva o tema automaticamente (com debounce) sempre que mudar.
  useEffect(() => {
    if (firstTheme.current) {
      firstTheme.current = false;
      return undefined;
    }
    const t = setTimeout(() => {
      api('/api/profile', { method: 'PATCH', body: JSON.stringify({ theme }) })
        .catch((e) => showToast(e.message, 'err'));
    }, 450);
    return () => clearTimeout(t);
  }, [theme]);

  // Aureola do avatar também salva sozinha (mesma técnica).
  useEffect(() => {
    if (firstRing.current) {
      firstRing.current = false;
      return undefined;
    }
    const t = setTimeout(() => {
      api('/api/profile', { method: 'PATCH', body: JSON.stringify({ ring }) })
        .catch((e) => showToast(e.message, 'err'));
    }, 450);
    return () => clearTimeout(t);
  }, [ring]);

  const setField = (k, v) => setUser((u) => ({ ...u, [k]: v }));

  /* ── Uploads de imagem (sempre passam pelo editor de recorte) ── */

  const uploadImage = async (file, kind) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.ok === false) throw new Error(d.error || 'Falha no upload.');
    return d.url;
  };

  // Abre o editor de recorte com o arquivo escolhido (o upload só acontece depois).
  const openCrop = (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCrop({ kind, file });
  };

  // Recorte confirmado → WebP gerado no cliente → envia pro pipeline normal.
  const onCropConfirm = async (file) => {
    const kind = crop?.kind || 'photo';
    setCrop(null);
    setUploading(kind);
    try {
      const url = await uploadImage(file, kind);
      if (kind === 'avatar' || kind === 'cover') {
        const key = kind === 'avatar' ? 'avatar_url' : 'cover_url';
        const d = await api('/api/profile', { method: 'PATCH', body: JSON.stringify({ [key]: url }) });
        setUser((prev) => ({ ...prev, ...d.user }));
        showToast(kind === 'avatar' ? 'Foto de perfil atualizada!' : 'Capa atualizada!');
      } else {
        const next = [...(Array.isArray(user.photos) ? user.photos : []), url].slice(0, 24);
        const d = await api('/api/profile', { method: 'PATCH', body: JSON.stringify({ photos: next }) });
        setUser((prev) => ({ ...prev, ...d.user }));
        showToast('Foto enviada!');
      }
    } catch (err) {
      showToast(err.message, 'err');
    } finally {
      setUploading('');
    }
  };

  const removePhoto = (src) => {
    const next = (user.photos || []).filter((p) => p !== src);
    setField('photos', next);
    api('/api/profile', { method: 'PATCH', body: JSON.stringify({ photos: next }) })
      .catch((err) => showToast(err.message, 'err'));
  };

  const clearImage = (kind) => {
    const key = kind === 'avatar' ? 'avatar_url' : 'cover_url';
    setField(key, '');
    api('/api/profile', { method: 'PATCH', body: JSON.stringify({ [key]: '' }) })
      .catch((err) => showToast(err.message, 'err'));
  };

  /* ── Perfil / links ── */

  const saveProfile = async () => {
    setSaving(true);
    try {
      const d = await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: user.display_name,
          bio: user.bio,
          avatar_url: withHttps(user.avatar_url),
          cover_url: withHttps(user.cover_url),
          username: user.username
        })
      });
      setUser((prev) => ({ ...prev, ...d.user }));
      showToast('Perfil salvo!');
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  const patchLink = (id, patch) => {
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    const key = `link-${id}`;
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {
      const body = { ...patch };
      if (patch.url !== undefined) body.url = withHttps(patch.url); // https:// automático no envio
      api(`/api/links/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
        .catch((e) => showToast(e.message, 'err'));
    }, 450);
  };

  const patchCustom = (id, patch) => {
    const l = links.find((x) => x.id === id);
    if (!l) return;
    patchLink(id, { custom: { ...(l.custom || {}), ...patch } });
  };

  // Escolhe o tema de marca do botão e, se o ícone ainda é o padrão, aplica o da marca.
  const chooseBrand = (l, brand) => {
    patchLink(l.id, {
      custom: { ...(l.custom || {}), brand, bg: null, fg: null, grad: false },
      ...(brand && (!l.icon || l.icon === 'link' || l.icon === '🔗') ? { icon: LINK_BRANDS[brand].icon } : {})
    });
  };

  const addLink = async () => {
    if (!newLink.label.trim() || !newLink.url.trim()) {
      showToast('Preencha o título e o endereço.', 'err');
      return;
    }
    setAdding(true);
    try {
      const body = { ...newLink, url: withHttps(newLink.url) }; // https:// automático
      const d = await api('/api/links', { method: 'POST', body: JSON.stringify(body) });
      setLinks((ls) => [...ls, d.link]);
      setNewLink({ label: '', url: '', icon: 'link' });
      showToast('Link adicionado!');
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setAdding(false);
    }
  };

  const removeLink = async (id) => {
    setLinks((ls) => ls.filter((l) => l.id !== id));
    try {
      await api(`/api/links/${id}`, { method: 'DELETE' });
    } catch (e) {
      showToast(e.message, 'err');
    }
  };

  const moveLink = async (id, dir) => {
    try {
      const d = await api(`/api/links/${id}/move`, { method: 'POST', body: JSON.stringify({ dir }) });
      setLinks(d.links);
    } catch (e) {
      showToast(e.message, 'err');
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${user.username}`);
      showToast('URL copiada!');
    } catch {
      showToast('Não consegui copiar. Tente de novo.', 'err');
    }
  };

  const toggleWatermark = (val) => {
    setField('hide_watermark', val);
    api('/api/profile', { method: 'PATCH', body: JSON.stringify({ hide_watermark: val }) })
      .then((d) => setUser((prev) => ({ ...prev, hide_watermark: d.user.hide_watermark })))
      .catch((e) => showToast(e.message, 'err'));
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
    router.refresh();
  };

  const previewUser = { ...user, theme, ring, badge: user.verified ? (user.badge || 'name') : 'name' };
  const pending = user.approved === false;
  const TABS = [
    ['perfil', 'Perfil', 'user'],
    ['links', 'Links', 'link'],
    ['tema', 'Aparência', 'palette'],
    ['fotos', 'Fotos', 'image']
  ];

  return (
    <div className="dash">
      <header className="dash-top">
        <Link href="/" className="dash-logo">
          <Logo size={22} /> <b>JRWay</b>
        </Link>
        <div className="dash-actions">
          <button type="button" className="dash-url" onClick={copyUrl} title="Copiar o link da sua página">
            <Icon name="link" size={14} /> /{user.username} · copiar
          </button>
          {!pending && (
            <a className="btn btn-ghost btn-sm" href={`/${user.username}`} target="_blank" rel="noreferrer">
              Ver página <Icon name="external" size={13} />
            </a>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>Sair</button>
        </div>
      </header>

      {pending && (
        <div className="pending-note">
          Sua conta está <b>aguardando aprovação</b> do administrador.
          Deixe sua página pronta enquanto isso — ela fica visível assim que aprovarem.
        </div>
      )}

      {demoMode && (
        <div className="demo-note">
          <Icon name="warn" size={15} /> Modo demonstração: dados salvos apenas neste computador (<code>.data/db.json</code>) e
          uploads em <code>public/uploads</code>. Configure <code>DATABASE_URL</code> + <code>GITHUB_TOKEN/GITHUB_REPO</code> em produção.
        </div>
      )}

      <div className="dash-grid">
        <div className="dash-panel">
          <div className="dash-tabs">
            {TABS.map(([id, label, ic]) => (
              <button key={id} type="button" className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
                <Icon name={ic} size={15} /> {label}
              </button>
            ))}
          </div>

          {tab === 'perfil' && (
            <section className="panel-section">
              <div className="field">
                <label htmlFor="dname">Nome de exibição</label>
                <input id="dname" className="input" maxLength={40} value={user.display_name || ''} onChange={(e) => setField('display_name', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="uname">Seu endereço público</label>
                <div className="input-affix">
                  <span>@</span>
                  <input id="uname" className="input" maxLength={24} value={user.username || ''} onChange={(e) => setField('username', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} />
                </div>
                <p className="hint">Cuidado: mudar o @username muda o link da sua página.</p>
              </div>

              {/* Avatar */}
              <div className="field">
                <label>Foto de perfil</label>
                <div className="upload-row">
                  <div className="avatar-mini">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar_url} alt="Seu avatar" />
                    ) : (
                      <span className="avatar-mini-empty"><Icon name="user" size={26} /></span>
                    )}
                  </div>
                  <input ref={avatarInput} type="file" accept="image/*" className="file-hidden" onChange={(e) => openCrop(e, 'avatar')} />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => avatarInput.current?.click()} disabled={uploading === 'avatar'}>
                    <Icon name="scissors" size={15} /> {uploading === 'avatar' ? 'Enviando…' : 'Escolher foto'}
                  </button>
                  {user.avatar_url && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => clearImage('avatar')}>Remover</button>
                  )}
                </div>
                <p className="hint">Abre o editor: recorte, gire, dê zoom e espelhe — sai em WebP otimizado.</p>
              </div>

              {/* Capa */}
              <div className="field">
                <label>Capa da página</label>
                <div className="upload-row">
                  {user.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="cover-mini" src={user.cover_url} alt="Sua capa" />
                  ) : (
                    <span className="cover-mini cover-mini-empty"><Icon name="image" size={26} /></span>
                  )}
                  <input ref={coverInput} type="file" accept="image/*" className="file-hidden" onChange={(e) => openCrop(e, 'cover')} />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => coverInput.current?.click()} disabled={uploading === 'cover'}>
                    <Icon name="scissors" size={15} /> {uploading === 'cover' ? 'Enviando…' : 'Escolher capa'}
                  </button>
                  {user.cover_url && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => clearImage('cover')}>Remover</button>
                  )}
                </div>
                <p className="hint">Formato 3:1 (1200×400) — o editor já te mostra exatamente o enquadramento final.</p>
              </div>

              <div className="field">
                <label htmlFor="bio">Bio (até 160 caracteres)</label>
                <textarea id="bio" className="input" rows={3} maxLength={160} placeholder="Uma frase sobre você" value={user.bio || ''} onChange={(e) => setField('bio', e.target.value)} />
              </div>
              <button type="button" className="btn btn-primary btn-wide" onClick={saveProfile} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar perfil'}
              </button>
            </section>
          )}

          {tab === 'links' && (
            <section className="panel-section">
              <div className="add-row">
                <IconPicker value={newLink.icon} onChange={(n) => setNewLink((nl) => ({ ...nl, icon: n }))} />
                <input className="input" placeholder="Título (ex: Meu Instagram)" maxLength={60} value={newLink.label} onChange={(e) => setNewLink((n) => ({ ...n, label: e.target.value }))} />
                <input className="input" placeholder="exemplo.com — https:// é automático" maxLength={500} value={newLink.url} onChange={(e) => setNewLink((n) => ({ ...n, url: e.target.value }))} />
                <button type="button" className="btn btn-primary" onClick={addLink} disabled={adding}>
                  <Icon name="plus" size={15} /> Adicionar
                </button>
              </div>

              <div className="links-list">
                {links.map((l) => {
                  const c = l.custom || {};
                  const hasCustom = Boolean(c.brand || c.bg || c.grad);
                  return (
                    <div className="link-row" key={l.id}>
                      <IconPicker value={l.icon} onChange={(n) => patchLink(l.id, { icon: n })} />
                      <input className="input" value={l.label} maxLength={60} onChange={(e) => patchLink(l.id, { label: e.target.value })} aria-label="Título" />
                      <input className="input" value={l.url} onChange={(e) => patchLink(l.id, { url: e.target.value })} aria-label="Endereço (https:// automático)" />
                      <div className="link-tools">
                        <button type="button" className="tool-btn" onClick={() => moveLink(l.id, 'up')} title="Subir" aria-label="Subir"><Icon name="arrowUp" size={15} /></button>
                        <button type="button" className="tool-btn" onClick={() => moveLink(l.id, 'down')} title="Descer" aria-label="Descer"><Icon name="arrowDown" size={15} /></button>
                        <button type="button" className={`tool-btn ${l.active ? 'on' : ''}`} onClick={() => patchLink(l.id, { active: !l.active })} title={l.active ? 'Ocultar' : 'Mostrar'} aria-label={l.active ? 'Ocultar link' : 'Mostrar link'}>
                          <Icon name={l.active ? 'eye' : 'ban'} size={15} />
                        </button>
                        <button
                          type="button"
                          className={`tool-btn ${styleFor === l.id || hasCustom ? 'ok' : ''}`}
                          onClick={() => setStyleFor(styleFor === l.id ? null : l.id)}
                          title="Tema individual do botão"
                          aria-label="Tema individual do botão"
                        >
                          <Icon name="palette" size={15} />
                        </button>
                        <button type="button" className="tool-btn danger" onClick={() => removeLink(l.id)} title="Excluir" aria-label="Excluir link"><Icon name="trash" size={15} /></button>
                      </div>
                      <span className="link-clicks">{l.clicks || 0} cliques</span>

                      {/* Tema individual por botão */}
                      {styleFor === l.id && (
                        <div className="style-panel">
                          <p className="panel-label">Tema do botão “{l.label || 'sem título'}”</p>
                          <div className="brand-chips" role="group" aria-label="Tema do botão">
                            <button type="button" className={`chip ${!c.brand ? 'on' : ''}`} onClick={() => chooseBrand(l, null)}>Nenhum</button>
                            {Object.entries(LINK_BRANDS).map(([id, b]) => (
                              <button key={id} type="button" className={`chip ${c.brand === id ? 'on' : ''}`} onClick={() => chooseBrand(l, id)}>
                                <Icon name={b.icon} size={15} /> {b.name}
                              </button>
                            ))}
                          </div>

                          {!c.brand && (
                            <>
                              <div className="style-colors">
                                <label className="color-item">
                                  <input type="color" value={c.bg || '#7c5cff'} onChange={(e) => patchCustom(l.id, { bg: e.target.value })} />
                                  <span>Fundo</span>
                                </label>
                                <label className={`color-item ${!c.bg ? 'off' : ''}`}>
                                  <input type="color" value={c.fg || '#ffffff'} disabled={!c.bg} onChange={(e) => patchCustom(l.id, { fg: e.target.value })} />
                                  <span>Texto</span>
                                </label>
                                <label className="style-check">
                                  <input type="checkbox" checked={Boolean(c.grad)} onChange={(e) => patchCustom(l.id, { grad: e.target.checked })} />
                                  <span>Gradiente</span>
                                </label>
                                {(c.bg || c.fg || c.grad) && (
                                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => patchCustom(l.id, { bg: null, fg: null, grad: false })}>
                                    <Icon name="rotateCcw" size={14} /> Limpar
                                  </button>
                                )}
                              </div>
                              <p className="hint">Sem tema próprio, o botão segue o estilo global da página (aba Aparência).</p>
                            </>
                          )}
                          {c.brand && (
                            <p className="hint">Tema oficial do {LINK_BRANDS[c.brand].name} — aperte “Nenhum” para voltar ao estilo da página.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!links.length && <p className="dash-hint">Adicione seu primeiro link aí em cima.</p>}
              </div>
            </section>
          )}

          {tab === 'tema' && (
            <section className="panel-section">
              <p className="panel-label">Temas prontos</p>
              <div className="theme-presets">
                {Object.entries(PRESETS).map(([id, p]) => (
                  <button key={id} type="button" className={`preset ${theme.preset === id ? 'active' : ''}`} onClick={() => setTheme((t) => applyPreset(t, id))}>
                    <span className="preset-swatch" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }} />
                    {p.name}
                  </button>
                ))}
              </div>

              <p className="panel-label">Cores personalizadas</p>
              <div className="color-row">
                {[['bg1', 'Fundo 1'], ['bg2', 'Fundo 2'], ['text', 'Texto'], ['accent', 'Destaque 1'], ['accent2', 'Destaque 2']].map(([k, label]) => (
                  <label key={k} className="color-item">
                    <input type="color" value={theme[k]} onChange={(e) => setTheme((t) => ({ ...t, [k]: e.target.value, preset: null }))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <p className="panel-label">Aureola da foto de perfil</p>
              <div className="seg" role="group" aria-label="Estilo da aureola">
                {Object.entries(RING_STYLES).map(([k, label]) => (
                  <button key={k} type="button" className={ring.style === k ? 'active' : ''} onClick={() => setRing((r) => ({ ...r, style: k }))}>
                    {label}
                  </button>
                ))}
              </div>
              {ring.style !== 'none' && (
                <>
                  <div className="color-row ring-colors">
                    <label className="color-item">
                      <input type="color" value={ring.color || theme.accent} onChange={(e) => setRing((r) => ({ ...r, color: e.target.value }))} />
                      <span>Cor da aureola</span>
                    </label>
                    {ring.style !== 'solid' && (
                      <label className="color-item">
                        <input type="color" value={ring.color2 || theme.accent2} onChange={(e) => setRing((r) => ({ ...r, color2: e.target.value }))} />
                        <span>Segunda cor</span>
                      </label>
                    )}
                  </div>
                  <p className="panel-label">Espessura — {ring.width}px</p>
                  <input type="range" className="range" min={2} max={8} value={ring.width} onChange={(e) => setRing((r) => ({ ...r, width: Number(e.target.value) }))} aria-label="Espessura da aureola" />
                </>
              )}

              {user.verified && (
                <>
                  <p className="panel-label">Posição do selo verificado</p>
                  <div className="seg" role="group" aria-label="Posição do selo verificado">
                    {Object.entries(BADGE_POSITIONS).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        className={(user.badge || 'name') === k ? 'active' : ''}
                        onClick={() => {
                          setField('badge', k);
                          api('/api/profile', { method: 'PATCH', body: JSON.stringify({ badge: k }) })
                            .catch((e) => showToast(e.message, 'err'));
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <p className="panel-label">Crédito “Criado no JRWay”</p>
                  <label className="style-check">
                    <input type="checkbox" checked={Boolean(user.hide_watermark)} onChange={(e) => toggleWatermark(e.target.checked)} />
                    <span>Ocultar o crédito no fim da página</span>
                  </label>
                  <p className="hint">Só perfis verificados podem remover. O selo verificado fica no lugar que você escolher acima.</p>
                </>
              )}

              <p className="panel-label">Estilo dos botões</p>
              <div className="seg">
                {Object.entries(BTN_STYLES).map(([k, label]) => (
                  <button key={k} type="button" className={theme.buttonStyle === k ? 'active' : ''} onClick={() => setTheme((t) => ({ ...t, buttonStyle: k }))}>
                    {label}
                  </button>
                ))}
              </div>

              <p className="panel-label">Efeito de fundo</p>
              <div className="seg">
                {Object.entries(EFFECTS).map(([k, label]) => (
                  <button key={k} type="button" className={theme.effect === k ? 'active' : ''} onClick={() => setTheme((t) => ({ ...t, effect: k }))}>
                    {label}
                  </button>
                ))}
              </div>

              <p className="panel-label">Fonte</p>
              <div className="seg">
                {Object.entries(FONTS).map(([k, label]) => (
                  <button key={k} type="button" className={theme.font === k ? 'active' : ''} onClick={() => setTheme((t) => ({ ...t, font: k }))}>
                    {label}
                  </button>
                ))}
              </div>

              <p className="panel-label">Arredondamento dos botões — {theme.radius}px</p>
              <input type="range" min={4} max={28} value={theme.radius} onChange={(e) => setTheme((t) => ({ ...t, radius: Number(e.target.value) }))} className="range" />

              <p className="dash-hint">Tudo é salvo automaticamente. Veja na prévia ao lado.</p>
            </section>
          )}

          {tab === 'fotos' && (
            <section className="panel-section">
              <div className="upload-row">
                <input ref={photosInput} type="file" accept="image/*" className="file-hidden" onChange={(e) => openCrop(e, 'photo')} />
                <button type="button" className="btn btn-primary" onClick={() => photosInput.current?.click()} disabled={uploading === 'photo'}>
                  <Icon name="scissors" size={15} /> {uploading === 'photo' ? 'Enviando…' : 'Enviar foto'}
                </button>
              </div>
              <p className="hint">
                Escolha o arquivo e o editor abre na hora: recorte na proporção que quiser (1:1, 4:5, 16:9, 3:2),
                gire, dê zoom — sai em <b>WebP</b> e é hospedado no repositório de dados no GitHub. Máximo de 24 fotos.
              </p>

              <div className="photo-grid">
                {(user.photos || []).map((src) => (
                  <div className="photo-item" key={src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Foto enviada" loading="lazy" />
                    <button type="button" className="photo-remove" onClick={() => removePhoto(src)} title="Remover foto" aria-label="Remover foto">
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                ))}
                {!(user.photos || []).length && <p className="dash-hint">Nenhuma foto ainda — envie a primeira.</p>}
              </div>
            </section>
          )}
        </div>

        <aside className="dash-preview">
          <div className="phone phone--sm">
            <div className="phone-screen">
              <ProfileView user={previewUser} links={links.filter((l) => l.active)} preview />
            </div>
          </div>
          <p className="preview-hint">Prévia ao vivo — as mudanças aparecem aqui na hora.</p>
        </aside>
      </div>

      {crop && (
        <ImageCropper
          file={crop.file}
          kind={crop.kind}
          onCancel={() => setCrop(null)}
          onConfirm={onCropConfirm}
        />
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
