'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.ok === false) throw new Error(d.error || 'Falha no login.');
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
      <form className="auth-card" onSubmit={submit}>
        <span className="adm-badge">🔒 área restrita</span>
        <h1 className="auth-title">Administração</h1>
        <p className="auth-sub">Digite a senha do administrador para continuar.</p>

        <div className="field">
          <label htmlFor="admpw">Senha</label>
          <input
            id="admpw"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            autoFocus
          />
        </div>

        {error && <p className="auth-error">⚠️ {error}</p>}

        <button className="btn btn-primary btn-wide" disabled={loading}>
          {loading ? 'Verificando…' : 'Entrar no painel'}
        </button>

        <p className="auth-note">Esta página não é indexada por buscadores. <Link href="/">voltar ao site</Link></p>
      </form>
    </main>
  );
}
