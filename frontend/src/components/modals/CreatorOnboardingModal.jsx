import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usersAPI } from '../../api';
import toast from 'react-hot-toast';
import { Sparkles, MapPin, Instagram, Eye, DollarSign, Camera, Video, Languages, CheckCircle2, ChevronRight, ChevronLeft, X, Lock } from 'lucide-react';

const NICHES = ['Tech', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Travel', 'Gaming', 'Education', 'Finance', 'Lifestyle'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Hinglish', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'];

export default function CreatorOnboardingModal({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    phone: user?.phone || '',
    instagramUrl: user?.socialUrls?.instagram || user?.instagramUrl || (user?.handle ? `https://instagram.com/${user.handle}` : ''),
    city: user?.city || user?.location || '',
    niche: user?.niche || 'Tech',
    followers: user?.platforms?.instagram?.followers || user?.followers || 0,
    avgViews: user?.avgViews || '',
    engagementRate: user?.platforms?.instagram?.engagement || user?.engagementRate || 0,
    languages: user?.languages?.length ? user.languages : ['English', 'Hindi'],
    isUgcCreator: user?.isUgcCreator !== undefined ? user.isUgcCreator : true,
    isOnCamera: user?.isOnCamera !== undefined ? user.isOnCamera : true,
    audienceLocation: user?.audienceLocation || '',
    commercialRate: user?.commercialRate || '',
    availabilityStatus: user?.availabilityStatus || 'Available',
    previousCampaignsCount: (user?.previousCampaignsCount !== undefined && user?.previousCampaignsCount !== null && user?.previousCampaignsCount !== 0) ? user.previousCampaignsCount : '',
    reliabilityScore: user?.reliabilityScore || 90,
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleLanguage = (lang) => {
    setForm(prev => {
      const exists = prev.languages.includes(lang);
      const updated = exists ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang];
      return { ...prev, languages: updated.length ? updated : ['English'] };
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        avgViews: Number(form.avgViews) || 5000,
        commercialRate: Number(form.commercialRate) || 5000,
        previousCampaignsCount: Number(form.previousCampaignsCount) || 3,
        audienceLocation: form.audienceLocation || 'India',
        location: form.city || form.location,
        onboardingCompleted: true,
      };
      const res = await usersAPI.updateProfile(payload);
      toast.success('Creator Profile Completed! Welcome to CreatoKite.');
      if (onComplete) onComplete(res.user);
      else window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save creator profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!form.displayName?.trim()) return toast.error('Please enter your Full Name');
      if (!form.phone?.trim()) return toast.error('Please enter your Phone Number');
      if (!form.city?.trim()) return toast.error('Please enter your City / Location');
      if (!form.instagramUrl?.trim()) return toast.error('Please enter your Instagram handle or profile link');
      if (!form.niche) return toast.error('Please select your Niche category');
      setStep(2);
    } else if (step === 2) {
      if (!form.avgViews && form.avgViews !== 0) return toast.error('Please fill in your Average Reel Views');
      if (!form.commercialRate && form.commercialRate !== 0) return toast.error('Please fill in your Commercial Rate per Post (₹)');
      if (!form.audienceLocation?.trim()) return toast.error('Please fill in your Primary Audience Location');
      if (form.previousCampaignsCount === '' || form.previousCampaignsCount === undefined || form.previousCampaignsCount === null) return toast.error('Please fill in your Past Brand Collaborations count');
      setStep(3);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(18, 16, 15, 0.82)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      <div
        className="no-scrollbar"
        style={{
          width: '100%', maxWidth: 580, background: 'var(--s1, #FFFDF9)',
          border: '1px solid var(--border, rgba(74,62,61,0.14))', borderRadius: 24,
          padding: '30px 32px', boxShadow: '0 24px 70px rgba(0,0,0,0.4)', position: 'relative',
          maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: 'rgba(230,95,43,0.12)',
            color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>
              Creator Verification & Onboarding
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0, fontWeight: 500 }}>
              Step {step} of 3 — All fields required. (You can update rates & location anytime in Settings)
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 4, background: 'rgba(74,62,61,0.08)', borderRadius: 99, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(step / 3) * 100}%`, background: 'var(--acc)', transition: 'width 0.3s ease' }} />
        </div>

        {/* STEP 1: Basic & Social Profile */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Step 1: Profile & Social Details</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span>1. Full Name</span>
                  {user?.displayName && <span style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Lock size={10} /> Verified</span>}
                </label>
                <input
                  type="text" value={form.displayName} onChange={e => update('displayName', e.target.value)}
                  readOnly={!!user?.displayName}
                  placeholder="e.g. Rahul Gupta" required
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: user?.displayName ? 'rgba(74,62,61,0.08)' : 'var(--s2, #F0ECE1)',
                    border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)',
                    outline: 'none', cursor: user?.displayName ? 'not-allowed' : 'text', fontWeight: user?.displayName ? 700 : 400
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>2. Phone Number *</label>
                <input
                  type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                  placeholder="+91 98765 43210" required
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #F0ECE1)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>3. City (Location) *</label>
              <input
                type="text" value={form.city} onChange={e => update('city', e.target.value)}
                placeholder="e.g. Mumbai, Delhi" required
                style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #F0ECE1)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <span>3. Instagram Profile Link / Handle</span>
                {(user?.socialUrls?.instagram || user?.handle) && <span style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Lock size={10} /> Verified Handle</span>}
              </label>
              <input
                type="text" value={form.instagramUrl} onChange={e => update('instagramUrl', e.target.value)}
                readOnly={!!(user?.socialUrls?.instagram || user?.handle)}
                placeholder="https://instagram.com/yourhandle or @yourhandle" required
                style={{
                  width: '100%', padding: '10px 12px',
                  background: (user?.socialUrls?.instagram || user?.handle) ? 'rgba(74,62,61,0.08)' : 'var(--s2, #F0ECE1)',
                  border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)',
                  outline: 'none', cursor: (user?.socialUrls?.instagram || user?.handle) ? 'not-allowed' : 'text', fontWeight: (user?.socialUrls?.instagram || user?.handle) ? 700 : 400
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>4. Niche Category</label>
                <select
                  value={form.niche} onChange={e => update('niche', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #F0ECE1)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)', outline: 'none' }}
                >
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>5. Availability Status</label>
                <select
                  value={form.availabilityStatus} onChange={e => update('availabilityStatus', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #F0ECE1)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)', outline: 'none' }}
                >
                  <option value="Available">Available for Campaigns</option>
                  <option value="Busy">Busy (Limited Slots)</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>8. Languages Supported</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LANGUAGE_OPTIONS.map(lang => {
                  const sel = form.languages.includes(lang);
                  return (
                    <button
                      key={lang} type="button" onClick={() => toggleLanguage(lang)}
                      style={{
                        padding: '5px 12px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                        background: sel ? 'var(--acc)' : 'var(--s2)', color: sel ? '#FFF' : 'var(--t2)',
                        border: sel ? '1px solid var(--acc)' : '1px solid var(--border)', transition: 'all 0.15s'
                      }}
                    >
                      {lang} {sel ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Performance Metrics & Commercials */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Step 2: Performance Metrics & Budgeting</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span>5. Followers Count</span>
                  <span style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Lock size={10} /> Auto-Scraped</span>
                </label>
                <input
                  type="number" value={form.followers} onChange={e => update('followers', +e.target.value)}
                  readOnly={true}
                  placeholder="e.g. 25000" required
                  style={{
                    width: '100%', padding: '10px 12px', background: 'rgba(74,62,61,0.08)',
                    border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)',
                    outline: 'none', cursor: 'not-allowed', fontWeight: 700
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>6. Average Reel Views</label>
                <input
                  type="number" value={form.avgViews} onChange={e => update('avgViews', e.target.value)}
                  placeholder="5000" required
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #F0ECE1)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span>7. Engagement Rate (%)</span>
                  <span style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Lock size={10} /> Verified</span>
                </label>
                <input
                  type="number" step="0.1" value={form.engagementRate} onChange={e => update('engagementRate', e.target.value)}
                  readOnly={true}
                  placeholder="0.0" required
                  style={{
                    width: '100%', padding: '10px 12px', background: 'rgba(74,62,61,0.08)',
                    border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)',
                    outline: 'none', cursor: 'not-allowed', fontWeight: 700
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>12. Commercial Rate per Post (₹)</label>
                <input
                  type="number" value={form.commercialRate} onChange={e => update('commercialRate', e.target.value)}
                  placeholder="5000" required
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #F0ECE1)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>11. Audience Primary Location</label>
                <input
                  type="text" value={form.audienceLocation} onChange={e => update('audienceLocation', e.target.value)}
                  placeholder="India" required
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #F0ECE1)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>14. Past Brand Collaborations</label>
                <input
                  type="number" value={form.previousCampaignsCount} onChange={e => update('previousCampaignsCount', e.target.value)}
                  placeholder="3" required
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #F0ECE1)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--t1)', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Campaign Capabilities & Comfort */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Step 3: Campaign Execution & Capabilities</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{
                padding: 16, background: form.isUgcCreator ? 'rgba(230,95,43,0.06)' : 'var(--s2)',
                border: form.isUgcCreator ? '1.5px solid var(--acc)' : '1px solid var(--border)',
                borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s'
              }} onClick={() => update('isUgcCreator', !form.isUgcCreator)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--t1)' }}>9. UGC Creator</span>
                  <input type="checkbox" checked={form.isUgcCreator} readOnly style={{ accentColor: 'var(--acc)' }} />
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0 }}>Comfortable creating User Generated Content (unboxing, reviews, product demos).</p>
              </div>

              <div style={{
                padding: 16, background: form.isOnCamera ? 'rgba(230,95,43,0.06)' : 'var(--s2)',
                border: form.isOnCamera ? '1.5px solid var(--acc)' : '1px solid var(--border)',
                borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s'
              }} onClick={() => update('isOnCamera', !form.isOnCamera)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--t1)' }}>10. On-Camera Presence</span>
                  <input type="checkbox" checked={form.isOnCamera} readOnly style={{ accentColor: 'var(--acc)' }} />
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0 }}>Comfortable speaking & acting directly on camera for promotional video reels.</p>
              </div>
            </div>

            <div style={{ padding: 16, background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--t1)' }}>15. Self-Assessed Reliability Score</span>
                <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--acc)' }}>{form.reliabilityScore}/100</span>
              </div>
              <input
                type="range" min="50" max="100" value={form.reliabilityScore} onChange={e => update('reliabilityScore', +e.target.value)}
                style={{ width: '100%', accentColor: 'var(--acc)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', fontWeight: 600, marginTop: 4 }}>
                <span>Standard (50)</span>
                <span>High Reliability (100)</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {step > 1 ? (
            <button
              type="button" onClick={() => setStep(s => s - 1)}
              style={{ padding: '10px 18px', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--t2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button" onClick={handleNextStep}
              style={{ padding: '10px 22px', background: 'var(--acc)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(230,95,43,0.3)' }}
            >
              Next Step <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button" onClick={handleSubmit} disabled={saving}
              style={{ padding: '10px 26px', background: 'var(--acc)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(230,95,43,0.35)' }}
            >
              <CheckCircle2 size={16} /> {saving ? 'Saving Profile...' : 'Complete & Verify Profile'}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
