import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Pin, Eye, User, Tag, Sparkles, X, ChevronRight, ChevronDown } from 'lucide-react';
import { knowledgeAPI } from '../../api';
import { Modal, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CATS = ['general','sop','training','creator_outreach','brand_outreach','campaign_guide','internal'];
const CAT_LABELS = {
  general: 'General',
  sop: 'SOPs',
  training: 'Training',
  creator_outreach: 'Creator Outreach',
  brand_outreach: 'Brand Outreach',
  campaign_guide: 'Campaign Guide',
  internal: 'Internal'
};

const CAT_CLR = {
  sop: '#E65F2B',
  training: '#10B981',
  creator_outreach: '#3B82F6',
  brand_outreach: '#8B5CF6',
  campaign_guide: '#F59E0B',
  internal: '#EC4899',
  general: 'var(--t3)'
};

export default function KnowledgeBase() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin') || hasRole('superadmin') || hasRole('team_member');
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [showForm, setShowForm] = useState(false);
  const [reading,  setReading]  = useState(null);
  const [form, setForm] = useState({ title:'', content:'', category:'general', tags:'', visibility:'team_only', isPublished:true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, catFilter]);

  async function load() {
    setLoading(true);
    try {
      const d = await knowledgeAPI.list({ search: search || undefined, category: catFilter || undefined });
      setArticles(d.articles || []);
    } catch(e) {}
    finally { setLoading(false); }
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    try {
      await knowledgeAPI.create({ ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [], isPublished: true });
      toast.success('Article published successfully!'); setShowForm(false);
      setForm({ title:'', content:'', category:'general', tags:'', visibility:'team_only', isPublished: true });
      load();
    } catch(e) { toast.error('Failed to create article'); }
    finally { setSaving(false); }
  }

  async function openArticle(a) {
    setReading(a);
    await knowledgeAPI.get(a._id).then(d => setReading(d.article)).catch(() => {});
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Inter, sans-serif', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800,
            color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 12, margin: 0, letterSpacing: '-0.02em'
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, background: 'rgba(230,95,43,0.14)', color: 'var(--acc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BookOpen size={22} />
            </div>
            Knowledge Base
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13.5, margin: '4px 0 0 0', fontWeight: 500 }}>
            SOPs · Training docs · Outreach scripts · Internal guides
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 22px', borderRadius: 12,
              background: 'var(--acc)', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(230,95,43,0.3)', transition: 'all 0.2s'
            }}
          >
            <Plus size={16} /> New Article
          </button>
        )}
      </div>

      {/* Search & Category Filter Section */}
      <div style={{
        background: 'var(--s1)', padding: '14px 18px', borderRadius: 20, border: '1px solid var(--border)',
        boxShadow: 'var(--glass-shadow)', display: 'flex', gap: 12, alignItems: 'center'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search articles by title, tags or content…"
            style={{
              width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1px solid var(--border)',
              background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none', transition: 'all 0.2s'
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Dropdown Filter */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{
              padding: '11px 36px 11px 16px', borderRadius: 12, border: '1px solid var(--border)',
              background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', outline: 'none',
              appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none', minWidth: 160
            }}
          >
            <option value="" style={{ background: 'var(--s1)', color: 'var(--t1)' }}>All Categories</option>
            {CATS.map(c => (
              <option key={c} value={c} style={{ background: 'var(--s1)', color: 'var(--t1)' }}>{CAT_LABELS[c] || c}</option>
            ))}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t2)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 500 }}>Loading Knowledge Base articles…</p>
        </div>
      ) : articles.length === 0 ? (
        <div style={{ background: 'var(--s1)', borderRadius: 20, border: '1px solid var(--border)', padding: 48, textAlign: 'center' }}>
          <EmptyState icon={<BookOpen size={36} style={{ color: 'var(--acc)', marginBottom: 8 }} />} title="No articles found" desc="No guides or SOPs match your search query." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {articles.map(a => {
            const catColor = CAT_CLR[a.category] || 'var(--acc)';
            return (
              <div
                key={a._id}
                onClick={() => openArticle(a)}
                style={{
                  background: 'var(--s1)', borderRadius: 20, border: '1px solid var(--border)',
                  padding: 22, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', boxShadow: 'var(--glass-shadow)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = catColor;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 800,
                      background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}35`
                    }}>
                      {CAT_LABELS[a.category] || a.category?.replace('_', ' ')}
                    </span>
                    {a.isPinned && <Pin size={14} style={{ color: 'var(--acc)' }} />}
                  </div>

                  <h3 style={{
                    fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 8, lineHeight: 1.35,
                    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}>
                    {a.title}
                  </h3>

                  <p style={{
                    fontSize: 13, color: 'var(--t2)', marginBottom: 16, lineHeight: 1.55, fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                  }}>
                    {a.content?.replace(/[#*_`]/g, '')}
                  </p>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14,
                  borderTop: '1px solid var(--border)', fontSize: 11.5, color: 'var(--t3)', fontWeight: 600
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} /> {a.author?.displayName || 'CreatoKite Team'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> {a.viewCount || 0} views
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Read Article Modal */}
      <Modal open={!!reading} onClose={() => setReading(null)} title={reading?.title || 'Article Details'} maxWidth={640}>
        {reading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <span style={{
                fontSize: 11.5, padding: '4px 12px', borderRadius: 99, fontWeight: 800,
                background: `${CAT_CLR[reading.category] || 'var(--acc)'}18`,
                color: CAT_CLR[reading.category] || 'var(--acc)',
                border: `1px solid ${CAT_CLR[reading.category] || 'var(--acc)'}35`
              }}>
                {CAT_LABELS[reading.category] || reading.category?.replace('_', ' ')}
              </span>
              <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>
                Author: <strong style={{ color: 'var(--t1)' }}>{reading.author?.displayName || 'CreatoKite Team'}</strong> · {reading.viewCount || 0} views
              </span>
            </div>

            <div style={{
              fontSize: 14, color: 'var(--t1)', lineHeight: 1.8, maxHeight: 440, overflowY: 'auto',
              whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', paddingRight: 4
            }}>
              {reading.content}
            </div>

            {reading.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                {reading.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'var(--s2)',
                    border: '1px solid var(--border)', color: 'var(--t2)', fontWeight: 600
                  }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Article Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create New Knowledge Article" maxWidth={580}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Article Title *</label>
            <input
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Campaign Outreach Best Practices" required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Category</label>
              <select
                value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              >
                {CATS.map(c => <option key={c} value={c} style={{ background: 'var(--s1)', color: 'var(--t1)' }}>{CAT_LABELS[c] || c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Visibility</label>
              <select
                value={form.visibility} onChange={e => setForm(p => ({ ...p, visibility: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              >
                <option value="public" style={{ background: 'var(--s1)', color: 'var(--t1)' }}>Public (All Users)</option>
                <option value="creator" style={{ background: 'var(--s1)', color: 'var(--t1)' }}>Creators Only</option>
                <option value="brand" style={{ background: 'var(--s1)', color: 'var(--t1)' }}>Brands Only</option>
                <option value="team_only" style={{ background: 'var(--s1)', color: 'var(--t1)' }}>Team Only</option>
                <option value="admin_only" style={{ background: 'var(--s1)', color: 'var(--t1)' }}>Admin Only</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Article Content *</label>
            <textarea
              value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Write SOP instructions, training steps, or guide details..." required
              style={{ width: '100%', minHeight: 180, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Tags (comma separated)</label>
            <input
              value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="e.g. outreach, sop, instagram"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button" onClick={() => setShowForm(false)}
              style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--t2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--acc)', border: 'none', color: '#FFF', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(230,95,43,0.3)' }}
            >
              {saving ? 'Publishing…' : 'Publish Article'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
