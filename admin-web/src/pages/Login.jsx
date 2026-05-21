import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, AlertCircle, QrCode, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } else {
      setError(result.message || 'Invalid credentials.');
    }
  };

  return (
    <div style={s.page}>
      {/* Left Panel */}
      <div style={s.left}>
        <div style={s.card}>
          {/* Logo */}
          <div style={s.logo}>
            <div style={s.logoIcon}><QrCode size={22} color="#fff" /></div>
            <span style={s.logoText}>PetPooja QR</span>
          </div>

          <h1 style={s.heading}>Welcome back 👋</h1>
          <p style={s.sub}>Sign in to your admin panel</p>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form}>
            {/* Email */}
            <div style={s.field}>
              <label style={s.label} htmlFor="login-email">Email / Username</label>
              <div style={s.inputWrap}>
                <Mail size={16} style={s.inputIcon} />
                <input
                  id="login-email"
                  type="text"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={s.input}
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={s.field}>
              <label style={s.label} htmlFor="login-password">Password</label>
              <div style={s.inputWrap}>
                <Lock size={16} style={s.inputIcon} />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...s.input, paddingRight: '40px' }}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? <><Loader2 size={16} className="spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel (desktop only) */}
      <div style={s.right}>
        <div style={s.rightContent}>
          <div style={s.rightIcon}><QrCode size={48} color="rgba(255,255,255,0.9)" /></div>
          <h2 style={s.rightH2}>Restaurant Management,<br/>Simplified.</h2>
          <p style={s.rightP}>
            Manage menus, generate QR codes for every table,<br />
            and track orders in real-time — all from one place.
          </p>
          <div style={s.features}>
            {['QR Code Generation', 'Menu Management', 'Real-time Orders', 'Multi-restaurant'].map(f => (
              <div key={f} style={s.feature}>
                <span style={s.featureDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-right { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg)',
  },
  left: {
    flex: '0 0 100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '38px', height: '38px',
    background: 'var(--primary)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: 700,
    fontSize: '1.1rem',
    color: 'var(--text)',
    letterSpacing: '-0.3px',
  },
  heading: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--text)',
    letterSpacing: '-0.5px',
    marginBottom: '6px',
  },
  sub: {
    fontSize: '0.9rem',
    color: 'var(--text-sub)',
    marginBottom: '24px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: {
    position: 'absolute', left: '12px',
    color: 'var(--text-muted)', pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-dark)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'var(--transition)',
  },
  eyeBtn: {
    position: 'absolute', right: '12px',
    color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center',
    padding: '2px',
  },

  /* Right panel */
  right: {
    display: 'none',
    flex: 1,
    background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
  },
  rightContent: { maxWidth: '380px', color: '#fff' },
  rightIcon: { marginBottom: '24px' },
  rightH2: { fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' },
  rightP: { fontSize: '1rem', opacity: 0.85, lineHeight: 1.7, marginBottom: '28px' },
  features: { display: 'flex', flexDirection: 'column', gap: '10px' },
  feature: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', opacity: 0.9 },
  featureDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)', flexShrink: 0 },
};
