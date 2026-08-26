import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('ck_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
}, err => Promise.reject(err));

let refreshing = false;
let queue = [];
const flush = (err, token) => { queue.forEach(p => err ? p.reject(err) : p.resolve(token)); queue = []; };

api.interceptors.response.use(r => r, async err => {
  const orig = err.config;
  if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !orig._retry) {
    if (refreshing) return new Promise((resolve, reject) => queue.push({ resolve, reject }))
      .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); });
    orig._retry = true; refreshing = true;
    try {
      const rt = localStorage.getItem('ck_refresh');
      const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken:rt }, { withCredentials:true });
      if (data.token)        localStorage.setItem('ck_token',   data.token);
      if (data.refreshToken) localStorage.setItem('ck_refresh', data.refreshToken);
      flush(null, data.token);
      orig.headers.Authorization = `Bearer ${data.token}`;
      return api(orig);
    } catch(e) {
      flush(e);
      localStorage.removeItem('ck_token'); localStorage.removeItem('ck_refresh');
      window.location.href = '/login';
      return Promise.reject(e);
    } finally { refreshing = false; }
  }
  return Promise.reject(err);
});

const unwrap = r => r.data;

export const authAPI = {
  register:       d  => api.post('/auth/register', d).then(unwrap),
  login:          d  => api.post('/auth/login', d).then(unwrap),
  logout:         () => api.post('/auth/logout').then(unwrap),
  refresh:        d  => api.post('/auth/refresh', d).then(unwrap),
  me:             () => api.get('/auth/me').then(unwrap),
  forgotPassword: d  => api.post('/auth/forgot-password', d).then(unwrap),
  resetPassword:  d  => api.post('/auth/reset-password', d).then(unwrap),
};

export const campaignsAPI = {
  list:          p       => api.get('/campaigns', { params:p }).then(unwrap),
  get:           id      => api.get(`/campaigns/${id}`).then(unwrap),
  create:        d       => api.post('/campaigns', d).then(unwrap),
  update:        (id,d)  => api.put(`/campaigns/${id}`, d).then(unwrap),
  brandCampaigns:()      => api.get('/campaigns/brand').then(unwrap),
  myAssigned:    ()      => api.get('/campaigns/my/assigned').then(unwrap),
  respond:       (id,r)  => api.put(`/campaigns/my/assigned/${id}/respond`, { response:r }).then(unwrap),
  submitWork:    (id,d)  => api.put(`/campaigns/my/assigned/${id}/submit`, d).then(unwrap),
};

export const adminAPI = {
  dashboard:           ()         => api.get('/admin/dashboard').then(unwrap),
  analytics:           ()         => api.get('/admin/analytics').then(unwrap),
  users:               p          => api.get('/admin/users', { params:p }).then(unwrap),
  getUser:             id         => api.get(`/admin/users/${id}`).then(unwrap),
  updateUser:          (id,d)     => api.put(`/admin/users/${id}`, d).then(unwrap),
  promoteUser:         (id,d)     => api.post(`/admin/users/${id}/promote`, d).then(unwrap),
  viewAs:              id         => api.post(`/admin/users/${id}/view-as`).then(unwrap),
  recalcScore:         id         => api.post(`/admin/users/${id}/recalculate`).then(unwrap),
  campaigns:           p          => api.get('/admin/campaigns', { params:p }).then(unwrap),
  getCampaign:         id         => api.get(`/admin/campaigns/${id}`).then(unwrap),
  pendingCampaigns:    ()         => api.get('/admin/campaigns/pending').then(unwrap),
  updateCampaign:      (id,d)     => api.put(`/admin/campaigns/${id}`, d).then(unwrap),
  analyzeAI:           id         => api.post(`/admin/campaigns/${id}/analyze`).then(unwrap),
  assignCreators:      (id,d)     => api.post(`/admin/campaigns/${id}/assign`, d).then(unwrap),
  removeCreator:       (id,cid)   => api.delete(`/admin/campaigns/${id}/assign/${cid}`).then(unwrap),
  updateAssignment:    (id,c,d)   => api.put(`/admin/campaigns/${id}/assign/${c}`, d).then(unwrap),
  campaignHealth:      id         => api.get(`/admin/campaigns/${id}/health`).then(unwrap),
  broadcast:           d          => api.post('/admin/broadcast', d).then(unwrap),
  transactions:        p          => api.get('/admin/transactions', { params:p }).then(unwrap),
  creatorsPending:     p          => api.get('/admin/creators/pending', { params:p }).then(unwrap),
  creatorsAll:         p          => api.get('/admin/creators/all', { params:p }).then(unwrap),
  creatorsStats:       ()         => api.get('/admin/creators/stats').then(unwrap),
  creatorsForAssign:   p          => api.get('/admin/creators/for-assignment', { params:p }).then(unwrap),
  creatorApprove:      (id,d)     => api.patch(`/admin/creators/${id}/approve`, d).then(unwrap),
  creatorReject:       (id,d)     => api.patch(`/admin/creators/${id}/reject`, d).then(unwrap),
  leaderboard:         p          => api.get('/admin/leaderboard', { params:p }).then(unwrap),
  creatorIntelligence: ()         => api.get('/admin/creator-intelligence').then(unwrap),
  topPerformers:       p          => api.get('/admin/creators/top-performers', { params:p }).then(unwrap),
  teamMembers:         ()         => api.get('/admin/team-members').then(unwrap),
  reels:               p          => api.get('/admin/reels', { params:p }).then(unwrap),
  reelStats:           ()         => api.get('/admin/reels/stats').then(unwrap),
  syncSocial:          id         => api.post(`/admin/users/${id}/sync-social`).then(unwrap),
  bulkSyncSocial:      ()         => api.post('/admin/users/bulk-sync-social').then(unwrap),
  notificationStats:   ()         => api.get('/admin/notifications/stats').then(unwrap),
};

export const usersAPI = {
  profile:          ()     => api.get('/users/profile').then(unwrap),
  updateProfile:    d      => api.put('/users/profile', d).then(unwrap),
  deleteAccount:    ()     => api.delete('/users/profile').then(unwrap),
  publicProfile:    handle => api.get(`/users/${handle}`).then(unwrap),
  leaderboard:      p      => api.get('/users/leaderboard', { params:p }).then(unwrap),
  creators:         p      => api.get('/users/creators', { params:p }).then(unwrap),
  notifications:    ()     => api.get('/users/notifications/all').then(unwrap),
  readNotifs:       ()     => api.put('/users/notifications/read').then(unwrap),
  deleteNotif:      id     => api.delete(`/users/notifications/${id}`).then(unwrap),
  clearAllNotifs:   ()     => api.delete('/users/notifications').then(unwrap),
};

export const analyticsAPI = {
  brand:             () => api.get('/analytics/brand').then(unwrap),
  creator:           () => api.get('/analytics/creator').then(unwrap),
  connectSocial:     d  => api.post('/analytics/creator/connect', d).then(unwrap),
  creatorCAS:        () => api.get('/analytics/creator/cas').then(unwrap),
  requestReanalysis: () => api.post('/analytics/creator/request-reanalysis').then(unwrap),
  analyzeCreator:    d  => api.post('/analytics/analyze', d).then(unwrap),
  registeredCreators:p  => api.get('/analytics/analyze/registered', { params:p }).then(unwrap),
};

export const reelsAPI = {
  track:            d   => api.post('/reels/track', d).then(unwrap),
  list:             p   => api.get('/reels', { params:p }).then(unwrap),
  stats:            ()  => api.get('/reels/stats').then(unwrap),
  get:              id  => api.get(`/reels/${id}`).then(unwrap),
  refresh:          id  => api.post(`/reels/${id}/refresh`).then(unwrap),
  delete:           id  => api.delete(`/reels/${id}`).then(unwrap),
  bulkDelete:       ids => api.delete('/reels', { data:{ ids } }).then(unwrap),
  getCampaignReels: id  => api.get(`/reels/campaign/${id}`).then(unwrap),
};

export const ecosystemAPI = {
  getActivities:         p       => api.get('/ecosystem/activities', { params:p }).then(unwrap),
  submitActivity:        (id,d)  => api.post(`/ecosystem/activities/${id}/submit`, d).then(unwrap),
  getSubmissions:        ()      => api.get('/ecosystem/submissions').then(unwrap),
  getLessons:            ()      => api.get('/ecosystem/academy/lessons').then(unwrap),
  completeLesson:        (id,d)  => api.post(`/ecosystem/academy/lessons/${id}/complete`, d).then(unwrap),
  getPosts:              p       => api.get('/ecosystem/community/posts', { params:p }).then(unwrap),
  createPost:            d       => api.post('/ecosystem/community/posts', d).then(unwrap),
  likePost:              id      => api.post(`/ecosystem/community/posts/${id}/like`).then(unwrap),
  votePoll:              (id,d)  => api.post(`/ecosystem/community/posts/${id}/vote`, d).then(unwrap),
  getComments:           id      => api.get(`/ecosystem/community/posts/${id}/comments`).then(unwrap),
  addComment:            (id,d)  => api.post(`/ecosystem/community/posts/${id}/comments`, d).then(unwrap),
  getAdminPosts:         p       => api.get('/ecosystem/community/admin-posts', { params:p }).then(unwrap),
  deletePost:            id      => api.delete(`/ecosystem/community/posts/${id}`).then(unwrap),
  pinPost:               id      => api.patch(`/ecosystem/community/posts/${id}/pin`).then(unwrap),
  announcePost:          id      => api.patch(`/ecosystem/community/posts/${id}/announce`).then(unwrap),
  deleteComment:         id      => api.delete(`/ecosystem/community/comments/${id}`).then(unwrap),
  getCommunityAnalytics: ()      => api.get('/ecosystem/community/analytics').then(unwrap),
  getLeaderboards:       p       => api.get('/ecosystem/leaderboards', { params:p }).then(unwrap),
  getHallOfFame:         ()      => api.get('/ecosystem/hall-of-fame').then(unwrap),
  getShopItems:          ()      => api.get('/ecosystem/coins/shop').then(unwrap),
  purchaseItem:          d       => api.post('/ecosystem/coins/purchase', d).then(unwrap),
  getRecommendations:    ()      => api.get('/ecosystem/recommendations').then(unwrap),
  getReferrals:          ()      => api.get('/ecosystem/referrals').then(unwrap),
  redeemReferral:        d       => api.post('/ecosystem/referrals/redeem', d).then(unwrap),
  getPendingSubmissions: ()      => api.get('/ecosystem/admin/submissions').then(unwrap),
  reviewSubmission:      (id,d)  => api.post(`/ecosystem/admin/submissions/${id}/review`, d).then(unwrap),
  superadminOverride:    d       => api.post('/ecosystem/admin/overrides', d).then(unwrap),
  getSystemLogs:         ()      => api.get('/ecosystem/admin/system-logs').then(unwrap),
  getPlatformRevenue:    ()      => api.get('/ecosystem/admin/revenue').then(unwrap),
  createActivity:        d       => api.post('/ecosystem/admin/activities', d).then(unwrap),
  updateActivity:        (id,d)  => api.put(`/ecosystem/admin/activities/${id}`, d).then(unwrap),
  deleteActivity:        id      => api.delete(`/ecosystem/admin/activities/${id}`).then(unwrap),
};

export const tasksAPI = {
  list:          p        => api.get('/tasks', { params:p }).then(unwrap),
  get:           id       => api.get(`/tasks/${id}`).then(unwrap),
  create:        d        => api.post('/tasks', d).then(unwrap),
  update:        (id,d)   => api.put(`/tasks/${id}`, d).then(unwrap),
  delete:        id       => api.delete(`/tasks/${id}`).then(unwrap),
  comment:       (id,d)   => api.post(`/tasks/${id}/comment`, d).then(unwrap),
  toggleSubtask: (id,s,d) => api.patch(`/tasks/${id}/subtask/${s}`, d).then(unwrap),
  myStats:       ()       => api.get('/tasks/stats/me').then(unwrap),
};

export const roomsAPI = {
  list:            ()       => api.get('/rooms').then(unwrap),
  listAll:         ()       => api.get('/rooms/all').then(unwrap),
  get:             id       => api.get(`/rooms/${id}`).then(unwrap),
  messages:        (id,p)   => api.get(`/rooms/${id}/messages`, { params:p }).then(unwrap),
  send:            (id,d)   => api.post(`/rooms/${id}/messages`, d).then(unwrap),
  submit:          (id,d)   => api.post(`/rooms/${id}/submit`, d).then(unwrap),
  reviewSubmission:(id,creatorId,action,d) => api.patch(`/rooms/${id}/submission/${creatorId}/${action}`, d).then(unwrap),
  deliverables:    id       => api.get(`/rooms/${id}/deliverables`).then(unwrap),
  create:          d        => api.post('/rooms', d).then(unwrap),
  addMember:       (id,d)   => api.post(`/rooms/${id}/members`, d).then(unwrap),
};

export const workspaceAPI = {
  feed:              p  => api.get('/workspace/feed', { params:p }).then(unwrap),
  myDMReports:       p  => api.get('/workspace/dm-reports', { params:p }).then(unwrap),
  allDMReports:      () => api.get('/workspace/dm-reports/all').then(unwrap),
  submitDMReport:    d  => api.post('/workspace/dm-reports', d).then(unwrap),
  team:              () => api.get('/workspace/team').then(unwrap),
  assignedCampaigns: () => api.get('/workspace/assigned-campaigns').then(unwrap),
  stats:             () => api.get('/workspace/stats').then(unwrap),
};

export const crmAPI = {
  creators:       p       => api.get('/crm/creators', { params:p }).then(unwrap),
  updateCreator:  (id,d)  => api.put(`/crm/creators/${id}`, d).then(unwrap),
  brands:         p       => api.get('/crm/brands', { params:p }).then(unwrap),
  updateBrand:    (id,d)  => api.put(`/crm/brands/${id}`, d).then(unwrap),
  followups:      ()      => api.get('/crm/followups').then(unwrap),
  markFollowDone: id      => api.patch(`/crm/followups/${id}/done`).then(unwrap),
  getNotes:       userId  => api.get(`/crm/notes/${userId}`).then(unwrap),
  addNote:        d       => api.post('/crm/notes', d).then(unwrap),
  deleteNote:     id      => api.delete(`/crm/notes/${id}`).then(unwrap),
  stats:          ()      => api.get('/crm/stats').then(unwrap),
  saveFilter:     d       => api.post('/crm/saved-filters', d).then(unwrap),
  deleteFilter:   id      => api.delete(`/crm/saved-filters/${id}`).then(unwrap),
};

export const searchAPI = {
  query: (q, type) => api.get('/search', { params:{ q, type } }).then(unwrap),
};

export const auditAPI = {
  list:  p  => api.get('/audit', { params:p }).then(unwrap),
  stats: () => api.get('/audit/stats').then(unwrap),
};

export const revenueAPI = {
  overview: () => api.get('/revenue').then(unwrap),
  metrics:  () => api.get('/revenue/metrics').then(unwrap),
};

export const knowledgeAPI = {
  list:   p      => api.get('/knowledge', { params:p }).then(unwrap),
  get:    id     => api.get(`/knowledge/${id}`).then(unwrap),
  create: d      => api.post('/knowledge', d).then(unwrap),
  update: (id,d) => api.put(`/knowledge/${id}`, d).then(unwrap),
  delete: id     => api.delete(`/knowledge/${id}`).then(unwrap),
};

export const exportAPI = {
  download: (type, format='json') => api.get(`/export/${type}`, { params:{ format }, responseType: format==='csv'?'blob':'json' }).then(r => r),
};

export const teamManagementAPI = {
  getMembers:     ()      => api.get('/admin/team-management/members').then(unwrap),
  getMember:      id      => api.get(`/admin/team-management/members/${id}`).then(unwrap),
  getTasks:       p       => api.get('/admin/team-management/tasks', { params: p }).then(unwrap),
  createTask:     d       => api.post('/admin/team-management/tasks', d).then(unwrap),
  updateTask:     (id, d) => api.put(`/admin/team-management/tasks/${id}`, d).then(unwrap),
  deleteTask:     id      => api.delete(`/admin/team-management/tasks/${id}`).then(unwrap),
  getActivity:    p       => api.get('/admin/team-management/activity', { params: p }).then(unwrap),
  getAnalytics:   ()      => api.get('/admin/team-management/analytics').then(unwrap),
};

export const opportunitiesAPI = {
  list:   p      => api.get('/opportunities', { params:p }).then(unwrap),
  admin:  ()     => api.get('/opportunities/admin').then(unwrap),
  create: d      => api.post('/opportunities', d).then(unwrap),
  update: (id,d) => api.put(`/opportunities/${id}`, d).then(unwrap),
  delete: id     => api.delete(`/opportunities/${id}`).then(unwrap),
};

export default api;
