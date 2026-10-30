'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';

export default function AuthForm({ initialTab = 'entrar' }) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab === 'criar' ? 'criar' : 'entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(null); // true/false/null

  // Verificação em tempo real do username
  useEffect(() => {
    if (tab !== 'criar' || !username) {
      setCheck(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/check-username?u=${encodeURIComponent(username)}`);
        const d = await r.json();
        setCheck(Boolean(d.available));
      } catch {
        setCheck(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [username, tab]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = tab === 'criar' ? '/api/auth/register' : '/api/auth/login';
      const payload = tab === 'criar'
        ? { username, email, password, message: message.trim() || undefined }
        : { email, password };
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.ok === false) throw new Error(d.error || 'Algo deu errado.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <div className="landing-bg" aria-hidden="true" />

      <div className="auth-card">
        <Link href="/" className="auth-logo">
          <Logo size={26} /> <b>JRWay</b>
        </Link>
        <h1 className="auth-title">{tab === 'criar' ? 'Crie sua página' : 'Bem-vindo de volta'}</h1>
        <p className="auth-sub">
          {tab === 'criar' ? 'Escolha seu @username e comece agora.' : 'Entre para editar sua página.'}
        </p>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${tab === 'entrar' ? 'active' : ''}`} onClick={() => setTab('entrar')}>
            Entrar
          </button>
          <button type="button" className={`auth-tab ${tab === 'criar' ? 'active' : ''}`} onClick={() => setTab('criar')}>
            Criar conta
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {tab === 'criar' && (
            <div className="field">
              <label htmlFor="username">Seu @username</label>
              <input
                id="username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="ex: maria.dev"
                autoComplete="username"
                maxLength={24}
                required
              />
              {username && check === true && (
                <span className="user-check ok"><Icon name="check" size={13} /> disponível — seu link será /{username}</span>
              )}
              {username && check === false && (
                <span className="user-check bad"><Icon name="x" size={13} /> indisponível ou inválido</span>
              )}
            </div>
          )}

          <div className="field">
            <label htmlFor="email">{tab === 'criar' ? 'E-mail' : 'E-mail ou @username'}</label>
            <input
              id="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tab === 'criar' ? 'voce@email.com' : 'voce@email.com ou @usuario'}
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === 'criar' ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {tab === 'criar' && (
            <div className="field">
              <label htmlFor="admmsg">Mensagem para o admin <span className="opt">(opcional)</span></label>
              <textarea
                id="admmsg"
                className="input"
                rows={3}
                maxLength={500}
                placeholder="Ex.: sou artista e queria a página pro lançamento do meu EP"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="hint">O admin lê isso no painel antes de aprovar sua conta.</p>
            </div>
          )}

          {error && <p className="auth-error"><Icon name="warn" size={14} /> {error}</p>}

          <button className="btn btn-primary btn-wide" disabled={loading}>
            {loading ? 'Um instante…' : tab === 'criar' ? (
              <>Criar minha página <Icon name="sparkle" size={15} /></>
            ) : 'Entrar'}
          </button>
        </form>

        <p className="auth-note">
          Ao criar uma conta você concorda em usar a plataforma de boa.
        </p>
      </div>
    </main>
  );
}
