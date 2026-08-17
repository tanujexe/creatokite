import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Download, Users, Wallet, CreditCard, BarChart2, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { revenueAPI, exportAPI } from '../../api';
import { StatCard, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

export default function RevenueDashboard() {
  const [data,    setData]    = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    Promise.all([revenueAPI.overview(), revenueAPI.metrics()])
      .then(([d, m]) => { setData(d); setMetrics(m.metrics); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (type, fmt = 'json') => {
    setExporting(type + fmt);
    try {
      const r = await exportAPI.download(type, fmt);
      if (fmt === 'csv') {
        const blob = new Blob([r.data], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a'); a.href = url; a.download = `${type}-export.csv`; a.click();
      } else {
        const json = JSON.stringify(r.data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a'); a.href = url; a.download = `${type}-export.json`; a.click();
      }
      toast.success(`${type} exported successfully`);
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting('');
    }
  };

  const fmtINR = v => `₹${(v || 0).toLocaleString('en-IN')}`;
  const ttStyle = { background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--t1)', padding: '10px 14px' };
  const monthly = (data?.monthly || []).map(m => ({ name: `${m._id?.month}/${String(m._id?.year).slice(2)}`, revenue: m.revenue || 0 })).reverse();
  const typeChart = Object.entries(data?.byType || {}).map(([t, v]) => ({ type: t.replace(/_/g, ' '), total: v.total || 0, count: v.count || 0 }));

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Header Banner */}
      <div 
        className="admin-header-banner card"
        style={{
          background: 'linear-gradient(135deg, rgba(230, 95, 43, 0.10), rgba(212, 162, 76, 0.05))',
          border: '1px solid rgba(230, 95, 43, 0.2)',
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
              background: 'rgba(230, 95, 43, 0.14)', color: 'var(--acc)',
              border: '1px solid rgba(230, 95, 43, 0.25)', textTransform: 'uppercase', letterSpacing: 0.6
            }}>
              💰 Financial Analytics
            </span>
          </div>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(18px, 3.5vw, 24px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.01em', margin: 0 }}>
            Platform <span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc)', fontSize: '1.2em' }}>Revenue & Payouts</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 12, margin: '2px 0 0 0', fontWeight: 500 }}>
            Platform earnings · Creator payout distributions · Commission revenues · Financial data exports
          </p>
        </div>

        {/* Data Export Toolbar */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', paddingBottom: 2, scrollbarWidth: 'none', maxWidth: '100%' }}>
          {[
            ['users', 'Users'],
            ['campaigns', 'Campaigns'],
            ['transactions', 'Transactions']
          ].map(([t, l]) => (
            <div key={t} style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                onClick={() => handleExport(t, 'json')}
                disabled={!!exporting}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '6px 10px', gap: 4, borderRadius: 8, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                <Download size={11} /> {l} JSON
              </button>
              <button
                onClick={() => handleExport(t, 'csv')}
                disabled={!!exporting}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '6px 10px', gap: 4, borderRadius: 8, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                <FileSpreadsheet size={11} /> CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stat Cards Overview Bar (2x2 Grid on Mobile/Tablet) */}
      <div className="grid-4" style={{ gap: 14 }}>
        <StatCard label="Total Platform Revenue" value={fmtINR(data?.totalRevenue)} icon={DollarSign} color="var(--acc2)" />
        <StatCard label="This Month Revenue" value={fmtINR(metrics?.thisMonth)} icon={TrendingUp} color="#60a5fa" />
        <StatCard label="Creator Payouts" value={fmtINR(metrics?.creatorPayouts)} icon={Wallet} color="#a78bfa" />
        <StatCard label="Pending Payouts" value={data?.pendingPayouts || 0} icon={CreditCard} color="var(--gold)" sub="Transactions" />
      </div>

      {/* Responsive Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Monthly Revenue Chart */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={16} style={{ color: 'var(--acc)' }} /> Monthly Revenue (₹)
            </h3>
            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>Real-time earnings</span>
          </div>

          {monthly.length === 0 ? (
            <EmptyState icon="📊" title="No Revenue Data Recorded" desc="Monthly revenue figures will populate as campaign transactions complete." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--t3)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--t3)' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={ttStyle} formatter={v => [fmtINR(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="var(--acc)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by Type Card */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={16} style={{ color: 'var(--acc2)' }} /> Revenue Breakdown by Type
            </h3>
            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>Category Distribution</span>
          </div>

          {typeChart.length === 0 ? (
            <EmptyState icon="💳" title="No Transaction Data" desc="Transaction category distributions will show up when payments process." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {typeChart.map((t, i) => (
                <div
                  key={t.type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    background: 'var(--s2)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: ['var(--p)', 'var(--acc)', 'var(--acc2)', '#6366f1', 'var(--gold)'][i % 5], flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', textTransform: 'capitalize' }}>{t.type}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{t.count} transaction{t.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>{fmtINR(t.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Campaigns Table */}
      {data?.topCampaigns?.length > 0 && (
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
            Top Campaigns by Budget Volume
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign Title</th>
                  <th>Brand Name</th>
                  <th>Total Budget</th>
                </tr>
              </thead>
              <tbody>
                {data.topCampaigns.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>{c.title}</td>
                    <td style={{ fontSize: 12, color: 'var(--t2)' }}>{c.brandName}</td>
                    <td style={{ fontWeight: 800, fontSize: 13, color: 'var(--acc)' }}>{fmtINR(c.budget)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
