import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      addToast(`Welcome to Momentum! 🚀`, 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ink)' }}>
      {/* LEFT PANEL */}
      <div style={{
        flex: 1, background: 'linear-gradient(145deg, var(--ink-2) 0%, var(--ink) 100%)',
        borderRight: '1px solid var(--ink-4)', padding: '60px 48px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden'
      }} className="auth-panel-left">
        {/* BG orbs */}
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, var(--violet) 0%, transparent 70%)', opacity: 0.1, top: '-100px', left: '-100px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, var(--cyan) 0%, transparent 70%)', opacity: 0.08, bottom: '-80px', right: '-80px', pointerEvents: 'none' }} />

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', position: 'relative', zIndex: 2 }}>
          <div className="logo-mark" style={{ width: 38, height: 38, background: 'linear-gradient(135deg, var(--violet), var(--cyan))', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: 'white' }}>M</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--white)' }}>Momentum</span>
        </Link>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 20 }}>
            Your team's work,<br />
            <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)', background: 'linear-gradient(135deg, var(--violet-light), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>all in one place.</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Kanban boards, real-time collaboration, workspaces, and task management built for modern teams.
          </p>
          {[
            '🔐 Secure JWT authentication',
            '🏢 Role-based workspaces',
            '⚡ Real-time with Socket.IO',
            '🖱️ Drag-and-drop Kanban boards',
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: 'var(--ghost)', fontSize: 14, fontWeight: 500 }}>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink-5)', position: 'relative', zIndex: 2 }}>© 2025 Momentum</p>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: '480px', minWidth: '480px', padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ animation: 'slideUp 0.4s var(--ease)' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 32 }}>
            {mode === 'login' ? "Sign in to your workspace" : "Start managing projects in minutes"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Yogesh Pande"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 8, padding: '13px', fontSize: 15, justifyContent: 'center' }}>
              {loading ? <><span className="spinner" /> Processing...</> : mode === 'login' ? 'Sign in to Momentum' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--muted)' }}>
            {mode === 'login' ? (
              <span>Don't have an account? <button onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: 'var(--violet-light)', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Sign up free →</button></span>
            ) : (
              <span>Already have an account? <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--violet-light)', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Sign in</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
