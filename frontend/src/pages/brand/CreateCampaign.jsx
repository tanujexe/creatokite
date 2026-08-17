import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campaignsAPI } from '../../api';
import { Btn, Input, Textarea } from '../../components/ui';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Star, Coins, Target, TrendingUp, ClipboardList, Zap, Crosshair, Users, Palette, BarChart3, Gift } from 'lucide-react';

const NICHES = ['Tech', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Travel', 'Gaming', 'Education', 'Finance', 'Lifestyle', 'Music', 'Art', 'Other'];
const PLATFORMS = ['instagram', 'youtube', 'twitter'];
const DELIVERABLES = ['Instagram Reel', 'Instagram Post', 'Instagram Story', 'YouTube Video', 'YouTube Shorts', 'Twitter Post'];
const GOALS = ['Brand Awareness', 'Product Launch', 'App Downloads', 'Website Traffic', 'Lead Generation', 'Sales Conversion', 'Community Growth', 'Event Promotion'];
const AUDIENCES = ['Gen Z (18-24)', 'Millennials (25-34)', 'Adults (35-44)', 'Pan India', 'Metro Cities', 'Tier 2 Cities', 'Students', 'Working Professionals'];

const STEPS = ['Campaign Brief', 'Requirements', 'Budget & Timeline', 'Review'];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [tag, setTag] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', niche: [], campaignGoal: [], targetAudience: [],
    platforms: [], deliverables: [], tags: [], contentGuidelines: '',
    dealType: 'paid', barterProduct: '', barterValue: '', barterDelivery: 'Courier Shipping to Creator Address',
    budget: '', budgetType: 'fixed', totalSlots: '5', payoutPerCreator: '',
    minFollowers: '1000', minEngagement: '0', deadline: '',
    isPremium: false,
    kpiTargets: { reach: '', impressions: '', engagement: '', conversions: '' },
  });

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const updKpi = k => e => setForm(p => ({ ...p, kpiTargets: { ...p.kpiTargets, [k]: e.target.value } }));
  const toggleArr = (k, v) => setForm(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));
  const addTag = () => { const t = tag.trim(); if (t && !form.tags.includes(t)) { setForm(p => ({ ...p, tags: [...p.tags, t] })); setTag(''); } };

  const canNext = () => {
    if (step === 0) return form.title && form.description && form.niche.length > 0 && form.campaignGoal.length > 0;
    if (step === 1) return form.deliverables.length > 0 && form.platforms.length > 0;
    if (step === 2) {
      if (!form.deadline) return false;
      const slots = +form.totalSlots || 0;
      if (slots <= 0) return false;
      if (form.dealType === 'barter') return Boolean(form.barterProduct && form.barterProduct.trim());
      const cashBudget = +form.budget || (+form.payoutPerCreator * slots) || 0;
      if (form.dealType === 'paid') return cashBudget > 0;
      if (form.dealType === 'hybrid') return cashBudget > 0 && Boolean(form.barterProduct && form.barterProduct.trim());
      return true;
    }
    return true;
  };

  const handleSubmit = async () => {
    const slots = +form.totalSlots || 1;
    const cashBudget = +form.budget || (+form.payoutPerCreator * slots) || 0;

    if (form.dealType !== 'barter' && cashBudget <= 0) {
      toast.error('Paid and Hybrid campaigns require a budget greater than ₹0.');
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      await campaignsAPI.create({
        ...form, budget: cashBudget, totalSlots: slots,
        minFollowers: +form.minFollowers, minEngagement: +form.minEngagement,
        kpiTargets: {
          reach: +form.kpiTargets.reach || 0, impressions: +form.kpiTargets.impressions || 0,
          engagement: +form.kpiTargets.engagement || 0, conversions: +form.kpiTargets.conversions || 0
        },
        workflowStatus: 'brand_submitted',
      });
      toast.success('Campaign brief submitted! Our team will review and assign creators shortly.');
      navigate('/brand/dashboard');
    } catch (e) { toast.error(e.response?.data?.message || e.response?.data?.errors?.[0]?.msg || 'Submission failed'); }
    finally { setSaving(false); }
  };

  const chip = active => ({
    display: 'inline-flex', alignItems: 'center', padding: '8px 16px', borderRadius: 100,
    fontSize: 12.5, cursor: 'pointer', userSelect: 'none', transition: 'all .2s cubic-bezier(0.16, 1, 0.3, 1)',
    background: active ? 'rgba(230, 95, 43, 0.14)' : 'var(--s2, rgba(255,255,255,0.03))',
    border: active ? '1px solid rgba(230, 95, 43, 0.5)' : '1px solid var(--border)',
    color: active ? 'var(--acc)' : 'var(--t2)', fontWeight: active ? 650 : 450,
    boxShadow: active ? '0 0 12px rgba(230, 95, 43, 0.1)' : 'none',
    transform: active ? 'scale(1.03)' : 'scale(1)',
    letterSpacing: '0.01em',
  });

  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="page-enter brand-create-campaign" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header Banner */}
      <div className="card" style={{
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 10
      }}>
        {/* Glow backdrop accent */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 150, height: 150,
          background: 'radial-gradient(circle, rgba(255,107,87,0.12) 0%, transparent 70%)',
          filter: 'blur(30px)', pointerEvents: 'none'
        }} />
        <div>
          <h2 className="brand-title" style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--t1)' }}>
            Submit Campaign Brief
          </h2>
          <p style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 500, marginTop: 4 }}>
            Our AI + team matches and assigns the best creators — no browsing required.
          </p>
        </div>
      </div>

      {/* Steps Progress Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 20,
        gap: 0,
        padding: '18px 24px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
        boxShadow: 'var(--glass-shadow)'
      }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: i < step
                  ? 'linear-gradient(135deg, var(--acc2, #7C8B5A), #5a6640)'
                  : i === step
                    ? 'linear-gradient(135deg, var(--acc, #E65F2B), #d44e1c)'
                    : 'var(--s2, rgba(255,255,255,0.06))',
                border: i === step
                  ? '2px solid rgba(255, 255, 255, 0.4)'
                  : i < step
                    ? '1px solid rgba(124, 139, 90, 0.4)'
                    : '1px solid var(--border)',
                color: i <= step ? '#ffffff' : 'var(--t3)',
                boxShadow: i === step
                  ? '0 0 16px rgba(230, 95, 43, 0.4)'
                  : i < step
                    ? '0 0 10px rgba(124, 139, 90, 0.2)'
                    : 'none',
                transition: 'all .3s ease'
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="stepper-label" style={{
                fontSize: 11,
                color: i === step
                  ? 'var(--acc, #E65F2B)'
                  : i < step
                    ? 'var(--acc2, #7C8B5A)'
                    : 'var(--t3)',
                fontWeight: i <= step ? 700 : 500,
                textAlign: 'center',
                lineHeight: 1.3,
                maxWidth: 85,
                transition: 'all .3s ease'
              }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="stepper-line" style={{
                flex: 1,
                height: 3,
                background: i < step
                  ? 'linear-gradient(90deg, var(--acc2, #7C8B5A), var(--acc, #E65F2B))'
                  : 'var(--border)',
                borderRadius: 99,
                margin: '0 8px',
                marginBottom: 20,
                transition: 'all .3s'
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* STEP 0 */}
        {step === 0 && (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(230,95,43,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Target size={18} style={{ color: 'var(--acc)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Campaign Identity</h3>
                  <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0', fontWeight: 450 }}>Define what your campaign is about</p>
                </div>
              </div>

              {/* Title & Description */}
              <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14, borderBottom: '1px solid var(--border)' }}>
                <Input label="Campaign Title *" value={form.title} onChange={upd('title')} placeholder="Item Unboxing" />
                <Textarea label="Campaign Description *" value={form.description} onChange={upd('description')} placeholder="Describe your brand, product, key messages and what you expect creators to do…" style={{ minHeight: 100 }} />
              </div>

              {/* Primary Goal */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Crosshair size={14} style={{ color: 'var(--acc2)' }} />
                  <label style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--t1)' }}>Primary Goal *</label>
                </div>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: '0 0 10px', lineHeight: 1.4 }}>What do you want this campaign to achieve? <span style={{ color: 'var(--t2)', fontWeight: 500 }}>Select multiple</span></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GOALS.map(g => <button type="button" key={g} onClick={() => toggleArr('campaignGoal', g)} style={chip(form.campaignGoal.includes(g))}>{g}</button>)}
                </div>
              </div>

              {/* Target Audience */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Users size={14} style={{ color: '#3b82f6' }} />
                  <label style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--t1)' }}>Target Audience</label>
                </div>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: '0 0 10px', lineHeight: 1.4 }}>Who should the content reach? <span style={{ color: 'var(--t2)', fontWeight: 500 }}>Select multiple</span></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AUDIENCES.map(a => <button type="button" key={a} onClick={() => toggleArr('targetAudience', a)} style={chip(form.targetAudience.includes(a))}>{a}</button>)}
                </div>
              </div>

              {/* Creator Niche */}
              <div style={{ padding: '18px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Palette size={14} style={{ color: '#a855f7' }} />
                  <label style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--t1)' }}>Creator Niche *</label>
                </div>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: '0 0 10px', lineHeight: 1.4 }}>What type of creator best fits this campaign? <span style={{ color: 'var(--t2)', fontWeight: 500 }}>Select multiple</span></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {NICHES.map(n => <button type="button" key={n} onClick={() => toggleArr('niche', n)} style={chip(form.niche.includes(n))}>{n}</button>)}
                </div>
              </div>
            </div>

            {/* KPI Targets Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BarChart3 size={18} style={{ color: '#10B981' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>KPI Targets <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}>— Optional</span></h3>
                  <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0', fontWeight: 450 }}>Set measurable goals to track success</p>
                </div>
              </div>
              <div style={{ padding: '18px 24px' }}>
                <div className="grid-2" style={{ gap: 12 }}>
                  <Input label="Target Reach" type="number" value={form.kpiTargets.reach} onChange={updKpi('reach')} placeholder="500000" />
                  <Input label="Target Impressions" type="number" value={form.kpiTargets.impressions} onChange={updKpi('impressions')} placeholder="1000000" />
                  <Input label="Target Engagement" type="number" value={form.kpiTargets.engagement} onChange={updKpi('engagement')} placeholder="50000" />
                  <Input label="Target Conversions" type="number" value={form.kpiTargets.conversions} onChange={updKpi('conversions')} placeholder="1000" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--t1)' }}>Platforms *</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PLATFORMS.map(p => <button type="button" key={p} onClick={() => toggleArr('platforms', p)} style={chip(form.platforms.includes(p))} className="capitalize">{p}</button>)}
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--t1)' }}>Deliverables *</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {DELIVERABLES.map(d => <button type="button" key={d} onClick={() => toggleArr('deliverables', d)} style={chip(form.deliverables.includes(d))}>{d}</button>)}
              </div>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Creator Requirements</h3>
              <div className="grid-2" style={{ gap: 12 }}>
                <Input label="Min Followers" type="number" value={form.minFollowers} onChange={upd('minFollowers')} />
                <Input label="Min Engagement %" type="number" step="0.1" value={form.minEngagement} onChange={upd('minEngagement')} />
                <Input label="Creator Slots" type="number" value={form.totalSlots} onChange={upd('totalSlots')} hint="How many creators to assign" />
              </div>
              <Textarea label="Content Guidelines" value={form.contentGuidelines} onChange={upd('contentGuidelines')} placeholder="Dos, don'ts, hashtags, tone, reference links…" style={{ minHeight: 90 }} />
            </div>
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--t1)' }}>Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {form.tags.map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(230,95,43,0.1)', border: '1px solid rgba(230,95,43,0.25)', borderRadius: 6, fontSize: 11.5, color: 'var(--t1)' }}>
                    {t}<X size={10} style={{ cursor: 'pointer' }} onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))} />
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add a tag…" className="form-input" style={{ flex: 1 }} />
                <Btn size="sm" variant="secondary" onClick={addTag}><Plus size={12} /></Btn>
              </div>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: '24px' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t1)', margin: '0 0 4px' }}>
                <Coins size={18} style={{ color: 'var(--acc)' }} /> Campaign Compensation Model *
              </h3>
              <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0 }}>Choose how creators will be compensated for their content.</p>
            </div>

            {/* Compensation Model Selector Cards */}
            <div className="grid-3" style={{ gap: 12 }}>
              {/* Paid Button */}
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, dealType: 'paid' }))}
                style={{
                  padding: '16px 14px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: form.dealType === 'paid' ? 'rgba(230, 95, 43, 0.12)' : 'var(--s2, rgba(255,255,255,0.03))',
                  border: form.dealType === 'paid' ? '2px solid var(--acc)' : '1px solid var(--border)',
                  transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: form.dealType === 'paid' ? 'var(--acc)' : 'var(--t1)' }}>💵 Paid Campaign</span>
                  {form.dealType === 'paid' && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'var(--acc)', color: '#fff', fontWeight: 800 }}>ACTIVE</span>}
                </div>
                <p style={{ fontSize: 11, color: 'var(--t2)', margin: 0, lineHeight: 1.3 }}>Creators receive a direct cash payout per post.</p>
              </button>

              {/* Barter Button */}
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, dealType: 'barter' }))}
                style={{
                  padding: '16px 14px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: form.dealType === 'barter' ? 'rgba(124, 139, 90, 0.15)' : 'var(--s2, rgba(255,255,255,0.03))',
                  border: form.dealType === 'barter' ? '2px solid var(--acc2)' : '1px solid var(--border)',
                  transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: form.dealType === 'barter' ? 'var(--acc2)' : 'var(--t1)' }}>🎁 Barter Deal</span>
                  {form.dealType === 'barter' && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'var(--acc2)', color: '#fff', fontWeight: 800 }}>ACTIVE</span>}
                </div>
                <p style={{ fontSize: 11, color: 'var(--t2)', margin: 0, lineHeight: 1.3 }}>Creators receive free products/gifts in exchange for content.</p>
              </button>

              {/* Hybrid Button */}
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, dealType: 'hybrid' }))}
                style={{
                  padding: '16px 14px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: form.dealType === 'hybrid' ? 'rgba(212, 162, 76, 0.14)' : 'var(--s2, rgba(255,255,255,0.03))',
                  border: form.dealType === 'hybrid' ? '2px solid var(--gold)' : '1px solid var(--border)',
                  transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: form.dealType === 'hybrid' ? 'var(--gold)' : 'var(--t1)' }}>✨ Paid + Barter</span>
                  {form.dealType === 'hybrid' && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'var(--gold)', color: '#111', fontWeight: 800 }}>ACTIVE</span>}
                </div>
                <p style={{ fontSize: 11, color: 'var(--t2)', margin: 0, lineHeight: 1.3 }}>Creators receive cash payout AND free gifted products.</p>
              </button>
            </div>

            {/* Dynamic Fields for Barter / Hybrid */}
            {(form.dealType === 'barter' || form.dealType === 'hybrid') && (
              <div style={{ padding: '16px 18px', background: 'rgba(124, 139, 90, 0.08)', border: '1px solid rgba(124, 139, 90, 0.25)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Gift size={16} style={{ color: 'var(--acc2)' }} />
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Product / Gift Details *</h4>
                </div>
                <div className="grid-2" style={{ gap: 12 }}>
                  <Input label="Gift Product Name *" value={form.barterProduct} onChange={upd('barterProduct')} placeholder="e.g. Wireless ANC Earbuds Pro v2" />
                  <Input label="Estimated Product Value (₹ per creator)" type="number" value={form.barterValue} onChange={upd('barterValue')} placeholder="e.g. 2500" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--t1)' }}>Delivery & Fulfillment Method</label>
                  <select className="form-input" value={form.barterDelivery} onChange={upd('barterDelivery')}>
                    <option value="Courier Shipping to Creator Address">Courier Shipping to Creator Address</option>
                    <option value="Digital Voucher / Promo Code">Digital Voucher / Promo Code</option>
                    <option value="In-Store Pickup / Brand Experience">In-Store Pickup / Brand Experience</option>
                  </select>
                </div>
              </div>
            )}

            {/* Dynamic Fields for Paid / Hybrid */}
            {(form.dealType === 'paid' || form.dealType === 'hybrid') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="grid-2" style={{ gap: 12 }}>
                  <Input label="Payout per Creator (₹) *" type="number" value={form.payoutPerCreator} onChange={e => {
                    const val = e.target.value;
                    setForm(p => ({ ...p, payoutPerCreator: val, budget: val && p.totalSlots ? (+val * +p.totalSlots).toString() : p.budget }));
                  }} placeholder="e.g. 5000" min="100" />
                  <Input label="Total Creator Slots *" type="number" value={form.totalSlots} onChange={e => {
                    const slots = e.target.value;
                    setForm(p => ({ ...p, totalSlots: slots, budget: p.payoutPerCreator && slots ? (+p.payoutPerCreator * +slots).toString() : p.budget }));
                  }} placeholder="5" min="1" />
                </div>
                <Input label="Calculated Total Cash Budget (₹)" type="number" value={form.budget} onChange={upd('budget')} placeholder="25000" />
              </div>
            )}

            {form.dealType === 'barter' && (
              <Input label="Total Creator Slots *" type="number" value={form.totalSlots} onChange={upd('totalSlots')} placeholder="5" min="1" />
            )}

            <Input label="Campaign Deadline *" type="date" value={form.deadline} onChange={upd('deadline')} min={minDate} />

            {/* Campaign Deal Summary Badge */}
            {form.totalSlots && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(230,95,43,0.08)', border: '1px solid rgba(230,95,43,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--t1)' }}>
                <Coins size={16} style={{ color: 'var(--acc)' }} />
                <span>
                  <strong>{form.dealType === 'barter' ? '🎁 Pure Barter Deal' : form.dealType === 'hybrid' ? '✨ Paid + Barter Hybrid' : '💵 Paid Cash Deal'}</strong>
                  {form.dealType !== 'barter' && form.payoutPerCreator && ` · ₹${(+form.payoutPerCreator).toLocaleString('en-IN')} cash/creator`}
                  {form.dealType !== 'paid' && form.barterProduct && ` · Gift: ${form.barterProduct}`}
                  {` · ${form.totalSlots} slots`}
                </span>
              </div>
            )}

            <div
              onClick={() => setForm(p => ({ ...p, isPremium: !p.isPremium }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: form.isPremium ? 'rgba(212, 162, 76, 0.16)' : 'var(--s2, rgba(255,255,255,0.04))',
                border: form.isPremium ? '2px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--gold)', fontWeight: 750 }}>
                  <Star size={16} style={{ fill: form.isPremium ? 'var(--gold)' : 'none' }} /> Premium Campaign
                </div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4, lineHeight: 1.35, fontWeight: 500 }}>
                  Priority review, featured placement, dedicated account manager
                </div>
              </div>

              {/* High-visibility toggle switch */}
              <div style={{
                width: 44,
                height: 24,
                borderRadius: 99,
                background: form.isPremium ? 'var(--gold)' : 'rgba(120, 120, 120, 0.35)',
                position: 'relative',
                transition: 'background .2s ease',
                flexShrink: 0,
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
              }}>
                <div style={{
                  position: 'absolute',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#ffffff',
                  top: 3,
                  left: form.isPremium ? 23 : 3,
                  transition: 'left .2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '18px 20px', background: 'rgba(230,95,43,0.06)', border: '1px solid rgba(230,95,43,0.18)', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t1)' }}><ClipboardList size={14} style={{ color: 'var(--acc)' }} /> Campaign Summary</div>
              <div className="grid-2" style={{ gap: 8 }}>
                {[['Title', form.title], ['Goal', Array.isArray(form.campaignGoal) ? form.campaignGoal.join(', ') : form.campaignGoal], ['Niche', Array.isArray(form.niche) ? form.niche.join(', ') : form.niche], ['Compensation', form.dealType === 'barter' ? 'Pure Barter' : form.dealType === 'hybrid' ? 'Paid + Barter' : 'Paid Cash'], ['Budget', `₹${(+form.budget || 0).toLocaleString('en-IN')}`], ['Slots', form.totalSlots], ['Platforms', form.platforms.join(', ')], ['Deadline', form.deadline]].map(([k, v]) => (
                  <div key={k} style={{ fontSize: 12 }}><span style={{ color: 'var(--t2)' }}>{k}: </span><span style={{ color: 'var(--t1)', fontWeight: 600 }}>{v || '—'}</span></div>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 18px', background: 'rgba(124,139,90,0.08)', border: '1px solid rgba(124,139,90,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--acc2)', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={14} style={{ color: 'var(--acc2)' }} /> What happens next?</div>
              {['Admin team reviews your brief (4-6 hours)', 'AI analyzes 12,000+ creators for best match', 'Top creators are bulk-assigned to your campaign', 'Creators notified and begin creating content', 'Real-time progress tracked in your dashboard'].map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 5, display: 'flex', gap: 8 }}><span style={{ color: 'var(--acc2)', flexShrink: 0 }}>{i + 1}.</span>{s}</div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>You will never need to contact creators directly. Our platform manages everything end-to-end.</p>
          </div>
        )}

        {/* Nav */}
        <div className="flex-between" style={{ paddingTop: 6 }}>
          <Btn variant="ghost" onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={13} /> {step === 0 ? 'Cancel' : 'Back'}</Btn>
          {step < 3
            ? <Btn variant="primary" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>Next Step →</Btn>
            : <Btn variant="primary" onClick={handleSubmit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{saving ? 'Submitting…' : <><Plus size={14} /> Submit Campaign Brief</>}</Btn>
          }
        </div>
      </div>
    </div>
  );
}
