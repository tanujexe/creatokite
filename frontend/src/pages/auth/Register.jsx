import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../../contexts/AuthContext';
import { Btn } from '../../components/ui';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';
import {
  Zap, CheckCircle, ArrowRight, ArrowLeft, X,
  User, Mail, Lock, Link2, Globe, Shield, Award,
  Eye, EyeOff
} from 'lucide-react';


const NICHES = ['Tech', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Travel', 'Gaming', 'Education', 'Finance', 'Lifestyle', 'Music', 'Art', 'Other'];

const STEPS = [
  { icon: '🔍', label: 'Fetching your social profile...' },
  { icon: '📊', label: 'Analyzing engagement metrics...' },
  { icon: '👥', label: 'Checking audience authenticity...' },
  { icon: '📈', label: 'Calculating reach & growth...' },
  { icon: '🛡️', label: 'Running brand safety check...' },
  { icon: '🤖', label: 'Computing Creator Score...' },
];

const SCORE_COLORS = {
  ELITE: '#fbbf24',
  VERIFIED: 'var(--acc2)',
  STANDARD: 'var(--p2)',
  REVIEW: 'var(--gold)',
};

/* ─────────────────────────────────────────────────────────────
   TermsModal — shows Creator or Brand T&C based on role prop
 ───────────────────────────────────────────────────────────── */
function TermsModal({ role, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'rgba(17, 22, 34, 0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        width: '100%', maxWidth: 560,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--fh)', fontWeight: 800, fontSize: 17, margin: 0, color: 'var(--t1)' }}>
              {role === 'brand' ? '🏢 Brand Terms & Conditions' : '✨ Creator Terms & Conditions'}
            </h2>
            <p style={{ fontSize: 11.5, color: 'rgba(136,146,164,0.65)', margin: '4px 0 0' }}>
              Please read carefully before registering on CreatoKite
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--t2)', padding: 6, borderRadius: 8,
            display: 'flex', alignItems: 'center', transition: 'all 0.2s',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ overflowY: 'auto', padding: '22px 24px', flex: 1, fontSize: 13, color: 'rgba(136,146,164,0.8)', lineHeight: 1.75 }}>
          <p style={{ color: 'rgba(255,107,87,0.85)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 18 }}>
            Effective immediately upon registration · CreatoKite Technologies
          </p>

          {/* ══ CREATOR T&C ══ */}
          {role === 'creator' && (<>

            <TC title="1. Platform Role">
              CreatoKite acts as a campaign coordination and creator participation platform connecting
              brands and creators for collaborative influencer campaigns. CreatoKite does not guarantee
              campaign allocation, fixed earnings, brand selection, or creator visibility in every campaign.
              Participation remains opportunity-based.
            </TC>

            <TC title="2. Creator Participation Model">
              <ul style={{ paddingLeft: 18, margin: '6px 0', lineHeight: 2 }}>
                <li>Creators shall not be permanently assigned or exclusively mapped to any individual brand.</li>
                <li>Campaign opportunities are released on creator dashboards based on platform campaigns.</li>
                <li>Creators may voluntarily accept or reject campaigns.</li>
                <li>Acceptance does not guarantee final content selection or publishing rights.</li>
              </ul>
            </TC>

            <TC title="3. Campaign Acceptance">
              Each campaign on your dashboard will contain: campaign duration, submission deadline,
              content requirements, platform rules, compensation model, and deliverables.
              Failure to respond within the campaign window may result in automatic expiration.
            </TC>

            <TC title="4. Content Submission & Audit Rights">
              Upon campaign acceptance you may submit content assets. CreatoKite reserves the right
              to review, audit, reject, edit, shortlist and optimise content.
              Submission does not guarantee selection.
            </TC>

            <TC title="5. Internal Selection Mechanism">
              CreatoKite may internally shortlist top-performing creatives (e.g. Top 5 videos) for
              brand review. Selection criteria may include quality, hook rate, creativity, compliance,
              engagement potential and brand fit. Selection decisions are final.
            </TC>

            <TC title="6. Content Distribution Rights">
              Creators acknowledge that selected campaign creatives may be distributed across
              participating creators for campaign execution. No creator shall claim exclusive
              ownership over campaign execution rights after approval.
            </TC>

            <TC title="7. Creator Identity Confidentiality">
              CreatoKite may withhold your identity from brands during internal content selection.
              Brands may receive campaign results without disclosure of selected creator identities.
            </TC>

            <TC title="8. Earnings Policy">
              Campaign earnings depend on participation, deliverable completion, compliance and
              campaign rules. CreatoKite does not guarantee fixed income.
            </TC>

            <TC title="9. Prohibited Actions">
              <ul style={{ paddingLeft: 18, margin: '6px 0', lineHeight: 2 }}>
                <li>Do not leak campaign information or contact brands directly.</li>
                <li>Do not reveal internal workflows or manipulate analytics.</li>
                <li>Do not submit copied content, use bots, or re-upload restricted assets.</li>
              </ul>
            </TC>

            <TC title="10. Intellectual Property">
              Original content ownership remains with the creator unless campaign licensing applies.
              Creators grant CreatoKite limited campaign usage rights upon submission.
            </TC>

          </>)}

          {/* ══ BRAND T&C ══ */}
          {role === 'brand' && (<>

            <TC title="1. Campaign Package Model">
              Brands purchase creator participation packages (e.g. 20 / 40 / 50 creators).
              Package selection determines your campaign pool size.
            </TC>

            <TC title="2. Participation-Based Delivery">
              Campaigns operate through participation pools and not fixed creator assignments.
              Creator availability may vary per campaign cycle.
            </TC>

            <TC title="3. Content Selection Model">
              Multiple creators may submit content. CreatoKite audits and shortlists creatives
              before presentation to the brand. You will receive only reviewed, shortlisted content.
            </TC>

            <TC title="4. Confidential Workflow">
              Creator identities may remain confidential during campaign processing.
              CreatoKite does not disclose creator personal information without consent.
            </TC>

            <TC title="5. Performance Disclaimer">
              CreatoKite provides no guarantee of sales, ROI, reach, virality or engagement outcomes.
              Campaign performance depends on multiple external factors.
            </TC>

            <TC title="6. Approval Rights">
              Brands may approve or reject shortlisted creatives presented for their campaign.
              Approved assets may be distributed within the campaign creator network.
            </TC>

            <TC title="7. Payment Terms">
              Campaigns will only go live after full payment confirmation.
              Refunds are subject to CreatoKite's refund policy.
            </TC>

            <TC title="8. Content Usage">
              Approved creative assets may be distributed within the campaign creator network
              solely for campaign execution purposes.
            </TC>

          </>)}

          <p style={{
            marginTop: 20, padding: '12px 14px',
            background: 'rgba(255,107,87,0.06)',
            border: '1px solid rgba(255,107,87,0.15)',
            borderRadius: 10, fontSize: 12, color: 'rgba(255,107,87,0.95)',
          }}>
            📩 Questions? Contact us at <strong>support@creatokite.com</strong>
          </p>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          flexShrink: 0, display: 'flex', justifyContent: 'flex-end',
        }}>
          <Btn variant="primary" onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
            <CheckCircle size={14} /> I've Read the Terms
          </Btn>
        </div>

      </div>
    </div>
  );
}

/* Small helper to render each T&C section */
function TC({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 5 }}>
        {title}
      </h3>
      <div style={{ color: 'rgba(136,146,164,0.75)', fontSize: 13 }}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ScoreMini — circular CAS score display on success screen
 ───────────────────────────────────────────────────────────── */
function ScoreMini({ score, badge }) {
  const color = score >= 75 ? 'var(--acc2)' : score >= 50 ? 'var(--gold)' : 'var(--rose)';
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
        <svg width={72} height={72} viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 1.4s ease' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: 17, fontWeight: 900, fontFamily: 'var(--fh)', color }}>{score}</span>
          <span style={{ fontSize: 7, color: 'rgba(136,146,164,0.5)', fontWeight: 700, letterSpacing: 0.5 }}>CAS</span>
        </div>
      </div>
      <div>
        <span style={{
          display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 800,
          marginBottom: 5, color: SCORE_COLORS[badge] || 'var(--t2)',
          background: `${SCORE_COLORS[badge] || 'gray'}15`, border: `1px solid ${SCORE_COLORS[badge] || 'gray'}30`
        }}>
          {badge === 'ELITE' ? '⭐ ELITE' : badge === 'VERIFIED' ? '✔ VERIFIED' : badge === 'STANDARD' ? '✦ STANDARD' : '⚠ REVIEW'}
        </span>
        <p style={{ fontSize: 11.5, color: 'rgba(136,146,164,0.7)', lineHeight: 1.5, margin: 0 }}>
          {score >= 75
            ? "🎉 Auto-approved! You're ready to get assigned to campaigns."
            : "⏳ Pending admin review — usually within 24h. You'll get a notification."}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NicheMultiSelect — Search, Pick Multiple, & Write Custom Niche
 ───────────────────────────────────────────────────────────── */
function NicheMultiSelect({ selectedNiches = [], onChange }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const ALL_PRESETS = [
    'Tech', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Travel', 'Gaming',
    'Education', 'Finance', 'Lifestyle', 'Music', 'Art', 'Automotive',
    'AI & Software', 'Crypto & Web3', 'Parenting & Family', 'Health & Wellness',
    'Business & Entrepreneurship', 'Photography & Video', 'Comedy & Entertainment'
  ];

  const filteredPresets = ALL_PRESETS.filter(n =>
    n.toLowerCase().includes(query.toLowerCase()) && !selectedNiches.includes(n)
  );

  const isExactMatch = ALL_PRESETS.some(n => n.toLowerCase() === query.trim().toLowerCase()) ||
    selectedNiches.some(n => n.toLowerCase() === query.trim().toLowerCase());

  const addNiche = (nicheToAdd) => {
    const trimmed = nicheToAdd.trim();
    if (!trimmed) return;
    if (!selectedNiches.includes(trimmed)) {
      onChange([...selectedNiches, trimmed]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const removeNiche = (nicheToRemove) => {
    onChange(selectedNiches.filter(n => n !== nicheToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        addNiche(query.trim());
      }
    }
  };

  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }} ref={dropdownRef}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,237,230,0.85)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Creator Niche(s) *</span>
        <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 500 }}>Select multiple or write custom</span>
      </label>

      {/* Selected Tag Pills */}
      {selectedNiches.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
          {selectedNiches.map(n => (
            <span
              key={n}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 99,
                background: 'rgba(230, 95, 43, 0.15)', color: 'var(--acc)',
                border: '1px solid rgba(230, 95, 43, 0.35)',
                fontSize: 12, fontWeight: 700,
              }}
            >
              {n}
              <button
                type="button"
                onClick={() => removeNiche(n)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--acc)', padding: 0, display: 'flex', alignItems: 'center',
                  fontSize: 14, lineHeight: 1, fontWeight: 800
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input container */}
      <div style={{ position: 'relative' }}>
        <Globe size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.45)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedNiches.length === 0 ? "Search or type your niche..." : "Add another niche..."}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            background: 'rgba(255, 255, 255, 0.01)',
            border: isOpen ? '1px solid rgba(255,107,87,0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            color: '#fff',
            fontSize: 13.5,
            outline: 'none',
            transition: 'all 0.25s',
          }}
        />
        {query.trim() && (
          <button
            type="button"
            onClick={() => addNiche(query)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 8,
              padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Add
          </button>
        )}
      </div>

      {/* Dropdown popup */}
      {isOpen && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
            background: '#121622', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)', maxHeight: 220, overflowY: 'auto',
            zIndex: 100, padding: 6, display: 'flex', flexDirection: 'column', gap: 2
          }}
        >
          {query.trim() && !isExactMatch && (
            <button
              type="button"
              onClick={() => addNiche(query)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8,
                background: 'rgba(230,95,43,0.15)', border: '1px dashed var(--acc)',
                color: 'var(--acc)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4
              }}
            >
              <span>➕ Add custom niche:</span> <strong>"{query.trim()}"</strong>
            </button>
          )}

          {filteredPresets.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => addNiche(preset)}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8,
                background: 'transparent', border: 'none', color: '#FFFFFF',
                fontSize: 13, cursor: 'pointer', transition: 'background 0.12s',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(230, 95, 43, 0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>{preset}</span>
              <span style={{ fontSize: 11, color: 'var(--acc)', fontWeight: 700 }}>+ Add</span>
            </button>
          ))}

          {filteredPresets.length === 0 && !query.trim() && (
            <div style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              All preset niches selected! Type to write a custom niche.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Register component
 ───────────────────────────────────────────────────────────── */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState([]);

  const handleNichesChange = (newNiches) => {
    setSelectedNiches(newNiches);
    setForm(p => ({
      ...p,
      niche: newNiches[0] || '',
      subNiches: newNiches,
    }));
  };

  const [form, setForm] = useState({
    displayName: '', email: '', password: '', role: params.get('role') || 'creator',
    niche: '', subNiches: [], companyName: '', handle: '',
    instagramUrl: '', youtubeUrl: '',
  });
  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  /* ── Step 1 submit ── */
  const handleStep1 = async e => {
    e.preventDefault();
    if (!form.displayName || !form.email || !form.password) return toast.error('Fill all required fields');
    if (form.password.length < 6) return toast.error('Password min 6 characters');
    if (!termsAccepted) return toast.error('Please accept the Terms & Conditions to continue');
    if (form.role === 'creator' && selectedNiches.length === 0) return toast.error('Please select or write at least one niche');
    if (form.role === 'brand') { await doRegister({}); }
    else setStep(2);
  };

  /* ── Step 2 submit ── */
  const handleStep2 = async e => {
    e.preventDefault();
    if (!form.instagramUrl && !form.youtubeUrl) {
      toast.error('Enter at least one social URL, or click "Skip".');
      return;
    }
    await doRegisterWithAnimation();
  };

  /* ── Register without social analysis ── */
  async function doRegister(extras = {}) {
    setLoading(true);
    try {
      const { user } = await register({ ...form, termsAccepted: true, ...extras });
      toast.success(`Welcome to Creatokite, ${user.displayName}! 🚀`);
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Registration failed';
      toast.error(errMsg);
    } finally { setLoading(false); }
  }

  /* ── Register WITH social analysis + animation ── */
  async function doRegisterWithAnimation() {
    setStep(3);
    setStepIdx(0);
    const interval = setInterval(() => {
      setStepIdx(p => p < STEPS.length - 1 ? p + 1 : p);
    }, 950);
    try {
      const data = await register({ ...form, termsAccepted: true });
      clearInterval(interval);
      await new Promise(r => setTimeout(r, 500));
      setResult(data);
      setStep(4);
    } catch (err) {
      clearInterval(interval);
      setStep(2);
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Registration failed. Please try again.';
      toast.error(errMsg);
    }
  }

  const leftPanel = (
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
      {/* Concentric rings bottom-left */}
      <div style={{
        position: 'absolute', bottom: -50, left: -50, width: 220, height: 220,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)',
        pointerEvents: 'none', zIndex: 1
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -80, width: 280, height: 280,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)',
        pointerEvents: 'none', zIndex: 1
      }} />
      <div style={{
        position: 'absolute', bottom: -110, left: -110, width: 340, height: 340,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.015)',
        pointerEvents: 'none', zIndex: 1
      }} />

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
          fontFamily: 'var(--fh)',
          fontSize: 'clamp(26px, 3.2vw, 36px)',
          fontWeight: 800,
          lineHeight: 1.25,
          color: '#fff',
          letterSpacing: '-1.5px',
          marginBottom: 20,
        }}>
          Scale your brand. Empower your creativity.
        </h2>
        <p style={{ fontSize: 14.5, color: 'rgba(240, 237, 230, 0.75)', lineHeight: 1.7, fontFamily: 'var(--fb)' }}>
          India's first campaign execution platform connecting high-growth company teams with verified, audited creator talent.
        </p>
      </div>

      {/* Footer badge */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 12,
        padding: '12px 18px',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
        zIndex: 3,
      }}>
        <Award size={16} style={{ color: 'var(--p)' }} />
        <span style={{ fontSize: 12.5, color: 'rgba(240, 237, 230, 0.7)', fontFamily: 'var(--fb)' }}>
          Audited metrics & verified creator scores standard on every campaign.
        </span>
      </div>

      {/* Curved Wave Separator */}
      <div className="hide-mobile" style={{
        position: 'absolute',
        top: 0,
        right: -1,
        bottom: 0,
        width: 100,
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          {/* Dark background matching the right panel background */}
          <path d="M100,0 C52,25 72,75 100,100 L100,100 L100,0 Z" fill="#FAF5EC" />
          {/* Outer curve stroke (glowing coral) */}
          <path d="M100,0 C52,25 72,75 100,100" fill="none" stroke="rgba(230,95,43,0.25)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );

  const rightPanelContainerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '30px clamp(16px, 3vw, 40px)',
    zIndex: 2,
    position: 'relative',
    overflow: 'hidden',
  };

  const backButton = (
    <div style={{ position: 'absolute', top: 30, right: 'clamp(16px, 3vw, 40px)', zIndex: 5 }}>
      <button onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none',
          border: 'none',
          color: 'rgba(26, 54, 93, 0.7)', cursor: 'pointer',
          fontSize: 12.5, fontWeight: 600,
          padding: '4px 8px',
          fontFamily: 'var(--fb)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--acc)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'rgba(26, 54, 93, 0.7)';
        }}
      >
        ← Return to Home
      </button>
    </div>
  );

  const cardStyle = {
    background: '#FFFFFF',
    border: '1px solid var(--border2)',
    borderRadius: 24,
    padding: '30px clamp(20px, 4vw, 32px)',
    backdropFilter: 'blur(30px)',
    boxShadow: '0 20px 50px rgba(26, 54, 93, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
    width: '100%',
    maxWidth: 440,
    position: 'relative',
    zIndex: 4,
  };

  const rightRings = (
    <>
      {/* Concentric rings bottom-right */}
      <div className="hide-mobile" style={{
        position: 'absolute', bottom: -60, right: -60, width: 220, height: 220,
        borderRadius: '50%', border: '1px solid rgba(26, 54, 93, 0.03)',
        pointerEvents: 'none', zIndex: 1
      }} />
      <div className="hide-mobile" style={{
        position: 'absolute', bottom: -90, right: -90, width: 280, height: 280,
        borderRadius: '50%', border: '1px solid rgba(26, 54, 93, 0.015)',
        pointerEvents: 'none', zIndex: 1
      }} />
      <div className="hide-mobile" style={{
        position: 'absolute', bottom: -120, right: -120, width: 340, height: 340,
        borderRadius: '50%', border: '1px solid rgba(26, 54, 93, 0.007)',
        pointerEvents: 'none', zIndex: 1
      }} />
      {/* Glassy light sphere behind card */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '360px',
        height: '360px',
        background: 'radial-gradient(circle, rgba(230, 95, 43, 0.055) 0%, transparent 70%)',
        filter: 'blur(50px)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />
    </>
  );

  /* ── STEP 1: Basic Info ─────────────────────────────────────── */
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
        title="Join Creatokite | UGC Agency & Creator Community Signup"
        description="Register as a Brand, Dealer Network, or UGC Creator on Creatokite to launch or join high-converting video campaigns."
        canonical="/signup"
      />
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(255, 107, 87, 0.05) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 1
      }} />

      {showTerms && <TermsModal role={form.role} onClose={() => setShowTerms(false)} />}

      {/* LEFT SIDE FEATURE PANEL */}
      {leftPanel}

      {/* RIGHT SIDE STEPS PANEL */}
      {step === 1 && (
        <div style={rightPanelContainerStyle}>
          {rightRings}
          {backButton}

          <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 4 }}>
            {/* Header */}
            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              <div className="show-mobile" style={{ alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }} onClick={() => navigate('/')}>
                <img src="/logo.jpeg" alt="CreatoKite" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 22, color: '#1F1C18', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Creato<span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc, #E65F2B)', marginLeft: 1 }}>Kite</span>
                </span>
              </div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#1F1C18', letterSpacing: '-0.8px', marginBottom: 6 }}>
                Create <span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 500, color: 'var(--acc)' }}>Account</span>
              </h1>
              <p style={{ color: '#3E372E', opacity: 0.85, fontSize: 13.5, fontFamily: 'Inter, sans-serif' }}>
                Join India's AI-Powered Creator Campaign OS
              </p>
            </div>

            <div style={cardStyle}>

              {/* Form fields */}
              <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Full Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3E372E' }}>Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6D6356' }} />
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={upd('displayName')}
                      placeholder="Username"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        background: '#FAF5EC',
                        border: '1px solid rgba(35, 30, 25, 0.16)',
                        borderRadius: 12,
                        color: '#1F1C18',
                        fontSize: 13.5,
                        outline: 'none',
                        transition: 'all 0.25s',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--acc)';
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(230, 95, 43, 0.12)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(35, 30, 25, 0.16)';
                        e.currentTarget.style.background = '#FAF5EC';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3E372E' }}>Email *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6D6356' }} />
                    <input
                      type="email"
                      value={form.email}
                      onChange={upd('email')}
                      placeholder="user@gmail.com"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        background: '#FAF5EC',
                        border: '1px solid rgba(35, 30, 25, 0.16)',
                        borderRadius: 12,
                        color: '#1F1C18',
                        fontSize: 13.5,
                        outline: 'none',
                        transition: 'all 0.25s',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--acc)';
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(230, 95, 43, 0.12)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(35, 30, 25, 0.16)';
                        e.currentTarget.style.background = '#FAF5EC';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3E372E' }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6D6356' }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={upd('password')}
                      placeholder="Min 6 characters"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 42px',
                        background: '#FAF5EC',
                        border: '1px solid rgba(35, 30, 25, 0.16)',
                        borderRadius: 12,
                        color: '#1F1C18',
                        fontSize: 13.5,
                        outline: 'none',
                        transition: 'all 0.25s',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--acc)';
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(230, 95, 43, 0.12)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(35, 30, 25, 0.16)';
                        e.currentTarget.style.background = '#FAF5EC';
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

                {/* Creator Niche */}
                {form.role === 'creator' && (
                  <NicheMultiSelect selectedNiches={selectedNiches} onChange={handleNichesChange} />
                )}

                {/* Brand Company Name */}
                {form.role === 'brand' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,237,230,0.85)' }}>Company Name</label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.45)' }} />
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={upd('companyName')}
                        placeholder="Your Company Pvt Ltd"
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 42px',
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 12,
                          color: '#fff',
                          fontSize: 13.5,
                          outline: 'none',
                          transition: 'all 0.25s',
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
                        }}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = 'rgba(255,107,87,0.45)';
                          e.currentTarget.style.background = 'rgba(255,107,87,0.03)';
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Terms Agreement Checkbox */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px',
                  background: termsAccepted ? 'rgba(143,186,116,0.05)' : 'rgba(255,107,87,0.04)',
                  border: `1px solid ${termsAccepted ? 'rgba(143,186,116,0.2)' : 'rgba(255,107,87,0.12)'}`,
                  borderRadius: 12, marginTop: 4, transition: 'all 0.2s',
                }}>
                  <input
                    type="checkbox"
                    id="termsCheck"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    style={{ marginTop: 2, width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--p)', flexShrink: 0 }}
                  />
                  <label htmlFor="termsCheck" style={{ fontSize: 11.5, color: 'rgba(136,146,164,0.85)', lineHeight: 1.6, cursor: 'pointer' }}>
                    I agree to the{' '}
                    <span
                      onClick={e => { e.preventDefault(); setShowTerms(true); }}
                      style={{ color: 'rgba(255,107,87,0.95)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
                      Terms & Conditions
                    </span>
                    {' '}for {form.role === 'brand' ? 'Brands' : 'Creators'} on CreatoKite.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  style={{
                    padding: '14px',
                    background: 'var(--p)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14.5,
                    cursor: termsAccepted ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--fb)',
                    transition: 'all 0.25s',
                    boxShadow: '0 6px 20px rgba(255,107,87,0.25)',
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: termsAccepted ? 1 : 0.45,
                  }}
                  onMouseEnter={e => {
                    if (!termsAccepted) return;
                    e.currentTarget.style.background = '#e85d45';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,107,87,0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    if (!termsAccepted) return;
                    e.currentTarget.style.background = 'var(--p)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,107,87,0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {loading ? 'Creating…' : (
                    form.role === 'creator' ? (
                      <>
                        <span>Next: Connect Social Profile</span>
                        <ArrowRight size={15} />
                      </>
                    ) : (
                      <>
                        <span>Create Brand Account</span>
                        <ArrowRight size={15} />
                      </>
                    )
                  )}
                </button>
              </form>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(136,146,164,0.65)', marginTop: 20, fontFamily: 'var(--fb)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'rgba(255,107,87,0.85)', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: Connect Social Profiles */}
      {step === 2 && (
        <div style={rightPanelContainerStyle}>
          {rightRings}
          {backButton}

          <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 4 }}>
            {/* Header */}
            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: '#2C2520', letterSpacing: '-0.8px', marginBottom: 6 }}>
                Connect Socials
              </h1>
              <p style={{ color: '#4A3E3D', fontSize: 13.5, fontFamily: 'Inter, sans-serif', opacity: 0.85 }}>
                AI fetches your performance scores instantly — no manual entry required.
              </p>
            </div>



            <div style={cardStyle}>
              <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Instagram input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3E372E' }}>Instagram Handle *</label>
                  <div style={{ position: 'relative' }}>
                    <Link2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6D6356' }} />
                    <input
                      type="text"
                      value={form.instagramUrl}
                      onChange={upd('instagramUrl')}
                      placeholder="@username or link"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        background: '#FAF5EC',
                        border: '1px solid rgba(35, 30, 25, 0.16)',
                        borderRadius: 12,
                        color: '#1F1C18',
                        fontSize: 13.5,
                        outline: 'none',
                        transition: 'all 0.25s',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--acc)';
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(230, 95, 43, 0.12)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(35, 30, 25, 0.16)';
                        e.currentTarget.style.background = '#FAF5EC';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: '#6D6356', fontWeight: 500 }}>e.g. instagram.com/username</span>
                </div>

                {/* Separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(35, 30, 25, 0.12)' }} />
                  <span style={{ fontSize: 10.5, color: '#6D6356', whiteSpace: 'nowrap', fontWeight: 700, letterSpacing: 0.5 }}>AND / OR</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(35, 30, 25, 0.12)' }} />
                </div>

                {/* Youtube input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3E372E' }}>YouTube Channel</label>
                  <div style={{ position: 'relative' }}>
                    <Link2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6D6356' }} />
                    <input
                      type="text"
                      value={form.youtubeUrl}
                      onChange={upd('youtubeUrl')}
                      placeholder="@handle or link"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        background: '#FAF5EC',
                        border: '1px solid rgba(35, 30, 25, 0.16)',
                        borderRadius: 12,
                        color: '#1F1C18',
                        fontSize: 13.5,
                        outline: 'none',
                        transition: 'all 0.25s',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--acc)';
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(230, 95, 43, 0.12)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(35, 30, 25, 0.16)';
                        e.currentTarget.style.background = '#FAF5EC';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: '#6D6356', fontWeight: 500 }}>e.g. youtube.com/@channel</span>
                </div>

                {/* Buttons container */}
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px',
                      background: '#FAF5EC', border: '1px solid rgba(35, 30, 25, 0.16)', borderRadius: 12,
                      color: '#1F1C18', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.borderColor = 'var(--acc)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#FAF5EC';
                      e.currentTarget.style.borderColor = 'rgba(35, 30, 25, 0.16)';
                    }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit"
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'var(--acc)', border: 'none', borderRadius: 12,
                      color: '#fff', fontWeight: 700, fontSize: 14.5, cursor: 'pointer', transition: 'all 0.25s',
                      boxShadow: '0 8px 24px rgba(230,95,43,0.35)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#e85d45';
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(230,95,43,0.45)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--acc)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(230,95,43,0.35)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Zap size={14} /> Analyze & Register
                  </button>
                </div>

                <button type="button" onClick={() => doRegister({})}
                  style={{
                    background: 'none', border: 'none', color: '#6D6356', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', textDecoration: 'underline', textAlign: 'center', transition: 'all 0.2s',
                    marginTop: 4,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--acc)'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6D6356'}
                >
                  Skip — I'll add social profiles later
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Analyzing animation */}
      {step === 3 && (
        <div style={rightPanelContainerStyle}>
          <div style={{ width: '100%', maxWidth: 400, textAlign: 'center', position: 'relative', zIndex: 4 }}>
            <h2 style={{ fontFamily: 'var(--fh)', fontWeight: 800, fontSize: 22, marginBottom: 8, color: '#fff' }}>
              Analyzing profile…
            </h2>
            <p style={{ color: 'rgba(136,146,164,0.7)', fontSize: 13.5, marginBottom: 28 }}>
              Setting up your campaign credentials and calculating CAS score
            </p>

            <div style={cardStyle}>
              {STEPS.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  opacity: i <= stepIdx ? 1 : 0.2, transition: 'opacity 0.4s ease'
                }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{s.icon}</span>
                  <span style={{
                    fontSize: 13.5, fontWeight: i === stepIdx ? 700 : 400,
                    color: i < stepIdx ? 'var(--acc2)' : i === stepIdx ? 'var(--p)' : 'rgba(136,146,164,0.5)',
                    transition: 'color 0.3s'
                  }}>
                    {i < stepIdx ? '✓ ' : i === stepIdx ? '→ ' : ''}{s.label}
                  </span>
                  {i < stepIdx && <CheckCircle size={14} style={{ color: 'var(--acc2)', marginLeft: 'auto', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
            <p style={{ marginTop: 24, fontSize: 11, color: 'rgba(136,146,164,0.4)' }}>
              Auto-registering account + pulling social datasets...
            </p>
          </div>
        </div>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div style={rightPanelContainerStyle}>
          {rightRings}
          <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 4 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
              <h1 style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                Welcome, {result?.user?.displayName}!
              </h1>
              <p style={{ color: 'rgba(136,146,164,0.75)', fontSize: 13.5, marginTop: 6 }}>
                Your CreatoKite creator profile is ready.
              </p>
            </div>

            <div style={cardStyle}>
              {result?.socialResult ? (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,107,87,0.95)', letterSpacing: 0.5, marginBottom: 16 }}>
                    YOUR CREATOR AUTOMATION SCORE
                  </p>
                  <ScoreMini score={result.socialResult.cas} badge={result.socialResult.badge} />

                  {(result.socialResult.igData || result.socialResult.ytData) && (
                    <div className="rs-cols-3" style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                      {[result.socialResult.igData, result.socialResult.ytData].filter(Boolean).flatMap(d => [
                        { label: 'Followers', val: (d.followers || 0).toLocaleString('en-IN') },
                        { label: 'Avg Likes', val: (d.avgLikes || 0).toLocaleString('en-IN') },
                        { label: 'Eng. Rate', val: `${d.er || 0}%` },
                      ]).slice(0, 3).map(({ label, val }) => (
                        <div key={label} style={{
                          background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: 10, padding: '9px', textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'var(--fh)' }}>{val}</div>
                          <div style={{ fontSize: 9.5, color: 'rgba(136,146,164,0.5)', marginTop: 2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{
                    marginTop: 18, padding: '12px 14px', borderRadius: 10, fontSize: 12, lineHeight: 1.6,
                    background: result.socialResult.autoApprove ? 'rgba(143,186,116,0.06)' : 'rgba(255,107,87,0.06)',
                    border: `1px solid ${result.socialResult.autoApprove ? 'rgba(143,186,116,0.15)' : 'rgba(255,107,87,0.15)'}`,
                    color: result.socialResult.autoApprove ? 'var(--acc2)' : 'rgba(255,107,87,0.95)'
                  }}>
                    {result.socialResult.autoApprove
                      ? '✔ Profile auto-approved! You can now get assigned to campaigns immediately.'
                      : "⏳ Admin will review your profile. You'll get a dashboard notification within 24h."}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(136,146,164,0.75)', fontSize: 13.5 }}>
                  Account created! Connect your socials in the dashboard to generate your CAS score.
                </div>
              )}

              <button
                onClick={() => navigate('/creator/dashboard', { replace: true })}
                style={{
                  width: '100%', marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px', background: 'var(--p)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
                  fontFamily: 'var(--fb)', transition: 'all 0.25s', boxShadow: '0 6px 20px rgba(255,107,87,0.25)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#e85d45';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,107,87,0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--p)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,107,87,0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Small inline style override for responsive split screen */}
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
        
        .auth-container input:not([type="checkbox"]),
        .auth-container select {
          background: #FAF6EE !important;
          border: 1px solid rgba(74, 62, 61, 0.12) !important;
          color: #2C2520 !important;
          font-family: Inter, sans-serif !important;
          transition: all 0.25s ease !important;
          border-radius: 10px !important;
        }
        .auth-container input:not([type="checkbox"]):focus,
        .auth-container select:focus {
          border-color: var(--acc) !important;
          background: #FFFFFF !important;
          box-shadow: 0 0 0 3px rgba(230,95,43,0.1) !important;
        }
        .auth-container label {
          color: #4A3E3D !important;
          font-family: Inter, sans-serif !important;
          font-weight: 600 !important;
        }
        .auth-container select option {
          background: #FFFDF9 !important;
          color: #2C2520 !important;
        }
        .auth-container button[type="submit"],
        .auth-container button.submit-btn {
          background: var(--acc) !important;
          border: none !important;
          color: #ffffff !important;
          font-family: Inter, sans-serif !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 16px rgba(230,95,43,0.2) !important;
        }
        .auth-container button[type="submit"]:hover,
        .auth-container button.submit-btn:hover {
          background: #C2410C !important;
          box-shadow: 0 8px 24px rgba(230,95,43,0.3) !important;
          transform: translateY(-1px) !important;
        }
        .auth-container button[type="submit"]:disabled {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
        }
        .auth-container a {
          color: var(--acc) !important;
        }
        .auth-container h1, .auth-container h2, .auth-container h3 {
          font-family: Inter, sans-serif !important;
          text-transform: none !important;
        }
      `}</style>
    </div>
  );
}

