import { useState } from 'react';
import { Users, Briefcase, UserCheck, ShieldCheck, FileText } from 'lucide-react';
import CreatorCRM from './CreatorCRM';
import BrandCRM from './BrandCRM';
import TeamManagement from './TeamManagement';
import AdminCreatorApproval from './AdminCreatorApproval';
import AuditLogs from './AuditLogs';

export default function ManagementHub() {
  const [activeTab, setActiveTab] = useState('creators');

  const TABS = [
    { id: 'creators', label: 'Creators', icon: Users },
    { id: 'brands', label: 'Brands', icon: Briefcase },
    { id: 'team', label: 'Team Directory', icon: UserCheck },
    { id: 'verification', label: 'Verifications', icon: ShieldCheck },
    { id: 'reports', label: 'Reports & Audits', icon: FileText },
  ];

  return (
    <div className="page-enter">
      {/* Header & Tabs */}
      <div className="card" style={{ marginBottom:20, padding:'20px 24px' }}>
        <div>
          <h1 style={{ fontFamily:'var(--fd)', fontSize:'clamp(18px,4vw,24px)', fontWeight:800, color:'var(--t1)' }}>
            Management Center
          </h1>
          <p style={{ color:'var(--t2)', fontSize:13, marginTop:4, marginBottom:16 }}>
            Unified management for Creators, Brands, Team Members, Verification Tiers, and Platform Audit Reports.
          </p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--border)', paddingBottom:12, overflowX:'auto' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600,
                  whiteSpace:'nowrap', padding:'8px 16px', borderRadius:'var(--r)'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[500px]">
        {activeTab === 'creators' && <CreatorCRM />}
        {activeTab === 'brands' && <BrandCRM />}
        {activeTab === 'team' && <TeamManagement />}
        {activeTab === 'verification' && <AdminCreatorApproval />}
        {activeTab === 'reports' && <AuditLogs />}
      </div>
    </div>
  );
}
