'use client';

// Editor de recorte estilo Instagram — sem dependências.
//
// O "frame" de recorte fica FIXO no lugar (só muda a proporção escolhida);
// a imagem é quem se move: arrastar (pan), zoom (slider, roda e pinça),
// girar de 90° em 90° e espelhar. Ao confirmar, a mesmo sequência de
// transformações é reaplicada num <canvas> offscreen → WebP → segue pelo
// pipeline normal de /api/upload (conversão + hospedagem no servidor).
//
// kinds: 'avatar' (1:1 → 512²) | 'cover' (3:1 → 1200×400) | 'photo' (chips).

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

const ZOOM_MIN = 1;
const ZOOM_MAX = 6;

const PHOTO_RATIOS = [
  { id: '1:1', w: 1, h: 1, label: '1:1' },
  { id: '4:5', w: 4, h: 5, label: '4:5' },
  { id: '16:9', w: 16, h: 9, label: '16:9' },
  { id: '3:2', w: 3, h: 2, label: '3:2' }
];

const KINDS = {
  avatar: { title: 'Foto de perfil', ratio: { w: 1, h: 1 } },
  cover: { title: 'Capa da página', ratio: { w: 3, h: 1 } },
  photo: { title: 'Foto da galeria' }
};

const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

export default function ImageCropper({ file, kind, onCancel, onConfirm }) {
  const conf = KINDS[kind] || KINDS.photo;

  const [rot, setRot] = useState(0); // 0 | 90 | 180 | 270
  const [flip, setFlip] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const [off, setOff] = useState({ x: 0, y: 0 }); // deslocamento em px de tela
  const [ratioId, setRatioId] = useState(kind === 'photo' ? '1:1' : null);
  const [src, setSrc] = useState('');
  const [meta, setMeta] = useState(null); // { nw, nh }
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState({ W: 0, H: 0 });
  const [dragging, setDragging] = useState(false);

  const loader = useRef(null); // Image pré-carregada (fonte do canvas)
  const stageEl = useRef(null);
  const pointers = useRef(new Map());
  const geo = useRef({ zoom, maxX: 0, maxY: 0 }); // valores frescos p/ eventos

  const ratio = kind === 'photo'
    ? PHOTO_RATIOS.find((r) => r.id === ratioId) || PHOTO_RATIOS[0]
    : conf.ratio;

  /* ── objeto renderizável + pré-carregamento ── */
  useEffect(() => {
    // flag anti-corrida: em dev o StrictMode monta o componente duas vezes e o
    // cleanup revoga a 1ª object URL no meio da carga — o onerror órfão não pode
    // sobrescrever o estado depois do remount bem-sucedido.
    let cancelled = false;
    const u = URL.createObjectURL(file);
    const im = new Image();
    loader.current = im;
    im.onload = () => { if (!cancelled) setMeta({ nw: im.naturalWidth, nh: im.naturalHeight }); };
    im.onerror = () => { if (!cancelled) setError('Não consegui abrir esta imagem. Tente outro arquivo.'); };
    im.src = u;
    setSrc(u);
    return () => {
      cancelled = true;
      URL.revokeObjectURL(u);
    };
  }, [file]);

  /* ── medição do frame em px reais ── */
  useEffect(() => {
    const el = stageEl.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setStage({ W: r.width, H: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ratioId]);

  /* ── roda do mouse = zoom (listener nativo; precisa de preventDefault) ── */
  useEffect(() => {
    const el = stageEl.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      applyZoom(geo.current.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  /* ── geometria derivada ── */
  const ready = Boolean(meta && stage.W > 0 && stage.H > 0);
  const rotSwap = (rot % 180) !== 0;
  let b = 1, rw = 0, rh = 0, maxX = 0, maxY = 0;
  if (ready) {
    // tamanho de layout que cobre o frame por completo já com zoom = 1
    const dwN = rotSwap ? meta.nh : meta.nw; // largura natural girada
    const dhN = rotSwap ? meta.nw : meta.nh;
    b = Math.max(stage.W / dwN, stage.H / dhN);
    rw = meta.nw * b;
    rh = meta.nh * b;
    const dwL = rotSwap ? rh : rw; // bbox girada em px de tela
    const dhL = rotSwap ? rw : rh;
    maxX = Math.max(0, (dwL * zoom - stage.W) / 2);
    maxY = Math.max(0, (dhL * zoom - stage.H) / 2);
  }
  const ox = ready ? clamp(off.x, -maxX, maxX) : 0;
  const oy = ready ? clamp(off.y, -maxY, maxY) : 0;
  geo.current = { zoom, maxX, maxY };

  // Reaperta os offsets quando zoom/rotação/proporção mudam
  useEffect(() => {
    if (!ready) return undefined;
    setOff((o) => {
      const nx = clamp(o.x, -maxX, maxX);
      const ny = clamp(o.y, -maxY, maxY);
      return nx === o.x && ny === o.y ? o : { x: nx, y: ny };
    });
    return undefined;
  }, [ready, maxX, maxY]);

  /* ── controles ── */
  const applyZoom = (z1) => {
    // mantém o conteúdo central "ancorado" durante o zoom
    const z = clamp(z1, ZOOM_MIN, ZOOM_MAX);
    if (ready) setOff((o) => ({ x: (o.x / zoom) * z, y: (o.y / zoom) * z }));
    setZoom(z);
  };

  const rotate = (dir) => setRot((r) => (r + (dir > 0 ? 90 : 270)) % 360);

  const onPointerDown = (e) => {
    if (!ready || saving) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) setDragging(true);
  };

  const onPointerMove = (e) => {
    const pts = pointers.current;
    if (!pts.has(e.pointerId) || !ready || saving) return;
    const prev = pts.get(e.pointerId);
    const cur = { x: e.clientX, y: e.clientY };
    pts.set(e.pointerId, cur);
    const { maxX: mx, maxY: my } = geo.current;

    if (pts.size === 1) {
      setOff((o) => ({ x: clamp(o.x + cur.x - prev.x, -mx, mx), y: clamp(o.y + cur.y - prev.y, -my, my) }));
    } else if (pts.size === 2) {
      // pinça: zoom pela variação da distância entre os toques + pan pelo ponto médio
      const other = [...pts.values()].find((p) => p !== cur) || prev;
      const dist0 = Math.hypot(prev.x - other.x, prev.y - other.y);
      const dist1 = Math.hypot(cur.x - other.x, cur.y - other.y);
      if (dist0 > 0) {
        const z = clamp(geo.current.zoom * (dist1 / dist0), ZOOM_MIN, ZOOM_MAX);
        setZoom(z);
        setOff((o) => ({
          x: clamp(((o.x * z) / geo.current.zoom) + ((cur.x + other.x) / 2) - ((prev.x + other.x) / 2), -mx, mx),
          y: clamp(((o.y * z) / geo.current.zoom) + ((cur.y + other.y) / 2) - ((prev.y + other.y) / 2), -my, my)
        }));
      }
    }
  };

  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setDragging(false);
  };

  /* ── recorte → arquivo WebP ── */
  const confirm = () => {
    const im = loader.current;
    if (!im || !ready || saving) return;
    setSaving(true);
    try {
      // saída: mantém a proporção do frame, no tamanho padrão do tipo
      let outW, outH;
      if (kind === 'avatar') {
        outW = outH = 512;
      } else if (kind === 'cover') {
        outW = 1200; outH = 400;
      } else {
        const big = 1440;
        outW = ratio.w >= ratio.h ? big : Math.round((big * ratio.w) / ratio.h);
        outH = ratio.h >= ratio.w ? big : Math.round((big * ratio.h) / ratio.w);
      }
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      // mesma matriz aplicada na tela (frame → canvas)
      const m = outW / stage.W;
      ctx.setTransform(m, 0, 0, m, outW / 2, outH / 2);
      ctx.translate(ox, oy);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(im, -rw / 2, -rh / 2, rw, rh);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setSaving(false);
            setError('Não consegui gerar o recorte. Tente outra imagem.');
            return;
          }
          const ext = (String(blob.type || 'image/webp').split('/')[1] || 'webp').replace('jpeg', 'jpg');
          onConfirm(new File([blob], `recorte.${ext}`, { type: blob.type || 'image/webp' }));
        },
        'image/webp',
        0.92
      );
    } catch {
      setSaving(false);
      setError('Não consegui processar esta imagem.');
    }
  };

  /* ── largura do palco conforme a proporção ── */
  const stageStyle = {};
  if (ratio.h > ratio.w) stageStyle.width = `${Math.round((300 * ratio.w) / ratio.h)}px`;
  else if (ratio.h === ratio.w) stageStyle.width = '320px';
  else stageStyle.width = '100%';
  stageStyle.maxWidth = '100%';
  stageStyle.aspectRatio = `${ratio.w} / ${ratio.h}`;

  return (
    <div className="crop-overlay" role="dialog" aria-modal="true" aria-label={conf.title}>
      <div className="crop-modal">
        <header className="crop-head">
          <span className="crop-head-title"><Icon name="scissors" size={16} /> {conf.title}</span>
          <button type="button" className="tool-btn" onClick={onCancel} disabled={saving} title="Fechar sem salvar" aria-label="Fechar"><Icon name="x" size={15} /></button>
        </header>

        {error ? (
          <p className="crop-error">{error}</p>
        ) : (
          <div
            ref={stageEl}
            className={`crop-stage ${dragging ? 'grabbing' : ''}`}
            style={stageStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onLostPointerCapture={endPointer}
          >
            {src && meta && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={src}
                alt="Imagem selecionada"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: -rw / 2,
                  top: -rh / 2,
                  width: rw,
                  height: rh,
                  opacity: ready ? 1 : 0,
                  transform: `translate(${ox}px, ${oy}px) rotate(${rot}deg) scale(${zoom}) scaleX(${flip ? -1 : 1})`
                }}
              />
            )}
            {!meta && <span className="crop-loading">Carregando…</span>}
          </div>
        )}

        {kind === 'photo' && !error && (
          <div className="crop-chips" role="group" aria-label="Proporção da foto">
            {PHOTO_RATIOS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`chip ${r.id === ratioId ? 'on' : ''}`}
                onClick={() => { setRatioId(r.id); setOff({ x: 0, y: 0 }); setZoom(ZOOM_MIN); }}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {!error && meta && (
          <div className="crop-tools">
            <div className="crop-icons">
              <button type="button" className="tool-btn" onClick={() => rotate(-1)} title="Girar à esquerda" aria-label="Girar à esquerda"><Icon name="rotateCcw" size={16} /></button>
              <button type="button" className="tool-btn" onClick={() => rotate(1)} title="Girar à direita" aria-label="Girar à direita"><Icon name="rotateCw" size={16} /></button>
              <button type="button" className={`tool-btn ${flip ? 'on' : ''}`} onClick={() => setFlip((f) => !f)} title="Espelhar imagem" aria-label="Espelhar imagem"><Icon name="flip" size={16} /></button>
            </div>
            <input
              type="range"
              className="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              aria-label="Zoom"
            />
          </div>
        )}

        <footer className="crop-foot">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={confirm} disabled={!ready || saving || Boolean(error)}>
            {saving ? 'Gerando…' : (
              <>
                <Icon name="scissors" size={15} /> Recortar e usar
              </>
            )}
          </button>
        </footer>

        {!error && (
          <p className="crop-hint">
            Arraste para posicionar • roda do mouse/pinça = zoom • sai em WebP otimizado
            ({kind === 'avatar' ? '512×512' : kind === 'cover' ? '1200×400' : `até 1440px · ${ratio.label}`})
          </p>
        )}
      </div>
    </div>
  );
}
