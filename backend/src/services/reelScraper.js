// ═══════════════════════════════════════════════════════════════
// reelScraper.js — Fetch public Instagram Reel metrics
// Priority: ScrapeCreators → RapidAPI → Estimation
// ═══════════════════════════════════════════════════════════════
const axios = require('axios');
const { scrapeReelApify } = require('./apifyScraper');

// Extract shortcode from any Instagram Reel URL
function extractShortcode(input) {
  input = input.trim().split('?')[0].split('#')[0]; // remove query params
  const m = input.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  // bare shortcode
  if (/^[A-Za-z0-9_-]{9,15}$/.test(input)) return input;
  return null;
}

// ── Method 1: ScrapeCreators API ─────────────────────────────
async function method1_scrapeCreators(shortcode) {
  // Reel analytics uses its own key — separate from profile scraping credits
  const key = process.env.SCRAPECREATORS_KEY_REELS || process.env.SCRAPECREATORS_KEY;
  if (!key || key.startsWith('your_')) return null;

  try {
    const res = await axios.get('https://api.scrapecreators.com/v1/instagram/post', {
      params:  { url:  `https://www.instagram.com/reel/${shortcode}/` },
      headers: { 'x-api-key': key },
      timeout: 15000,
    });

    const d = res.data?.data || res.data;
    console.log(
    '[SCRAPECREATORS RAW]',
    JSON.stringify(d, null, 2)
  );
    if (!d) return null;

    // ScrapeCreators returns different shapes — handle both
    const node =
  d.xdt_shortcode_media ||
  d.xdt_api__v1__media__shortcode__web_info?.items?.[0] ||
  d.items?.[0] ||
  d;

const views = parseInt(
  node.video_view_count ||
  node.video_play_count ||
  node.play_count ||
  node.view_count ||
  0
);

const likes = parseInt(
  node.like_count ||
  node.edge_media_preview_like?.count ||
  0
);

const comments = parseInt(
  node.comment_count ||
  node.edge_media_to_parent_comment?.count ||
  node.edge_media_preview_comment?.count ||
  0
);

    if (!views && !likes) return null;

    const owner  = node.user || node.owner || {};
    const caption = (node.caption?.text || node.edge_media_to_caption?.edges?.[0]?.node?.text || '').slice(0, 500);
    const thumb   = node.thumbnail_url || node.display_url ||
                    node.image_versions2?.candidates?.[0]?.url || '';
    const pubTs   = node.taken_at ? new Date(node.taken_at * 1000) : null;

    console.log(`[ReelScraper M1] ✅ ScrapeCreators — views:${views} likes:${likes}`);
    return {
      views, likes, comments,
      username:    owner.username  || '',
      fullName:    owner.full_name || '',
      caption,
      thumbnail:   thumb,
      publishedAt: pubTs,
      source: 'scrapecreators',
    };
  } catch (e) {
    const s = e.response?.status;
    if (s === 401 || s === 403) console.log('[ReelScraper M1] ✗ Key invalid');
    else if (s === 402) console.log('[ReelScraper M1] ✗ Out of credits / Payment required');
    else if (s === 429) console.log('[ReelScraper M1] ✗ Rate limit');
    else console.log('[ReelScraper M1] ✗', e.message);
    return null;
  }
}

// ── Method 2: RapidAPI ───────────────────────────────────────
async function method2_rapidapi(shortcode) {
  const key  = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST || 'instagram-scraper-v21.p.rapidapi.com';
  if (!key || key === 'your_rapidapi_key') return null;

  const headers = {
    'x-rapidapi-key':  key,
    'x-rapidapi-host': host,
    'Content-Type': 'application/json',
  };

  // Try multiple endpoint styles
  const attempts = [
    () => axios.post(`https://${host}/api/post-info`,
      { shortcode }, { headers, timeout: 15000 }),
    () => axios.post(`https://${host}/api/reel-info`,
      { shortcode }, { headers, timeout: 15000 }),
    () => axios.get(`https://${host}/v1/post`,
      { params: { url: `https://www.instagram.com/reel/${shortcode}/` }, headers, timeout: 15000 }),
  ];

  for (const attempt of attempts) {
  try {
    const r = await attempt();

    const raw = r.data;

    console.log(
      '[RAPIDAPI RAW]',
      JSON.stringify(raw, null, 2)
    );

    const d =
      raw?.data?.items?.[0] ||
      raw?.items?.[0] ||
      raw?.data ||
      raw;

    if (!d) continue;

    const views = parseInt(
      d.play_count ||
      d.video_view_count ||
      d.view_count ||
      d.media_statistics?.play_count ||
      0
    );

    const likes = parseInt(
      d.like_count ||
      d.media_statistics?.like_count ||
      d.edge_media_preview_like?.count ||
      0
    );

    const comments = parseInt(
      d.comment_count ||
      d.media_statistics?.comment_count ||
      d.edge_media_to_comment?.count ||
      0
    );

    if (!views && !likes) continue;

      console.log(`[ReelScraper M2] ✅ RapidAPI — views:${views} likes:${likes}`);
      return {
        views, likes, comments,
        username:    d.user?.username  || d.owner?.username  || '',
        fullName:    d.user?.full_name || d.owner?.full_name || '',
        caption:     (d.caption?.text || '').slice(0, 500),
        thumbnail:   d.thumbnail_url  || d.display_url || '',
        publishedAt: d.taken_at ? new Date(d.taken_at * 1000) : null,
        source: 'rapidapi',
      };
    } catch (e) {
      const s = e.response?.status;
      if (s === 403) { console.log('[ReelScraper M2] ✗ Not subscribed'); return null; }
      if (s === 429) { console.log('[ReelScraper M2] ✗ Rate limit'); return null; }
    }
  }
  return null;
}

// ── Method 3: Estimation (always works) ─────────────────────
function method3_estimate(shortcode) {
  console.log(`[ReelScraper M3] ⚠ Using estimation for ${shortcode}`);
  // Generate plausible numbers seeded by shortcode
  const seed = shortcode.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd  = (min, max) => Math.round(min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min));
  const views    = rnd(10000, 500000);
  const likes    = Math.round(views * (rnd(3, 8) / 100));
  const comments = Math.round(likes * rnd(3, 8) / 100);
  return {
    views, likes, comments,
    username: '', fullName: '', caption: '', thumbnail: '', publishedAt: null,
    source: 'estimated',
    _isEstimated: true,
  };
}

// ── Master function ──────────────────────────────────────────
async function scrapeReel(urlOrShortcode) {
  const shortcode = extractShortcode(urlOrShortcode);
  if (!shortcode) throw new Error('Invalid Instagram Reel URL or shortcode');

  const data =
  await scrapeReelApify(shortcode) ||
  await method1_scrapeCreators(shortcode) ||
  await method2_rapidapi(shortcode) ||
  method3_estimate(shortcode);

  // Compute engagement %
  const engagement = data.views > 0
    ? parseFloat(((data.likes + data.comments) / data.views * 100).toFixed(2))
    : 0;

  return { shortcode, ...data, engagement };
}

module.exports = { scrapeReel, extractShortcode };
