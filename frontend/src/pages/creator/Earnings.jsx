import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api';
import { PageLoader } from '../../components/ui';
import { Wallet, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import CreatorShell from './CreatorShell';

const formatStatCurrency = (val = 0) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) {
    const k = val / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `₹${val}`;
};

const CustomStatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div style={{
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border)',
    borderRadius: 16,
    padding: '20px 20px 18px',
    boxShadow: 'var(--glass-shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.24s ease, box-shadow 0.24s ease',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.borderColor = `${color}40`;
    e.currentTarget.style.boxShadow = `0 12px 30px ${color}10, var(--glass-shadow)`;
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.borderColor = 'var(--glass-border)';
    e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
  }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, letterSpacing: 0.3 }}>{label}</span>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={color} />
      </div>
    </div>
    <div style={{
      fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
      fontSize: 26,
      fontWeight: 800,
      color: 'var(--t1)',
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
      fontFeatureSettings: '"tnum" on, "lnum" on',
    }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: -4, fontWeight: 500 }}>{sub}</div>}
  </div>
);

export default function Earnings() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.creator().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  const s = data?.stats || {};
  const campaigns = (data?.campaigns || []).filter(c => c.assignment?.paymentAlloc > 0);

  return (
    <CreatorShell style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontFamily:"var(--fh)", fontWeight:800, fontSize:32, letterSpacing: '-0.02em', color: 'var(--t1)', marginBottom:4 }}>Earnings</h2>
        <p style={{ color:'var(--t2)', fontSize:13, fontWeight: 500 }}>Track your campaign income. Payments are released after admin approves your content.</p>
      </div>

      <div className="grid-4">
        <CustomStatCard label="Total Earned"   value={formatStatCurrency(s.earned)}  icon={Wallet}       color="var(--gold)"  />
        <CustomStatCard label="Campaigns Done" value={s.completed||0}                            icon={CheckCircle}  color="var(--acc2)"  />
        <CustomStatCard label="Pending"        value={formatStatCurrency(s.pending)}   icon={Clock}        color="var(--gold)"  sub="Awaiting approval" />
        <CustomStatCard label="Success Rate"   value={`${s.successRate||100}%`}                  icon={TrendingUp}   color="var(--acc)"   />
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden', borderRadius:20 }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:800, fontFamily: 'var(--fh)' }}>Payment History</div>
        {campaigns.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--t2)', fontSize:13, fontWeight: 500 }}>
            No earnings yet. Accept campaign assignments and submit content to start earning!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {campaigns.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: i < campaigns.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 107, 87, 0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)', fontFamily: 'var(--fh)' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, display: 'flex', gap: 6 }}>
                    <span className="badge badge-purple" style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4 }}>{c.niche}</span>
                    <span>•</span>
                    <span>Completed {c.assignment?.completedAt ? new Date(c.assignment.completedAt).toLocaleDateString('en-IN') : '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span className={`badge ${['approved','completed'].includes(c.assignment?.status) ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                    {c.assignment?.status || '—'}
                  </span>
                  <span style={{ color:'var(--acc2)', fontWeight:800, fontFamily: 'var(--fd)', fontSize: 14 }}>
                    ₹{(c.assignment?.paymentAlloc || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CreatorShell>
  );
}
