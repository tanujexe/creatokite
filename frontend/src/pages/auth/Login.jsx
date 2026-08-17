import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth, getDashboardPath } from '../../contexts/AuthContext';
import { authAPI } from '../../api';
import toast from 'react-hot-toast';
import { KeyRound, Mail, Lock, ArrowLeft, CheckCircle2, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';
import SEO from '../../components/common/SEO';

export default function Login() {

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const message = params.get('message');
    if (error) {
      if (error === 'google_auth_failed') {
        toast.error(`Google Login Failed: ${message || 'Authentication error'}`);
      } else if (error === 'user_not_found') {
        toast.error('Google account could not be mapped to a user.');
      } else {
        toast.error('An error occurred during Google Login.');
      }
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.displayName}!`);
      navigate(from || getDashboardPath(user.role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Please enter your registered email');
    setForgotLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email: forgotEmail });
      toast.success(res.message || 'Reset code sent to your email!');
      if (res.otp) setForgotOtp(res.otp);
      else setForgotOtp('');
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.length !== 6) return toast.error('Enter 6-digit reset code');
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setForgotLoading(true);
    try {
      const res = await authAPI.resetPassword({ email: forgotEmail, otp: forgotOtp, newPassword });
      toast.success('Password reset successfully! You are now logged in.');
      setShowForgot(false);
      if (res.user) setUser(res.user);
      if (res.token) {
        localStorage.setItem('ck_token', res.token);
        if (res.refreshToken) localStorage.setItem('ck_refresh', res.refreshToken);
        navigate(getDashboardPath(res.user?.role || 'creator'), { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      minHeight: '100vh',
      background: '#FAF5EC',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      <SEO
        title="Portal Login | Creatokite UGC Agency & Creator Platform"
        description="Log in to your Creatokite Brand Dashboard, Dealer Network Hub, or Creator Community Portal."
        canonical="/login"
      />

      {/* Warm ambient glow */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(230, 95, 43, 0.06) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 1
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-5%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(227, 107, 57, 0.04) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1
      }} />

      {/* LEFT SIDE PANEL - Desktop Only */}
      <div className="login-left-panel" style={{
        width: '38%',
        position: 'relative',
        background: 'linear-gradient(160deg, #1a1a1f 0%, #111114 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '50px 80px 50px 50px',
        zIndex: 2,
        overflow: 'hidden',
      }}>
        {/* Subtle decorative rings */}
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.02)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 3, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo.jpeg" alt="CreatoKite" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 24, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Creato<span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc, #E65F2B)', marginLeft: 1 }}>Kite</span>
          </span>
        </div>

        {/* Feature Greeting Text */}
        <div style={{ maxWidth: 360, margin: 'auto 0', position: 'relative', zIndex: 3 }}>
          <h2 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(26px, 3.2vw, 38px)',
            fontWeight: 800,
            lineHeight: 1.2,
            color: '#fff',
            letterSpacing: '-1.5px',
            marginBottom: 16,
          }}>
            India's First <span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 500, color: 'rgba(230,95,43,0.9)' }}>Intelligent</span> Campaign Launch OS.
          </h2>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
            Elevate your reach. Match with verified local creators, process payouts securely, and get live analytics instantly.
          </p>
        </div>

        {/* Footer badge */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
          zIndex: 3,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(230,95,43,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
            Shortlisted content delivered automatically to brands.
          </span>
        </div>

        {/* Curved Wave Separator */}
        <div className="hide-mobile" style={{
          position: 'absolute', top: 0, right: -1, bottom: 0, width: 90,
          pointerEvents: 'none', zIndex: 10,
        }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <path d="M100,0 C52,25 72,75 100,100 L100,100 L100,0 Z" fill="#FAF5EC" />
            <path d="M100,0 C52,25 72,75 100,100" fill="none" stroke="rgba(230,95,43,0.15)" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* RIGHT SIDE — FORM */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '30px clamp(16px, 3vw, 40px)',
        zIndex: 2,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative rings */}
        <div className="hide-mobile" style={{ position: 'absolute', bottom: -60, right: -60, width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(74,62,61,0.04)', pointerEvents: 'none', zIndex: 1 }} />
        <div className="hide-mobile" style={{ position: 'absolute', bottom: -90, right: -90, width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(74,62,61,0.02)', pointerEvents: 'none', zIndex: 1 }} />

        {/* Warm ambient sphere */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '360px', height: '360px',
          background: 'radial-gradient(circle, rgba(230, 95, 43, 0.04) 0%, transparent 70%)',
          filter: 'blur(50px)', zIndex: 1, pointerEvents: 'none',
        }} />

        {/* Back link */}
        <div style={{ position: 'absolute', top: 30, right: 'clamp(16px, 3vw, 40px)', zIndex: 5 }}>
          <button onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none',
              color: '#4A3E3D', cursor: 'pointer',
              fontSize: 12.5, fontWeight: 600, padding: '4px 8px',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', opacity: 0.7,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--acc)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = '#4A3E3D'; }}
          >
            ← Return to Home
          </button>
        </div>

        {/* Central Card */}
        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 4 }}>
          {/* Header */}
          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <div className="show-mobile" style={{ alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }} onClick={() => navigate('/')}>
              <img src="/logo.jpeg" alt="CreatoKite" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 22, color: '#1F1C18', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Creato<span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc, #E65F2B)', marginLeft: 1 }}>Kite</span>
              </span>
            </div>
            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(26px, 4vw, 34px)',
              fontWeight: 800,
              color: '#2C2520',
              letterSpacing: '-0.8px',
              marginBottom: 8,
            }}>
              Welcome <span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 500, color: 'var(--acc)' }}>Back</span>
            </h1>
            <p style={{ color: '#4A3E3D', opacity: 0.7, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              Sign in to your campaign dashboard.
            </p>
          </div>

          {/* Form Card */}
          <div style={{
            background: '#FFFDF9',
            border: '1px solid rgba(74, 62, 61, 0.08)',
            borderRadius: 20,
            padding: '28px clamp(20px, 4vw, 30px)',
            boxShadow: '0 12px 40px rgba(74, 62, 61, 0.04)',
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4A3E3D', fontFamily: 'Inter, sans-serif' }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={upd('email')}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: '#FAF6EE', border: '1px solid rgba(74, 62, 61, 0.12)',
                    borderRadius: 10, color: '#2C2520', fontSize: 14,
                    fontFamily: 'Inter, sans-serif', outline: 'none',
                    transition: 'all 0.25s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--acc)';
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(230,95,43,0.1)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(74, 62, 61, 0.12)';
                    e.currentTarget.style.background = '#FAF6EE';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4A3E3D', fontFamily: 'Inter, sans-serif' }}>Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(form.email || '');
                      setForgotStep(1);
                      setShowForgot(true);
                    }}
                    style={{
                      background: 'none', border: 'none', color: 'var(--acc)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      padding: 0
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={upd('password')}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%', padding: '12px 42px 12px 16px',
                      background: '#FAF6EE', border: '1px solid rgba(74, 62, 61, 0.12)',
                      borderRadius: 10, color: '#2C2520', fontSize: 14,
                      fontFamily: 'Inter, sans-serif', outline: 'none',
                      transition: 'all 0.25s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--acc)';
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(230,95,43,0.1)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(74, 62, 61, 0.12)';
                      e.currentTarget.style.background = '#FAF6EE';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#6D6356',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '13px',
                  background: 'var(--acc)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.25s',
                  boxShadow: '0 4px 16px rgba(230,95,43,0.2)',
                  marginTop: 4,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#C2410C';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(230,95,43,0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--acc)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(230,95,43,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', margin: '20px 0',
              color: 'rgba(74,62,61,0.35)', fontSize: '10.5px',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(74,62,61,0.08)' }} />
              <span style={{ padding: '0 12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(74,62,61,0.08)' }} />
            </div>

            {/* Google SSO */}
            <button
              onClick={() => {
                const API = import.meta.env.VITE_API_URL || '/api';
                window.location.href = `${API}/auth/google`;
              }}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px',
                borderRadius: 10,
                border: '1px solid rgba(74,62,61,0.1)',
                background: '#FAF6EE',
                color: '#2C2520',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13.5px',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(74,62,61,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#FAF6EE';
                e.currentTarget.style.borderColor = 'rgba(74,62,61,0.1)';
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: 8 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13.5, color: '#4A3E3D', opacity: 0.6, marginTop: 24, fontFamily: 'Inter, sans-serif' }}>
            No account yet?{' '}
            <Link to="/register" style={{ color: 'var(--acc)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel {
            display: none !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1100px) {
          .login-left-panel {
            width: 34% !important;
          }
        }
        @media (min-width: 1101px) {
          .login-left-panel {
            width: 38% !important;
          }
        }
      `}</style>
      {/* ── FORGOT PASSWORD MODAL ───────────────────────── */}
      {showForgot && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          background: 'rgba(18, 16, 15, 0.75)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            width: '100%', maxWidth: 440, background: 'var(--s1, #FFFDF9)',
            border: '1px solid var(--border, rgba(74,62,61,0.12))', borderRadius: 24,
            padding: 30, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative',
            fontFamily: 'Inter, sans-serif'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowForgot(false)}
              style={{
                position: 'absolute', top: 20, right: 20, background: 'rgba(74,62,61,0.06)',
                border: 'none', borderRadius: 50, width: 32, height: 32, display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t2)'
              }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, background: 'rgba(230,95,43,0.12)',
                color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                  {forgotStep === 1 ? 'Reset Your Password' : 'Enter Reset Code'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, fontWeight: 500 }}>
                  {forgotStep === 1 ? 'Enter your registered email to receive a 6-digit code' : `Code sent to ${forgotEmail}`}
                </p>
              </div>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Registered Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      style={{
                        width: '100%', padding: '12px 14px 12px 40px', background: 'var(--s2, #F0ECE1)',
                        border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, color: 'var(--t1)',
                        outline: 'none', fontFamily: 'Inter, sans-serif'
                      }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    padding: '12px', background: 'var(--acc)', color: '#fff', border: 'none',
                    borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(230,95,43,0.25)', marginTop: 6
                  }}
                >
                  {forgotLoading ? 'Sending Code...' : 'Send Reset Code →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    required
                    style={{
                      width: '100%', padding: '12px 14px', background: 'var(--s2, #F0ECE1)',
                      border: '1px solid var(--border)', borderRadius: 12, fontSize: 20, color: 'var(--t1)',
                      letterSpacing: 6, textAlign: 'center', fontWeight: 800, fontFamily: 'monospace', outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      style={{
                        width: '100%', padding: '12px 14px 12px 40px', background: 'var(--s2, #F0ECE1)',
                        border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, color: 'var(--t1)',
                        outline: 'none', fontFamily: 'Inter, sans-serif'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    style={{
                      padding: '12px 16px', background: 'transparent', color: 'var(--t2)',
                      border: '1px solid var(--border)', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      flex: 1, padding: '12px', background: 'var(--acc)', color: '#fff', border: 'none',
                      borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(230,95,43,0.25)'
                    }}
                  >
                    {forgotLoading ? 'Resetting Password...' : 'Reset Password & Login'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
