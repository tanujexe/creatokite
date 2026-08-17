import { useState, useEffect } from 'react';
import { reelsAPI, adminAPI } from '../../api';
import { Play, Eye, Heart, MessageCircle, TrendingUp, RefreshCw, ExternalLink, Loader, Video, Sparkles, Filter, Megaphone, Film } from 'lucide-react';
import { StatCard, EmptyState, Avatar } from '../../components/ui';
import toast from 'react-hot-toast';

const fmt = n => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  if (n >= 1_000)     return (n/1_000).toFixed(1)+'K';
  return String(n);
};

export default function AdminReelAnalytics() {
  const [campaigns, setCampaigns]   = useState([]);
  const [selected,  setSelected]    = useState('');
  const [reels,     setReels]       = useState([]);
  const [summary,   setSummary]     = useState(null);
  const [loading,   setLoading]     = useState(false);
  const [camLoading,setCamLoading]  = useState(true);

  // Load all campaigns
  const loadCampaigns = async () => {
    setCamLoading(true);
    try {
      const d = await adminAPI.campaigns({ limit: 100 });
      setCampaigns(d.campaigns || []);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setCamLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Load reels when campaign selected
  const loadReels = async (campaignId) => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const d = await reelsAPI.getCampaignReels(campaignId);
      setReels(d.reels || []);
      setSummary(d.summary || null);
    } catch {
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id) => {
    setSelected(id);
    setReels([]);
    setSummary(null);
    if (id) loadReels(id);
  };

  const selectedCampaignObj = campaigns.find(c => c._id === selected);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Header Banner */}
      <div 
        className="admin-header-banner card"
        style={{
          background: 'linear-gradient(135deg, rgba(230, 95, 43, 0.12), rgba(212, 162, 76, 0.08))',
          border: '1px solid rgba(230, 95, 43, 0.25)',
          borderRadius: 20,
          padding: '24px clamp(20px, 4vw, 32px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
              background: 'rgba(230, 95, 43, 0.14)', color: 'var(--acc)',
              border: '1px solid rgba(230, 95, 43, 0.3)', textTransform: 'uppercase', letterSpacing: 0.8
            }}>
              🎬 Reel Insights & Analytics
            </span>
          </div>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(20px, 3.8vw, 26px)', fontWeight: 900, color: 'var(--t1)', margin: 0 }}>
            Creator Reel <span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc)', fontSize: '1.2em' }}>Analytics</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13.5, margin: '4px 0 0 0', fontWeight: 500 }}>
            Track real-time video performance, views, likes, and engagement metrics across creator campaigns.
          </p>
        </div>

        {selected && (
          <button
            onClick={() => loadReels(selected)}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6, padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Performance Data
          </button>
        )}
      </div>

      {/* Campaign Filter Selector Box */}
      <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone size={16} style={{ color: 'var(--acc)' }} /> Filter By Campaign
        </label>
        
        {camLoading ? (
          <div style={{ color: 'var(--t3)', fontSize: 13, padding: '10px 0' }}>Loading available campaigns...</div>
        ) : (
          <select
            value={selected}
            onChange={e => handleSelect(e.target.value)}
            className="form-input"
            style={{
              width: '100%',
              height: 44,
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '0 14px',
            }}
          >
            <option value="">— Select a campaign to view reel performance —</option>
            {campaigns.map(c => (
              <option key={c._id} value={c._id}>
                {c.title} ({c.workflowStatus?.replace('_', ' ')}) — {c.assignedCreators?.length || 0} creators assigned
              </option>
            ))}
          </select>
        )}

        {selectedCampaignObj && (
          <div style={{ fontSize: 12, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <span>Brand: <strong>{selectedCampaignObj.brand?.companyName || selectedCampaignObj.brand?.displayName || 'Brand'}</strong></span>
            <span>·</span>
            <span>Total Slots: <strong>{selectedCampaignObj.totalSlots || 1}</strong></span>
            <span>·</span>
            <span>Status: <strong style={{ textTransform: 'capitalize', color: 'var(--acc2)' }}>{selectedCampaignObj.workflowStatus?.replace('_', ' ')}</strong></span>
          </div>
        )}
      </div>

      {/* Loading Spinner State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 50, color: 'var(--t2)' }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 10, color: 'var(--acc)' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Fetching real-time video analytics...</div>
        </div>
      )}

      {/* Empty State when no reels exist */}
      {!loading && selected && reels.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <EmptyState
            icon="🎬"
            title="No Video Reels Found"
            desc="Creators assigned to this campaign have not submitted or published video reels yet."
          />
        </div>
      )}

      {/* Reel Summary Cards & Reel Performance Table */}
      {!loading && summary && reels.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Summary Stat Cards Bar */}
          <div className="grid-2-mobile" style={{ gap: 14 }}>
            <StatCard label="Total Reel Views" value={fmt(summary.totalViews)} icon={Eye} color="#60a5fa" />
            <StatCard label="Total Likes" value={fmt(summary.totalLikes)} icon={Heart} color="#f472b6" />
            <StatCard label="Total Comments" value={fmt(summary.totalComments)} icon={MessageCircle} color="#a78bfa" />
            <StatCard label="Avg Engagement" value={`${summary.avgEngagement}%`} icon={TrendingUp} color="#34d399" />
          </div>

          {/* Individual Reel List Table/Cards */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 800, color: 'var(--t1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Film size={18} style={{ color: 'var(--acc)' }} /> {reels.length} Submitted Reel{reels.length !== 1 ? 's' : ''}
              </span>
              <span className="badge badge-purple" style={{ fontSize: 10, fontWeight: 700 }}>
                Live Metrics
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {reels.map((reel, i) => (
                <div
                  key={reel._id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '16px 20px',
                    borderBottom: i < reels.length - 1 ? '1px solid var(--border)' : 'none',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Thumbnail + Creator Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 240px', minWidth: 0 }}>
                    {reel.thumbnail ? (
                      <img
                        src={reel.thumbnail}
                        alt=""
                        style={{ width: 54, height: 54, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: 54, height: 54, borderRadius: 12, background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                        <Play size={22} style={{ color: 'var(--acc)' }} />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 2 }}>
                        @{reel.addedBy?.displayName || reel.addedBy?.handle || reel.username || 'Creator'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reel.caption?.slice(0, 80) || reel.shortcode || 'Instagram Reel Submission'}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 3, fontWeight: 500 }}>
                        Source: {reel.dataSource || 'Instagram API'} {reel.dataSource === 'estimated' && ' ⚠️ Estimated'}
                      </div>
                    </div>
                  </div>

                  {/* Responsive Metrics Bar */}
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center', minWidth: 50 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa' }}>{fmt(reel.views)}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>Views</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 50 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f472b6' }}>{fmt(reel.likes)}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>Likes</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 50 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#a78bfa' }}>{fmt(reel.comments)}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>Comments</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 50 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>{reel.engagement || 0}%</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>Eng %</div>
                    </div>

                    {reel.url && (
                      <a
                        href={reel.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '8px 12px', gap: 4, borderRadius: 8, fontSize: 11, fontWeight: 700 }}
                      >
                        <ExternalLink size={13} /> View Reel
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}
