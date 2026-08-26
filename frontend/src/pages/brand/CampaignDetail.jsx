import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignsAPI, reelsAPI } from '../../api';
import { PageLoader, StatusBadge, WorkflowPipeline, Avatar, Btn } from '../../components/ui';
import { ArrowLeft, ExternalLink, Play, Eye, Heart, MessageCircle, TrendingUp, Star, Bot } from 'lucide-react';

const fmt = n => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  if (n >= 1_000)     return (n/1_000).toFixed(1)+'K';
  return String(n);
};

export default function CampaignDetail() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [reels,   setReels]     = useState([]);
  const [reelSummary, setReelSummary] = useState(null);

  useEffect(() => {
    campaignsAPI.brandCampaigns()
      .then(d => { const c = (d.campaigns||[]).find(x=>x._id===id); setCampaign(c||null); })
      .catch(() => {}).finally(() => setLoading(false));

    // Load campaign reels
    reelsAPI.getCampaignReels(id)
      .then(d => { setReels(d.reels||[]); setReelSummary(d.summary||null); })
      .catch(() => {});
  }, [id]);

  if (loading)  return <PageLoader />;
  if (!campaign) return <div style={{padding:40,textAlign:'center',color:'var(--t2)'}}>Campaign not found. <button onClick={()=>nav(-1)} className="btn btn-ghost btn-sm">Go back</button></div>;

  const ws = campaign.workflowStatus || 'brand_submitted';

  return (
    <div className="page-enter" style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>
      <button className="btn btn-ghost btn-sm" onClick={()=>nav(-1)} style={{ alignSelf:'flex-start' }}><ArrowLeft size={13}/> Back</button>

      {/* Header */}
      <div className="card">
        <div className="flex-between" style={{ flexWrap:'wrap', gap:12, marginBottom:14 }}>
          <div>
            <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:6 }}>{campaign.title}</h2>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
              <span className="badge badge-purple">{campaign.niche}</span>
              {campaign.isPremium && <span className="badge badge-gold" style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Star size={9} /> Premium</span>}
              <StatusBadge status={ws} />
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:22, color:'var(--acc2)' }}>₹{campaign.budget?.toLocaleString('en-IN')}</div>
            <div style={{ fontSize:11, color:'var(--t3)' }}>{campaign.daysLeft} days left</div>
          </div>
        </div>
        <WorkflowPipeline status={ws} />
        {campaign.aiAnalysis?.strategyBrief && (
          <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(108,99,255,0.06)', border:'1px solid rgba(108,99,255,0.15)', borderRadius:8, fontSize:12, color:'var(--t2)', display:'flex', alignItems:'center', gap:6 }}>
            <Bot size={14} style={{ color:'var(--p2)' }}/> <span style={{ color:'var(--t2)' }}><strong style={{color:'var(--p2)'}}>AI Strategy:</strong> {campaign.aiAnalysis.strategyBrief}</span>
          </div>
        )}
      </div>

      {/* Reel Engagement Summary */}
      {reelSummary && reels.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <Play size={15} color="var(--p)"/> Campaign Reel Engagement
          </h3>
          {/* Summary Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }} className="rs-cols-4">
            {[
              { icon: Eye,           label:'Total Views',    value: fmt(reelSummary.totalViews),    color:'#60a5fa' },
              { icon: Heart,         label:'Total Likes',    value: fmt(reelSummary.totalLikes),    color:'#f472b6' },
              { icon: MessageCircle, label:'Total Comments', value: fmt(reelSummary.totalComments), color:'#a78bfa' },
              { icon: TrendingUp,    label:'Avg Engagement', value: `${reelSummary.avgEngagement}%`,color:'#34d399' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{
                background:'var(--bg)', border:'1px solid var(--border)',
                borderRadius:10, padding:'12px 14px', textAlign:'center',
              }}>
                <Icon size={14} color={color} style={{ marginBottom:6 }}/>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--t1)' }}>{value}</div>
                <div style={{ fontSize:10, color:'var(--t3)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Per Reel Table */}
          <div style={{ fontSize:11, color:'var(--t3)', marginBottom:8, fontWeight:600 }}>
            {reels.length} reel{reels.length > 1 ? 's' : ''} submitted by creators
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {reels.map(reel => (
              <div key={reel._id} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'10px 12px', background:'var(--bg)',
                border:'1px solid var(--border)', borderRadius:10,
              }}>
                {reel.thumbnail && (
                  <img src={reel.thumbnail} alt="" style={{ width:40, height:40, borderRadius:8, objectFit:'cover', flexShrink:0 }}
                    onError={e => e.target.style.display='none'}/>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)' }}>
                    @{reel.addedBy?.displayName || reel.username || 'Creator'}
                  </div>
                  <div style={{ fontSize:11, color:'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {reel.caption?.slice(0,60) || reel.shortcode}
                  </div>
                </div>
                <div style={{ display:'flex', gap:14, fontSize:12 }}>
                  <span style={{ color:'#60a5fa', fontWeight:700 }}>👁 {fmt(reel.views)}</span>
                  <span style={{ color:'#f472b6', fontWeight:700 }}>❤️ {fmt(reel.likes)}</span>
                  <span style={{ color:'#a78bfa', fontWeight:700 }}>💬 {fmt(reel.comments)}</span>
                  <span style={{ color:'#34d399', fontWeight:700 }}>{reel.engagement}%</span>
                </div>
                <a href={reel.url} target="_blank" rel="noreferrer"
                  style={{ color:'var(--t3)', flexShrink:0 }}>
                  <ExternalLink size={13}/>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap:16, alignItems:'start' }}>
        {/* Campaign info */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card">
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Campaign Details</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:12 }}>
              {[['Goal', campaign.campaignGoal],['Audience', campaign.targetAudience],['Budget Type', campaign.budgetType],
                ['Usage Rights / Ads', campaign.requiresAdsRights ? '⚡ Yes (Ad Rights / Whitelisting)' : 'No'],
                ['Slots', `${campaign.assignedCreators?.length||0} / ${campaign.totalSlots}`],
                ['Platforms', (campaign.platforms||[]).join(', ')],
                ['Deadline', new Date(campaign.deadline).toLocaleDateString('en-IN')],
                ['Min Followers', campaign.minFollowers?.toLocaleString('en-IN')]].map(([k,v])=>(
                <div key={k} className="flex-between">
                  <span style={{color:'var(--t3)'}}>{k}</span>
                  <span style={{color:'var(--t1)',fontWeight:500}}>{v||'—'}</span>
                </div>
              ))}
            </div>
          </div>
          {campaign.description && (
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Description</h3>
              <p style={{ fontSize:12, color:'var(--t2)', lineHeight:1.7 }}>{campaign.description}</p>
            </div>
          )}
          {campaign.contentGuidelines && (
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Content Guidelines</h3>
              <p style={{ fontSize:12, color:'var(--t2)', lineHeight:1.7, whiteSpace:'pre-line' }}>{campaign.contentGuidelines}</p>
            </div>
          )}
        </div>

        {/* Assigned creators */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:700 }}>
            Assigned Creators ({campaign.assignedCreators?.length||0})
          </div>
          {!campaign.assignedCreators?.length ? (
            <div style={{ padding:28, textAlign:'center', color:'var(--t2)', fontSize:12 }}>
              ⏳ Admin will assign creators after reviewing your brief.
            </div>
          ) : campaign.assignedCreators.map(a => (
            <div key={a._id} style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)' }}>
              <div className="flex-between" style={{ flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar src={a.creator?.avatar} name={a.creator?.displayName} size={34} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{a.creator?.displayName||'Creator'}</div>
                    <div style={{ fontSize:11, color:'var(--t2)' }}>{a.creator?.niche} · {a.creator?.rank}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <StatusBadge status={a.status} />
                  <div style={{ fontSize:11, color:'var(--acc2)', marginTop:4, fontWeight:600 }}>₹{(a.paymentAlloc||0).toLocaleString('en-IN')}</div>
                </div>
              </div>
              {a.submissionUrl && (
                <div style={{ marginTop:8, fontSize:11 }}>
                  📤 <a href={a.submissionUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color:'var(--acc)', textDecoration:'underline' }}>View Submission</a>
                </div>
              )}
              {a.status==='revision' && a.revisionNote && (
                <div style={{ marginTop:6, fontSize:11, color:'var(--rose)' }}>✏️ {a.revisionNote}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
