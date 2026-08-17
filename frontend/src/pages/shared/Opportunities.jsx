import { useState, useEffect } from 'react';
import { PageLoader, EmptyState, Spinner } from '../../components/ui';
import { Search, ExternalLink, Calendar, Award, Briefcase, Sparkles } from 'lucide-react';
import api from '../../api';

const CATEGORY_LABELS = {
  ugc_hiring: 'UGC Hiring',
  campus_ambassador: 'Campus Ambassador',
  product_seeding: 'Product Seeding',
  affiliate: 'Affiliate Program',
  event: 'Event Registration',
  survey: 'Survey / Research',
  creator_hunt: 'Creator Hunt',
};

const CATEGORY_COLORS = {
  ugc_hiring: 'rgba(99,102,241,0.15)',
  campus_ambassador: 'rgba(59,130,246,0.15)',
  product_seeding: 'rgba(16,185,129,0.15)',
  affiliate: 'rgba(212,162,76,0.15)',
  event: 'rgba(236,72,153,0.15)',
  survey: 'rgba(6,182,212,0.15)',
  creator_hunt: 'rgba(245,158,11,0.15)',
};

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchOpportunities();
  }, [categoryFilter]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/opportunities', {
        params: { category: categoryFilter, search }
      });
      if (res.data?.success) {
        setOpportunities(res.data.opportunities || []);
      }
    } catch (e) {
      console.error('Failed to load opportunities:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOpportunities();
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(212,162,76,0.12), rgba(99,102,241,0.12))',
        border: '1px solid rgba(212,162,76,0.25)',
        padding: '24px',
        borderRadius: 'var(--r-lg)',
      }}>
        <div style={{ maxWidth: 650 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 99,
            background: 'rgba(212,162,76,0.2)', color: 'var(--gold)',
            fontSize: 11, fontWeight: 700, marginBottom: 10
          }}>
            <Sparkles size={13} /> Open Applications & Form Links
          </div>
          <h1 style={{ fontFamily: 'var(--fc)', fontSize: 38, color: 'var(--t1)', marginBottom: 6, fontWeight: 'bold' }}>
            Creator Opportunities
          </h1>
          <p style={{ fontFamily: 'var(--fb)', color: 'var(--t2)', fontSize: 13.5, lineHeight: 1.6, fontWeight: 500 }}>
            Discover brand seeding applications, UGC creator roles, campus ambassador programs, and affiliate form links curated by CreatoKite.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <form onSubmit={handleSearchSubmit} style={{ width: '100%', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} size={16} />
          <input
            type="text"
            placeholder="Search opportunities, brands, rewards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: 40, fontSize: 13.5, height: 42, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)' }}
          />
        </form>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, width: '100%', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setCategoryFilter('')}
            style={{
              fontSize: 12, padding: '7px 16px', borderRadius: 10, whiteSpace: 'nowrap', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              background: categoryFilter === '' ? 'var(--acc)' : 'var(--s1)',
              color: categoryFilter === '' ? '#FFFFFF' : 'var(--t2)',
              border: categoryFilter === '' ? '1px solid var(--acc)' : '1px solid var(--border)',
              transition: 'all 0.15s ease',
            }}
          >
            All Types
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
            <button
              key={catKey}
              onClick={() => setCategoryFilter(catKey)}
              style={{
                fontSize: 12, padding: '7px 16px', borderRadius: 10, whiteSpace: 'nowrap', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                background: categoryFilter === catKey ? 'var(--acc)' : 'var(--s1)',
                color: categoryFilter === catKey ? '#FFFFFF' : 'var(--t2)',
                border: categoryFilter === catKey ? '1px solid var(--acc)' : '1px solid var(--border)',
                transition: 'all 0.15s ease',
              }}
            >
              {catLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <PageLoader />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="No opportunities found"
          desc="Check back soon! New ambassador programs, UGC forms, and brand seeding applications are added daily."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
          {opportunities.map((opp) => (
            <div key={opp._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {opp.banner && (
                  <div style={{ height: 140, borderRadius: 'var(--r)', overflow: 'hidden', background: '#000' }}>
                    <img src={opp.banner} alt={opp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                    background: CATEGORY_COLORS[opp.category] || 'rgba(255,255,255,0.08)',
                    color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: 0.4
                  }}>
                    {CATEGORY_LABELS[opp.category] || opp.category}
                  </span>
                  {opp.brandName && (
                    <span style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Briefcase size={12} /> {opp.brandName}
                    </span>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 4, fontFamily: 'var(--fd)' }}>
                    {opp.title}
                  </h3>
                  {opp.description && (
                    <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {opp.description}
                    </p>
                  )}
                </div>

                <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                  {opp.reward && (
                    <div style={{ color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={13} />
                      <span>Reward: {opp.reward}</span>
                    </div>
                  )}
                  {opp.deadline && (
                    <div style={{ color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} />
                      <span>Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <a
                  href={opp.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '8px 14px' }}
                >
                  <span>Apply Now</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
