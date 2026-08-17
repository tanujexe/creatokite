import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api';
import { PageLoader, StatCard } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Megaphone, Activity, Trophy, Coins, Calendar, PieChart, TrendingUp } from 'lucide-react';

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ 
      background: 'var(--glass-sidebar)', 
      border: '1px solid var(--border)', 
      borderRadius: 10, 
      padding: '12px 16px', 
      fontSize: 12,
      boxShadow: 'var(--shadow-md)'
    }}>
      <p style={{ color: 'var(--t1)', fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: 'var(--p)', fontWeight: 750, margin: 0 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function BrandAnalytics() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.brand()
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  
  const s = data?.stats || {};

  return (
    <div className="page-enter brand-analytics" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
            Brand Analytics
          </h2>
          <p style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 500, marginTop: 4 }}>
            Aggregated metrics, niches breakdown, and budget allocation trends.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--fd)', zIndex: 1 }}>
          <Calendar size={14} style={{ color: 'var(--p)' }} />
          <span>Real-time Sync</span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid-4">
        <StatCard label="Total Campaigns" value={s.totalCampaigns || 0}    icon={Megaphone}   color="var(--p2)" />
        <StatCard label="Active Campaigns" value={s.active || 0}            icon={Activity}    color="var(--acc2)" />
        <StatCard label="Completed Campaigns" value={s.completed || 0}      icon={Trophy}      color="var(--gold)" />
        <StatCard label="Total Spent"     value={s.totalSpent ? `₹${(s.totalSpent/1000).toFixed(0)}K` : '₹0'} icon={Coins} color="var(--acc)" />
      </div>

      {/* Charts Grid */}
      <div className="dashboard-grid">
        {/* Bar Chart Panel */}
        {data?.trend?.length > 0 ? (
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <TrendingUp size={16} style={{ color: 'var(--p)' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Campaign Activity</h3>
            </div>
            <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: -14, marginBottom: 20 }}>Monthly campaign deployment trend</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.trend}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--p)" stopOpacity={0.95}/>
                    <stop offset="100%" stopColor="var(--p2)" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--t2)', fontFamily: 'var(--fd)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--t2)', fontFamily: 'var(--fd)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="campaigns" fill="url(#barGrad)" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="card" style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>No monthly campaign data available yet.</span>
          </div>
        )}

        {/* Niche Distribution Panel */}
        {data?.nicheBreakdown?.length > 0 ? (
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <PieChart size={16} style={{ color: 'var(--gold)' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Niche Distribution</h3>
            </div>
            <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: -14, marginBottom: 20 }}>Campaign volume split by niche focus</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.nicheBreakdown.slice(0, 6).map((n) => {
                const maxVal = data.nicheBreakdown[0]?.count || 1;
                const percent = Math.round((n.count / maxVal) * 100);
                return (
                  <div key={n.niche}>
                    <div className="flex-between" style={{ marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{n.niche}</span>
                      <span style={{ color: 'var(--p2)', fontWeight: 700, fontFamily: 'var(--fd)' }}>{n.count} {n.count === 1 ? 'campaign' : 'campaigns'}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                      <div className="progress-bar" style={{ width: `${percent}%`, height: '100%', borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>No niche breakdown data available yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
