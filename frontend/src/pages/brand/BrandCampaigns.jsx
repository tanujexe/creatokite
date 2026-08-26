// BrandCampaigns.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsAPI } from '../../api';
import { PageLoader, StatusBadge, WorkflowPipeline, Btn, EmptyState } from '../../components/ui';
import { Plus, Eye, ClipboardList } from 'lucide-react';

export default function BrandCampaigns() {
  const nav = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    campaignsAPI.brandCampaigns()
      .then(d => setCampaigns(d.campaigns || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  
  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => (c.workflowStatus || c.status) === filter);

  return (
    <div className="page-enter brand-campaigns" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div className="card" style={{ 
        padding: '24px 28px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 16,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow backdrop accent */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 150, height: 150,
          background: 'radial-gradient(circle, rgba(255,107,87,0.12) 0%, transparent 70%)',
          filter: 'blur(30px)', pointerEvents: 'none'
        }} />
        <div>
          <h2 className="brand-title" style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--t1)' }}>
            My Campaigns
          </h2>
          <p style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 500, marginTop: 4 }}>
            {campaigns.length} total campaigns submitted
          </p>
        </div>
        <button
          onClick={() => nav('/brand/campaigns/create')}
          className="tactile-btn-new-campaign"
        >
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {[['all', 'All'], ['brand_submitted', 'Pending'], ['creators_assigned', 'Assigned'], ['in_progress', 'Active'], ['completed', 'Done'], ['cancelled', 'Cancelled']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`chip${filter === k ? ' active' : ''}`} style={{ fontSize: 11 }}>{l}</button>
        ))}
      </div>

      {/* Campaigns list card container */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState icon={<ClipboardList size={32} style={{ color: 'var(--t3)', marginBottom: 8 }} />} title="No campaigns found" desc={filter === 'all' ? "Create your first campaign brief!" : "No campaigns matching this status."}
            action={filter === 'all' && <Btn variant="primary" onClick={() => nav('/brand/campaigns/create')}>Create Campaign</Btn>}
          />
        ) : (
          filtered.map((c, i) => (
            <div key={c._id} onClick={() => nav(`/brand/campaigns/${c._id}`)}
              style={{ padding: '18px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--t1)' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--t2)' }}>
                    {c.niche} · <span className="budget-value" style={{ color: 'var(--acc2)', fontWeight: 650 }}>₹{c.budget?.toLocaleString('en-IN')}</span> · {c.assignedCreators?.length || 0} creators · {c.daysLeft ?? '?'}d left
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={c.workflowStatus || c.status} />
                  <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); nav(`/brand/campaigns/${c._id}`); }}><Eye size={12} /> View</Btn>
                </div>
              </div>
              <WorkflowPipeline status={c.workflowStatus || 'brand_submitted'} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
