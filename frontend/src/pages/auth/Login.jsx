import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth, getDashboardPath } from '../../contexts/AuthContext';
import { authAPI } from '../../api';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, ShieldCheck, X, Eye, EyeOff, KeyRound } from 'lucide-react';
import SEO from '../../components/common/SEO';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      toast.success(`Welcome back, ${user.displayName || 'Creator'}!`);
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
      setForgotOtp('');
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
    <div className="login-root-container">
      <SEO
        title="Portal Login | CreatoKite UGC Platform"
        description="Log in to your CreatoKite Brand Dashboard, Creator Community Portal, or Admin Hub."
        canonical="/login"
      />

      {/* ── LEFT PANEL (DARK HERO WITH PURE VECTOR ARTWORK) ── */}
      <div className="login-left-panel">
        {/* Ambient Glow Orbs */}
        <div className="login-ambient-orb orb-center" />
        <div className="login-ambient-orb orb-bottom" />

        {/* Vector SVG Artwork (Glowing Kite + Mountain Landscape) */}
        <div className="login-vector-art-container">
          <svg
            className="login-vector-svg"
            viewBox="0 0 600 800"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <filter id="orangeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id="kiteGradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7A3D" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#D94E1F" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="kiteGradientRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFA375" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#E65F2B" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="kiteGradientBottom" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C2410C" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#7C2D12" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="mountainBack" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#2D1B17" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0D0E12" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="mountainFront" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#1B1515" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#08090C" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="lightBeam" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF7A3D" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FF7A3D" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Background Dust / Star Particles */}
            <circle cx="120" cy="140" r="1.5" fill="#FFF" opacity="0.4" />
            <circle cx="340" cy="90" r="2" fill="#FFF" opacity="0.6" />
            <circle cx="480" cy="180" r="1" fill="#FFF" opacity="0.3" />
            <circle cx="210" cy="260" r="1.5" fill="#FFF" opacity="0.5" />
            <circle cx="510" cy="310" r="2" fill="#FFF" opacity="0.4" />
            <circle cx="90" cy="390" r="1" fill="#FFF" opacity="0.3" />

            {/* Orbital Rings */}
            <ellipse cx="320" cy="380" rx="180" ry="60" fill="none" stroke="rgba(255, 122, 61, 0.1)" strokeWidth="1" strokeDasharray="4,6" transform="rotate(-15 320 380)" />
            <ellipse cx="320" cy="380" rx="260" ry="90" fill="none" stroke="rgba(255, 122, 61, 0.05)" strokeWidth="1" transform="rotate(-15 320 380)" />

            {/* Ambient Light Beam from Horizon */}
            <polygon points="100,750 320,380 540,750" fill="url(#lightBeam)" />

            {/* Ambient Horizon Glow Circle */}
            <circle cx="320" cy="480" r="140" fill="rgba(230, 95, 43, 0.12)" filter="url(#softGlow)" />

            {/* ── VECTOR KITE (GLOWING GEOMETRIC 3D KITE) ── */}
            <g className="login-floating-kite" transform="translate(30, 0)">
              {/* Outer Glow Outline */}
              <polygon points="300,260 380,360 300,440 220,360" fill="none" stroke="#FF7A3D" strokeWidth="3" filter="url(#orangeGlow)" opacity="0.8" />

              {/* Kite Facets */}
              <polygon points="300,260 220,360 300,360" fill="url(#kiteGradientLeft)" />
              <polygon points="300,260 380,360 300,360" fill="url(#kiteGradientRight)" />
              <polygon points="300,360 220,360 300,440" fill="url(#kiteGradientBottom)" opacity="0.9" />
              <polygon points="300,360 380,360 300,440" fill="url(#kiteGradientLeft)" opacity="0.85" />

              {/* Inner Structure / Spar Lines */}
              <line x1="300" y1="260" x2="300" y2="440" stroke="#FFD8C7" strokeWidth="2" opacity="0.9" />
              <line x1="220" y1="360" x2="380" y2="360" stroke="#FFD8C7" strokeWidth="2" opacity="0.9" />
              <line x1="300" y1="260" x2="220" y2="360" stroke="#FFF" strokeWidth="1" opacity="0.6" />
              <line x1="300" y1="260" x2="380" y2="360" stroke="#FFF" strokeWidth="1" opacity="0.6" />

              {/* Kite Tail Ribbons */}
              <path d="M300,440 Q280,500 320,560 T270,640" fill="none" stroke="#FF7A3D" strokeWidth="2.5" filter="url(#orangeGlow)" />
              <path d="M300,440 Q330,510 290,570 T340,650" fill="none" stroke="#FFA375" strokeWidth="1.5" opacity="0.8" />

              {/* Floating Sparkle Nodes */}
              <circle cx="300" cy="260" r="3" fill="#FFF" filter="url(#orangeGlow)" />
              <circle cx="220" cy="360" r="2.5" fill="#FFD8C7" />
              <circle cx="380" cy="360" r="2.5" fill="#FFD8C7" />
              <circle cx="300" cy="440" r="3" fill="#FFF" filter="url(#orangeGlow)" />
            </g>

            {/* ── STYLIZED MOUNTAIN RIDGE SILHOUETTES ── */}
            <path d="M-50,620 L60,540 L170,580 L290,490 L400,560 L520,480 L650,570 L700,620 L700,850 L-50,850 Z" fill="url(#mountainBack)" stroke="rgba(255, 122, 61, 0.25)" strokeWidth="1" />
            <path d="M-50,680 L90,590 L210,640 L340,530 L450,610 L580,520 L680,600 L700,680 L700,850 L-50,850 Z" fill="url(#mountainFront)" stroke="rgba(255, 122, 61, 0.4)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Top Brand Logo */}
        <div className="login-brand-header" onClick={() => navigate('/')}>
          <div className="login-logo-icon">
            <img src="/logo.jpeg" alt="CreatoKite" onError={e => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <span className="login-brand-name">
            Creato<span className="login-brand-italic">Kite</span>
          </span>
        </div>

        {/* Main Hero Copy */}
        <div className="login-hero-copy">
          <h1 className="login-hero-heading">
            Let’s launch <br />
            <span className="login-hero-serif">great campaigns</span>
          </h1>

          <p className="login-hero-subtext">
            Sign in to access your dashboard and manage campaigns, creators, and performance — all in one place.
          </p>
        </div>



        {/* Organic Curved SVG Divider */}
        <div className="login-curved-svg-divider">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <path d="M100,0 C50,28 65,72 100,100 L100,100 L100,0 Z" fill="#F6F4EF" />
          </svg>
        </div>
      </div>

      {/* ── RIGHT PANEL (LIGHT CANVAS & FORM CARD) ── */}
      <div className="login-right-panel">
        {/* Top Right Home Navigation */}
        <div className="login-top-nav">
          <button onClick={() => navigate('/')} className="login-return-btn">
            ← Return to Home
          </button>
        </div>

        {/* Center Floating Form Card */}
        <div className="login-card-wrapper">
          {/* Card Header */}
          <div className="login-card-header">
            {/* Mobile Brand Logo (Visible on mobile screens) */}
            <div className="login-mobile-logo" onClick={() => navigate('/')}>
              <img src="/logo.jpeg" alt="CreatoKite" onError={e => { e.currentTarget.style.display = 'none'; }} />
              <span className="login-brand-name">
                Creato<span className="login-brand-italic">Kite</span>
              </span>
            </div>

            <h2 className="login-card-title">
              Sign <span className="login-hero-serif">In</span>
            </h2>
            <div className="reg-card-title-line" />
            <p className="login-card-subtitle">
              Welcome back! Please sign in to continue.
            </p>
          </div>

          {/* White Card Container */}
          <div className="login-white-card">
            <form onSubmit={handleSubmit} className="login-form">
              {/* Email Address */}
              <div className="login-field-group">
                <label className="login-field-label">Email address</label>
                <div className="login-input-wrap">
                  <Mail size={17} className="login-input-icon" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={upd('email')}
                    placeholder="you@example.com"
                    required
                    className="login-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field-group">
                <div className="login-field-header-row">
                  <label className="login-field-label">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(form.email || '');
                      setForgotStep(1);
                      setShowForgot(true);
                    }}
                    className="login-forgot-btn"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="login-input-wrap">
                  <Lock size={17} className="login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={upd('password')}
                    placeholder="••••••••"
                    required
                    className="login-input login-input-pwd"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="login-pwd-toggle"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="login-remember-row">
                <label className="login-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="login-custom-checkbox"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="login-submit-btn"
              >
                <span>{loading ? 'Signing in…' : 'Sign In'}</span>
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            {/* OR Divider */}
            <div className="login-divider">
              <span className="login-divider-line" />
              <span className="login-divider-text">OR</span>
              <span className="login-divider-line" />
            </div>

            {/* Google SSO Button */}
            <button
              onClick={() => {
                const API = import.meta.env.VITE_API_URL || '/api';
                window.location.href = `${API}/auth/google`;
              }}
              className="login-google-btn"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" style={{ shrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Form Footer Link */}
            <p className="login-card-footer-text">
              Don’t have an account?{' '}
              <Link to="/register" className="login-signup-link">
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Social Proof Footer */}
        <div className="login-social-proof-footer">
          <div className="login-avatars-stack">
            <img src="/assets/hero_creator_female.jpg" alt="Creator" className="login-avatar-img" onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'; }} />
            <img src="/assets/hero_creator_male.jpg" alt="Creator" className="login-avatar-img" onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'; }} />
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Creator" className="login-avatar-img" />
          </div>
          <span className="login-social-proof-text">
            Trusted by <strong className="login-highlight-orange">12,000+</strong> brands & creators across India
          </span>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {showForgot && createPortal(
        <div className="login-modal-overlay">
          <div className="login-modal-card">
            <button
              onClick={() => setShowForgot(false)}
              className="login-modal-close-btn"
            >
              <X size={16} />
            </button>

            <div className="login-modal-header">
              <div className="login-modal-icon-wrap">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="login-modal-title">
                  {forgotStep === 1 ? 'Reset Your Password' : 'Enter Reset Code'}
                </h3>
                <p className="login-modal-subtitle">
                  {forgotStep === 1 ? 'Enter your registered email to receive a 6-digit code' : `Code sent to ${forgotEmail}`}
                </p>
              </div>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetCode} className="login-modal-form">
                <div className="login-field-group">
                  <label className="login-field-label">Registered Email</label>
                  <div className="login-input-wrap">
                    <Mail size={16} className="login-input-icon" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="login-input"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="login-submit-btn"
                  style={{ marginTop: '8px' }}
                >
                  <span>{forgotLoading ? 'Sending Code...' : 'Send Reset Code →'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="login-modal-form">
                <div className="login-field-group">
                  <label className="login-field-label">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    required
                    className="login-otp-input"
                  />
                </div>

                <div className="login-field-group">
                  <label className="login-field-label">New Password</label>
                  <div className="login-input-wrap">
                    <Lock size={16} className="login-input-icon" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="login-input"
                    />
                  </div>
                </div>

                <div className="login-modal-actions">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="login-modal-back-btn"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="login-submit-btn"
                    style={{ flex: 1 }}
                  >
                    <span>{forgotLoading ? 'Resetting...' : 'Reset Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── STYLES (PURE FULLSCREEN 100VH - NO SCROLL) ── */}
      <style>{`
        .login-root-container {
          height: 100vh;
          max-height: 100vh;
          width: 100vw;
          background: #F6F4EF;
          display: flex;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #1F1C18;
        }

        /* ── LEFT PANEL ── */
        .login-left-panel {
          width: 44%;
          min-width: 420px;
          height: 100vh;
          max-height: 100vh;
          position: relative;
          background-color: #0C0D11;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 36px 48px 36px 44px;
          z-index: 2;
          overflow: hidden;
          box-sizing: border-box;
        }

        .login-ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 1;
        }

        .orb-center {
          top: 30%;
          left: 20%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(230, 95, 43, 0.22) 0%, transparent 70%);
        }

        .orb-bottom {
          bottom: 10%;
          left: 10%;
          width: 360px;
          height: 360px;
          background: radial-gradient(circle, rgba(217, 78, 31, 0.15) 0%, transparent 70%);
        }

        .login-vector-art-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          overflow: hidden;
        }

        .login-vector-svg {
          width: 100%;
          height: 100%;
        }

        .login-floating-kite {
          animation: floatKite 6s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes floatKite {
          0%, 100% {
            transform: translate(30px, 0px) rotate(0deg);
          }
          50% {
            transform: translate(35px, -14px) rotate(2deg);
          }
        }

        .login-brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 5;
          cursor: pointer;
          width: fit-content;
        }

        .login-logo-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          overflow: hidden;
          background: #E65F2B;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(230, 95, 43, 0.35);
        }

        .login-logo-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .login-brand-name {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: 22px;
          color: #FFFFFF;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .login-brand-italic {
          font-family: 'EB Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 600;
          color: #E65F2B;
          margin-left: 2px;
        }

        .login-hero-copy {
          max-width: 380px;
          margin: auto 0;
          position: relative;
          z-index: 5;
          padding: 10px 0;
        }

        .login-hero-heading {
          font-family: 'Inter', sans-serif;
          font-size: clamp(28px, 3.1vw, 40px);
          font-weight: 800;
          line-height: 1.15;
          color: #FFFFFF;
          letter-spacing: -1.2px;
          margin: 0 0 12px 0;
        }

        .login-hero-serif {
          font-family: 'EB Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          color: #E65F2B;
          font-size: 1.1em;
        }

        .login-hero-subtext {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.68);
          line-height: 1.6;
          margin: 0;
          font-weight: 400;
        }

        .login-left-footer {
          position: relative;
          z-index: 5;
        }

        .login-security-card {
          background: rgba(18, 19, 24, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .login-security-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: rgba(230, 95, 43, 0.15);
          border: 1px solid rgba(230, 95, 43, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E65F2B;
          shrink: 0;
        }

        .login-security-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 2px;
        }

        .login-security-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.55);
        }

        .login-carousel-dashes {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
        }

        .login-carousel-dashes .dash {
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.3s;
          width: 14px;
        }

        .login-carousel-dashes .dash.active {
          width: 28px;
          background: #E65F2B;
        }

        .login-curved-svg-divider {
          position: absolute;
          top: 0;
          right: -1px;
          bottom: 0;
          width: 70px;
          pointer-events: none;
          z-index: 10;
        }

        /* ── RIGHT PANEL ── */
        .login-right-panel {
          flex: 1;
          height: 100vh;
          max-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 24px 36px 20px 36px;
          z-index: 2;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
        }

        .login-top-nav {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .login-return-btn {
          background: transparent;
          border: none;
          color: #555047;
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 600;
          font-family: inherit;
          padding: 4px 10px;
          border-radius: 8px;
          transition: all 0.2s;
          opacity: 0.85;
        }

        .login-return-btn:hover {
          opacity: 1;
          color: #E65F2B;
          background: rgba(230, 95, 43, 0.05);
        }

        .login-card-wrapper {
          width: 100%;
          max-width: 420px;
          margin: auto 0;
        }

        .login-card-header {
          text-align: left;
          margin-bottom: 14px;
        }

        .login-mobile-logo {
          display: none;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          cursor: pointer;
        }

        .login-mobile-logo img {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          object-fit: cover;
        }

        .login-mobile-logo .login-brand-name {
          color: #1F1C18;
          font-size: 21px;
        }

        .login-card-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(28px, 2.8vw, 34px);
          font-weight: 800;
          color: #1F1C18;
          letter-spacing: -0.8px;
          margin: 0 0 2px 0;
        }

        .reg-card-title-line {
          width: 28px;
          height: 3px;
          border-radius: 2px;
          background: #E65F2B;
          margin: 6px 0 8px 0;
        }

        .login-card-subtitle {
          color: #6E6B65;
          font-size: 13.5px;
          margin: 0;
          font-weight: 400;
        }

        .login-white-card {
          background: #FFFFFF;
          border: 1px solid #ECE7DE;
          border-radius: 22px;
          padding: 24px 28px 20px 28px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.03), 0 2px 5px rgba(0, 0, 0, 0.015);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .login-field-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .login-field-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #38342E;
        }

        .login-field-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .login-forgot-btn {
          background: none;
          border: none;
          color: #E65F2B;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
          transition: opacity 0.2s;
        }

        .login-forgot-btn:hover {
          opacity: 0.85;
          text-decoration: underline;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #9C968B;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          background: #F8F7F3;
          border: 1px solid #E6E1D7;
          border-radius: 11px;
          color: #1F1C18;
          font-size: 13.5px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-input-pwd {
          padding-right: 40px;
        }

        .login-input:focus {
          border-color: #E65F2B;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(230, 95, 43, 0.12);
        }

        .login-pwd-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9C968B;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.2s;
        }

        .login-pwd-toggle:hover {
          color: #1F1C18;
        }

        .login-remember-row {
          display: flex;
          align-items: center;
          margin-top: -2px;
        }

        .login-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #555047;
          cursor: pointer;
          user-select: none;
        }

        .login-custom-checkbox {
          width: 15px;
          height: 15px;
          accent-color: #E65F2B;
          border-radius: 4px;
          cursor: pointer;
        }

        .login-submit-btn {
          width: 100%;
          padding: 12.5px;
          background: linear-gradient(135deg, #E65F2B 0%, #D94E1F 100%);
          border: none;
          border-radius: 11px;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 5px 16px rgba(230, 95, 43, 0.25);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 2px;
        }

        .login-submit-btn:hover {
          background: linear-gradient(135deg, #F06A37 0%, #E25425 100%);
          box-shadow: 0 7px 22px rgba(230, 95, 43, 0.35);
          transform: translateY(-1px);
        }

        .login-submit-btn:active {
          transform: translateY(0);
        }

        .login-divider {
          display: flex;
          align-items: center;
          margin: 14px 0;
        }

        .login-divider-line {
          flex: 1;
          height: 1px;
          background: #ECE7DE;
        }

        .login-divider-text {
          padding: 0 12px;
          font-size: 10.5px;
          font-weight: 700;
          color: #A09A8E;
          letter-spacing: 0.1em;
        }

        .login-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 11px;
          border-radius: 11px;
          border: 1px solid #E2DDD3;
          background: #FFFFFF;
          color: #2C2823;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .login-google-btn:hover {
          background: #FDFBF7;
          border-color: #D6CFBF;
        }

        .login-card-footer-text {
          text-align: center;
          font-size: 13px;
          color: #6E6B65;
          margin: 16px 0 0 0;
        }

        .login-signup-link {
          color: #E65F2B;
          font-weight: 700;
          text-decoration: none;
        }

        .login-signup-link:hover {
          text-decoration: underline;
        }

        .login-social-proof-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 0;
          padding-top: 10px;
        }

        .login-avatars-stack {
          display: flex;
          align-items: center;
        }

        .login-avatar-img {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #F6F4EF;
          object-fit: cover;
          margin-left: -9px;
          background: #EAE6DC;
        }

        .login-avatar-img:first-child {
          margin-left: 0;
        }

        .login-social-proof-text {
          font-size: 12px;
          color: #6E6B65;
          font-weight: 500;
        }

        .login-highlight-orange {
          color: #E65F2B;
          font-weight: 700;
        }

        /* ── MODAL STYLES ── */
        .login-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(15, 14, 12, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-modal-card {
          width: 100%;
          max-width: 420px;
          background: #FFFFFF;
          border: 1px solid #ECE7DE;
          border-radius: 22px;
          padding: 28px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.25);
          position: relative;
        }

        .login-modal-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: #F4F1E9;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6E6B65;
          transition: all 0.2s;
        }

        .login-modal-close-btn:hover {
          background: #E8E4D9;
          color: #1F1C18;
        }

        .login-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .login-modal-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(230, 95, 43, 0.12);
          color: #E65F2B;
          display: flex;
          align-items: center;
          justify-content: center;
          shrink: 0;
        }

        .login-modal-title {
          font-size: 17px;
          font-weight: 800;
          color: #1F1C18;
          margin: 0;
        }

        .login-modal-subtitle {
          font-size: 12px;
          color: #6E6B65;
          margin: 2px 0 0 0;
        }

        .login-modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-otp-input {
          width: 100%;
          padding: 11px 12px;
          background: #F8F7F3;
          border: 1px solid #E6E1D7;
          border-radius: 11px;
          font-size: 20px;
          color: #1F1C18;
          letter-spacing: 8px;
          text-align: center;
          font-weight: 800;
          font-family: monospace;
          outline: none;
        }

        .login-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .login-modal-back-btn {
          padding: 11px 16px;
          background: transparent;
          color: #6E6B65;
          border: 1px solid #E2DDD3;
          border-radius: 11px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }

        /* ── RESPONSIVE BREAKPOINTS ── */
        @media (max-width: 900px) {
          .login-root-container {
            height: auto;
            min-height: 100vh;
            max-height: none;
            overflow-y: auto;
          }
          .login-left-panel {
            display: none !important;
          }
          .login-right-panel {
            height: auto;
            min-height: 100vh;
            max-height: none;
            overflow-y: auto;
            padding: 24px 20px;
            justify-content: center;
          }
          .login-top-nav {
            position: absolute;
            top: 20px;
            right: 20px;
            width: auto;
          }
          .login-mobile-logo {
            display: flex;
          }
          .login-white-card {
            padding: 24px 20px 20px 20px;
            border-radius: 20px;
          }
          .login-card-wrapper {
            margin: 40px auto 20px auto;
          }
          .login-social-proof-footer {
            margin-top: 20px;
            padding-top: 0;
          }
        }
      `}</style>
    </div>
  );
}
