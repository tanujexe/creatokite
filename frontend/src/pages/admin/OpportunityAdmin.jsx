import { useState, useEffect } from 'react';
import { Modal, PageLoader, EmptyState } from '../../components/ui';
import { Plus, Edit2, Trash2, ExternalLink, Zap } from 'lucide-react';
import api from '../../api';

const CATEGORIES = [
  { value: 'ugc_hiring', label: 'UGC Hiring' },
  { value: 'campus_ambassador', label: 'Campus Ambassador' },
  { value: 'product_seeding', label: 'Product Seeding' },
  { value: 'affiliate', label: 'Affiliate Program' },
  { value: 'event', label: 'Event Registration' },
  { value: 'survey', label: 'Survey' },
  { value: 'creator_hunt', label: 'Creator Hunt' },
];

export default function OpportunityAdmin() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    banner: '',
    brandName: '',
    category: 'ugc_hiring',
    reward: '',
    requiresAdsRights: false,
    deadline: '',
    applicationLink: '',
    status: 'published'
  });

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/opportunities/admin');
      if (res.data?.success) {
        setOpportunities(res.data.opportunities || []);
      }
    } catch (e) {
      console.error('Error fetching admin opportunities:', e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (opp = null) => {
    if (opp) {
      setEditingId(opp._id);
      setForm({
        title: opp.title || '',
        description: opp.description || '',
        banner: opp.banner || '',
        brandName: opp.brandName || '',
        category: opp.category || 'ugc_hiring',
        reward: opp.reward || '',
        requiresAdsRights: Boolean(opp.requiresAdsRights),
        deadline: opp.deadline ? opp.deadline.split('T')[0] : '',
        applicationLink: opp.applicationLink || '',
        status: opp.status || 'published'
      });
    } else {
      setEditingId(null);
      setForm({
        title: '',
        description: '',
        banner: '',
        brandName: '',
        category: 'ugc_hiring',
        reward: '',
        requiresAdsRights: false,
        deadline: '',
        applicationLink: '',
        status: 'published'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/opportunities/${editingId}`, form);
      } else {
        await api.post('/opportunities', form);
      }
      setIsModalOpen(false);
      fetchOpportunities();
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await api.delete(`/opportunities/${id}`);
      fetchOpportunities();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card flex-between" style={{ padding: '18px 24px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            <Zap size={13} /> Management
          </div>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 22, fontWeight: 800, color: 'var(--t1)' }}>
            Opportunities & Forms Hub
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 12, marginTop: 2 }}>
            Manage Google Forms, Typeforms, UGC hiring applications, and Seeding links for creators.
          </p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
          <Plus size={15} /> Publish Opportunity
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : opportunities.length === 0 ? (
        <EmptyState icon="⚡" title="No published opportunities yet" desc="Click 'Publish Opportunity' to create your first application link." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 18 }}>
          {opportunities.map((opp) => (
            <div key={opp._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: opp.status === 'published' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                    color: opp.status === 'published' ? 'var(--acc2)' : 'var(--t3)', textTransform: 'uppercase'
                  }}>
                    {opp.status}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 500 }}>
                    {opp.category}
                  </span>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--fd)' }}>{opp.title}</h3>
                {opp.brandName && (
                  <p style={{ fontSize: 11, color: 'var(--t3)' }}>Brand: {opp.brandName}</p>
                )}

                <div style={{ fontSize: 11, color: 'var(--t2)', paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {opp.reward && <p style={{ color: 'var(--gold)', fontWeight: 600 }}>Reward: {opp.reward}</p>}
                  {opp.deadline && <p>Deadline: {new Date(opp.deadline).toLocaleDateString()}</p>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <a
                  href={opp.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                >
                  View Link <ExternalLink size={12} />
                </a>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => openModal(opp)}
                    className="btn btn-ghost btn-icon"
                    style={{ padding: 4 }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(opp._id)}
                    className="btn btn-ghost btn-icon"
                    style={{ padding: 4, color: 'var(--rose)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Opportunity' : 'Publish New Opportunity'} maxWidth={500}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="form-input"
              placeholder="e.g. UGC Creator Hiring for Skincare Brand"
            />
          </div>

          <div className="grid-2" style={{ gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Brand Name (Optional)</label>
              <input
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                className="form-input"
                placeholder="e.g. GlowCo"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="form-input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Application Link (Google Form / Typeform) *</label>
            <input
              required
              type="url"
              value={form.applicationLink}
              onChange={(e) => setForm({ ...form, applicationLink: e.target.value })}
              className="form-input"
              placeholder="https://forms.google.com/..."
            />
          </div>

          <div className="grid-2" style={{ gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Reward / Compensation</label>
              <input
                value={form.reward}
                onChange={(e) => setForm({ ...form, reward: e.target.value })}
                className="form-input"
                placeholder="e.g. $200 per Reel + Free Gift"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Banner Image URL</label>
            <input
              value={form.banner}
              onChange={(e) => setForm({ ...form, banner: e.target.value })}
              className="form-input"
              placeholder="https://..."
            />
          </div>

          <div className="form-group" style={{ margin: '8px 0' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: form.requiresAdsRights ? 'rgba(230, 95, 43, 0.08)' : 'var(--s2)',
                border: form.requiresAdsRights ? '1px solid rgba(230, 95, 43, 0.3)' : '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={form.requiresAdsRights}
                onChange={(e) => setForm({ ...form, requiresAdsRights: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#E65F2B', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>
                ⚡ Ready for Usage Rights / Ad Rights (Whitelisting) Included
              </span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input form-textarea"
              style={{ minHeight: 70 }}
              placeholder="Details about requirements..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="form-input"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Save Opportunity</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
