import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../api';
import toast from 'react-hot-toast';
import { AlertTriangle, Save, Sparkles, Lock, Trash2, Building2 } from 'lucide-react';

export default function Profile() {
  const { user, refreshUser, setUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    companyName: user?.companyName || '',
    industry: user?.industry || '',
    location: user?.location || '',
    website: user?.website || '',
    avatar: user?.avatar || '',
    bio: user?.bio || '',
  });

  // Sync user details on mount or change
  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        email: user.email || '',
        companyName: user.companyName || '',
        industry: user.industry || '',
        location: user.location || '',
        website: user.website || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await usersAPI.updateProfile(form);
      await refreshUser();
      toast.success('Profile saved!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ WARNING: Deleting your account will permanently remove all your campaigns, settings, and profile data from Creatokite. This action cannot be undone.\n\nAre you sure you want to delete your account?")) {
      try {
        await usersAPI.deleteAccount();
        toast.success('Account successfully deleted.');
        localStorage.removeItem('ck_token');
        localStorage.removeItem('ck_refresh');
        setUser(null);
        navigate('/login');
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to delete account');
      }
    }
  };

  const complete = user?.profileComplete || 0;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(24px, 4vw, 32px)', letterSpacing: '-0.02em', color: 'var(--t1)', marginBottom: 4 }}>
            Brand Profile Settings
          </h2>
          <p style={{ color: 'var(--t2)', fontSize: 13.5, fontWeight: 500 }}>
            Keep your company details updated so creators get to know your brand better.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 12, padding: '0 24px',
            background: 'var(--acc)', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5,
            cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(230,95,43,0.3)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e85d45'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--acc)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Completeness bar */}
      <div style={{
        padding: '20px 24px',
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: 'var(--glass-shadow)'
      }}>
        <div className="flex-between" style={{ marginBottom: 10, fontSize: 13 }}>
          <span style={{ color: 'var(--acc)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} /> Profile Completeness
          </span>
          <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--t1)' }}>{complete}%</span>
        </div>
        <div style={{ height: 10, background: 'var(--s2)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ height: '100%', width: `${complete}%`, background: 'linear-gradient(90deg, #E65F2B 0%, #F5A623 100%)', borderRadius: 99, transition: 'width 1s ease' }} />
        </div>
        {complete < 85 && (
          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 10, fontWeight: 500 }}>
            💡 Add company description, industry, location, and website logo to complete your profile.
          </div>
        )}
      </div>

      {/* ── BASIC INFO ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 24,
        boxShadow: 'var(--glass-shadow)'
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={18} style={{ color: 'var(--acc)' }} /> Company Profile
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Company Name *</label>
            <input
              value={form.companyName} onChange={upd('companyName')} placeholder="e.g. Acme Corp" required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Industry *</label>
            <input
              value={form.industry} onChange={upd('industry')} placeholder="e.g. Tech, Fashion, Wellness" required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Contact Person Name *</label>
            <input
              value={form.displayName} onChange={upd('displayName')} required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span>Email Address</span>
              <span style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Lock size={10} /> Locked</span>
            </label>
            <input
              value={form.email} readOnly disabled
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t3)', fontSize: 13.5, cursor: 'not-allowed', fontWeight: 600, opacity: 0.7 }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Brand Logo / Avatar URL</label>
            <input
              value={form.avatar} onChange={upd('avatar')} placeholder="https://example.com/logo.jpg"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Website / Landing Page</label>
            <input
              value={form.website} onChange={upd('website')} placeholder="https://yourcompany.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Office Location</label>
          <input
            value={form.location} onChange={upd('location')} placeholder="Mumbai, India"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Company Overview / Bio</label>
          <textarea
            value={form.bio} onChange={upd('bio')} placeholder="Tell creators about your brand mission, target audience, and style guidelines…"
            style={{ width: '100%', minHeight: 110, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none', resize: 'vertical' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
          />
        </div>
      </div>

      {/* ── DANGER ZONE ────────────────────────────────────────── */}
      <div style={{
        border: '1px solid rgba(239, 68, 68, 0.3)',
        background: 'rgba(239, 68, 68, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 8px 30px rgba(239,68,68,0.05)'
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <AlertTriangle size={18} /> Danger Zone
        </h3>
        <p style={{ color: 'var(--t2)', fontSize: 13, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
          Once you delete your brand account, there is no going back. All campaigns, transactions, and settings will be permanently removed.
        </p>
        <div>
          <button
            onClick={handleDeleteAccount}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px',
              borderRadius: 10, background: '#EF4444', color: '#FFFFFF', border: 'none',
              fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.35)'
            }}
          >
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
