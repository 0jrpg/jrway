'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';

function fmtDate(v) {
  try {
    return new Date(v).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

const STATUS_FILTERS = [
  ['todos', 'Todos'],
  ['pendente', 'Pendentes'],
  ['ativo', 'Ativos'],
  ['suspenso', 'Suspensos']
];

export default function AdminPanel({ users, stats }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');
  const [msgFor, setMsgFor] = useState(null); // usuário com mensagem aberta

  const act = async (fn, id) => {
    setBusy(id);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      alert(e.message || 'Falha na ação.');
    } finally {
      setBusy(null);
    }
  };

  const call = (id, method, body) => fetch(`/api/admin/users/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.ok === false) throw new Error(d.error || 'Falha.');
  });

  const approveUser = (u) => act(() => call(u.id, 'PATCH', { approved: true }), u.id);
  const toggleVerified = (u) => act(() => call(u.id, 'PATCH', { verified: !u.verified }), u.id);
  const toggleSuspended = (u) => act(() => call(u.id, 'PATCH', { suspended: !u.suspended }), u.id);
  const removeUser = (u) => {
    if (!confirm(`Excluir PERMANENTEMENTE @${u.username} e todos os links?`)) return;
    act(() => call(u.id, 'DELETE'), u.id);
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  };

  const copyLink = async (u) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${u.username}`);
    } catch {}
  };

  const userStatus = (u) => (u.suspended ? 'suspenso' : u.approved === false ? 'pendente' : 'ativo');

  const filtered = users.filter((u) => {
    if (status !== 'todos' && userStatus(u) !== status) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.username.includes(q) || String(u.display_name || '').toLowerCase().includes(q) || String(u.email || '').toLowerCase().includes(q);
  });

  const withMessage = (u) => (u.approved === false && u.message && String(u.message).trim());

  return (
    <div className="adm-wrap">
      <header className="dash-top">
        <span className="dash-logo"><Icon name="shield" size={20} /> <b>Admin</b></span>
        <div className="dash-actions">
          <span className="adm-badge"><Icon name="lock" size={12} /> acesso: /acess/auth/adm</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>Sair</button>
        </div>
      </header>

      <div className="adm-stats">
        <div className="stat-card"><span className="stat-num">{stats.pending}</span><span><Icon name="clock" size={13} /> aguardando aprovação</span></div>
        <div className="stat-card"><span className="stat-num">{stats.users}</span><span><Icon name="user" size={13} /> usuários</span></div>
        <div className="stat-card"><span className="stat-num">{stats.links}</span><span><Icon name="link" size={13} /> links criados</span></div>
        <div className="stat-card"><span className="stat-num">{stats.clicks}</span><span><Icon name="pointer" size={13} /> cliques</span></div>
        <div className="stat-card"><span className="stat-num">{stats.views}</span><span><Icon name="eye" size={13} /> visitas em páginas</span></div>
      </div>

      <div className="adm-toolbar">
        <input className="input" placeholder="Buscar por @usuario, nome ou e-mail…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input adm-filter" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por status">
          {STATUS_FILTERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>E-mail</th>
              <th>Links</th>
              <th>Clq.</th>
              <th>Views</th>
              <th>Criado</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const msg = withMessage(u);
              return (
                <Fragment key={u.id}>
                  <tr className={busy === u.id ? 'busy' : ''}>
                    <td>
                      <b>@{u.username}</b>
                      <span className="adm-name">{u.display_name}</span>
                      {u.verified && (
                        <span className="pv-badge" title="Verificado">
                          <Icon name="badgeCheck" size={11} />
                        </span>
                      )}
                      {msg && (
                        <button
                          type="button"
                          className="adm-msg-trigger"
                          onClick={() => setMsgFor((cur) => (cur === u.id ? null : u.id))}
                          title="Ver mensagem do usuário"
                          aria-label="Ver mensagem do usuário"
                        >
                          <Icon name="chat" size={13} /> mensagem
                        </button>
                      )}
                    </td>
                    <td className="muted">{u.email}</td>
                    <td>{u.links_count}</td>
                    <td>{u.clicks_total ?? '—'}</td>
                    <td>{u.views}</td>
                    <td className="muted">{fmtDate(u.created_at)}</td>
                    <td>
                      {u.suspended
                        ? <span className="user-badge bad">suspenso</span>
                        : u.approved === false
                          ? <span className="user-badge warn">pendente</span>
                          : <span className="user-badge ok">ativo</span>}
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button type="button" className="tool-btn" onClick={() => copyLink(u)} title="Copiar link público" aria-label="Copiar link público"><Icon name="copy" size={15} /></button>
                        {u.approved === false ? (
                          <button type="button" className="tool-btn ok" onClick={() => approveUser(u)} title="Aprovar conta" aria-label="Aprovar conta"><Icon name="check" size={15} /></button>
                        ) : (
                          <a className="tool-btn" href={`/${u.username}`} target="_blank" rel="noreferrer" title="Abrir página" aria-label="Abrir página"><Icon name="external" size={15} /></a>
                        )}
                        <button
                          type="button"
                          className={`tool-btn ${u.verified ? 'on' : ''}`}
                          onClick={() => toggleVerified(u)}
                          title={u.verified ? 'Remover verificação' : 'Verificar perfil'}
                          aria-label={u.verified ? 'Remover verificação' : 'Verificar perfil'}
                        >
                          <Icon name={u.verified ? 'check' : 'x'} size={15} />
                        </button>
                        <button
                          type="button"
                          className={`tool-btn ${u.suspended ? 'on' : ''}`}
                          onClick={() => toggleSuspended(u)}
                          title={u.suspended ? 'Reativar' : 'Suspender'}
                          aria-label={u.suspended ? 'Reativar conta' : 'Suspender conta'}
                        >
                          <Icon name={u.suspended ? 'play' : 'pause'} size={15} />
                        </button>
                        <button type="button" className="tool-btn danger" onClick={() => removeUser(u)} title="Excluir usuário" aria-label="Excluir usuário"><Icon name="trash" size={15} /></button>
                      </div>
                    </td>
                  </tr>
                  {msg && msgFor === u.id && (
                    <tr key={`${u.id}-msg`} className="adm-msg-row">
                      <td colSpan={8}>
                        <div className="adm-msg">
                          <p className="panel-label"><Icon name="chat" size={14} /> mensagem de <b>@{u.username}</b> ao aprovar</p>
                          <blockquote>{msg}</blockquote>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={8} className="adm-empty">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="dash-hint">
        <Icon name="sparkle" size={13} /> o “check” aprova a conta (a página fica pública) • o “v” dá o selo verificado •
        “pause” desativa a página do usuário • a lixeira exclui para sempre.
      </p>
    </div>
  );
}
