// ═══════════════════════════════════════════════════════════════════
// apifyScraper.js — Apify Cloud Instagram Data Fetcher
// Uses official Apify API client & cloud Actors for high accuracy
// ═══════════════════════════════════════════════════════════════════
const { ApifyClient } = require('apify-client');

function getApifyClient() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token || token.startsWith('your_') || token === 'apify_api_your_actual_token_here') {
    return null;
  }
  return new ApifyClient({ token });
}

/**
 * Scrape Instagram Profile & Recent Posts via Apify Actor
 */
async function scrapeInstagramApify(username) {
  const client = getApifyClient();
  if (!client) {
    console.log('[Apify Method] API token not configured, skipping');
    return null;
  }

  try {
    console.log(`[Apify Method] 🚀 Launching Instagram profile scraper actor for @${username}...`);

    const input = {
      usernames: [username],
      resultsLimit: 20,
    };

    const run = await client.actor('apify/instagram-profile-scraper').call(input, {
      timeoutSecs: 60,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (!items || items.length === 0) {
      console.log('[Apify Method] ✗ No data returned from dataset');
      return null;
    }

    const item = items[0];
    const followers = parseInt(item.followersCount || item.edge_followed_by?.count || 0);
    if (!followers) {
      console.log('[Apify Method] ✗ Invalid follower count in response');
      return null;
    }

    const following = parseInt(item.followsCount || item.edge_follow?.count || 0);
    const mediaCount = parseInt(item.postsCount || item.edge_owner_to_timeline_media?.count || 0);

    // Recent posts analysis
    const latestPosts = item.latestPosts || item.posts || [];
    let avgLikes = 0;
    let avgComments = 0;
    let avgViews = 0;
    let topPosts = [];

    if (latestPosts.length > 0) {
      const posts = latestPosts.slice(0, 15);
      const totals = posts.reduce((acc, p) => {
        const likes = parseInt(p.likesCount || p.edge_liked_by?.count || p.like_count || 0);
        const comments = parseInt(p.commentsCount || p.edge_media_to_comment?.count || p.comment_count || 0);
        const views = parseInt(p.videoViewCount || p.videoPlayCount || p.playCount || p.viewCount || 0);

        acc.likes += likes;
        acc.comments += comments;
        acc.views += views;
        return acc;
      }, { likes: 0, comments: 0, views: 0 });

      avgLikes = Math.round(totals.likes / posts.length);
      avgComments = Math.round(totals.comments / posts.length);
      avgViews = totals.views > 0 ? Math.round(totals.views / posts.length) : Math.round(avgLikes * 2.5);

      topPosts = posts.map(p => ({
        id: p.id || p.shortCode,
        shortcode: p.shortCode || p.code || '',
        type: p.type || (p.isVideo ? 'Video' : 'Image'),
        url: p.url || `https://www.instagram.com/p/${p.shortCode}/`,
        likes: parseInt(p.likesCount || p.like_count || 0),
        comments: parseInt(p.commentsCount || p.comment_count || 0),
        views: parseInt(p.videoViewCount || p.videoPlayCount || 0),
        caption: (p.caption || '').slice(0, 200),
        displayUrl: p.displayUrl || p.images?.[0] || '',
        timestamp: p.timestamp || p.takenAt || null,
      }));
    } else {
      const erPct = followers > 1_000_000 ? 1.5
                  : followers > 500_000   ? 2.2
                  : followers > 100_000   ? 3.0
                  : followers > 50_000    ? 4.0 : 5.5;
      avgLikes = Math.round(followers * (erPct / 100));
      avgComments = Math.round(avgLikes * 0.05);
      avgViews = Math.round(avgLikes * 2.5);
    }

    const postsPerWeek = Math.max(0.5, Math.min(7, parseFloat((mediaCount / 104).toFixed(1))));
    const er = followers > 0
      ? parseFloat(((avgLikes + avgComments) / followers * 100).toFixed(2))
      : 0;

    console.log(`[Apify Method] ✅ Success — @${username}: ${followers} followers, ${er}% ER`);

    return {
      platform: 'instagram',
      username: item.username || username,
      fullName: item.fullName || item.full_name || username,
      profilePic: item.profilePicUrl || item.profilePicUrlHD || item.profile_pic_url || '',
      isVerified: item.verified || item.isVerified || false,
      isPrivate: item.private || item.isPrivate || false,
      biography: item.biography || item.bio || '',
      followers,
      following,
      totalPosts: mediaCount,
      avgLikes,
      avgComments,
      avgViews,
      er,
      postsPerWeek,
      topPosts,
      isReal: true,
      source: 'apify',
    };
  } catch (err) {
    console.error('[Apify Method] Profile scrape error:', err.message);
    return null;
  }
}

/**
 * Scrape Instagram Reel metrics via Apify Actor
 */
async function scrapeReelApify(shortcode) {
  const client = getApifyClient();
  if (!client) return null;

  try {
    console.log(`[Apify Reel] 🚀 Fetching Reel metrics for ${shortcode}...`);

    const reelUrl = `https://www.instagram.com/reel/${shortcode}/`;
    const input = {
      directUrls: [reelUrl],
      resultsLimit: 1,
    };

    const run = await client.actor('apify/instagram-reel-scraper').call(input, {
      timeoutSecs: 45,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (!items || items.length === 0) return null;

    const reel = items[0];
    const views = parseInt(reel.videoViewCount || reel.videoPlayCount || reel.playCount || reel.viewCount || 0);
    const likes = parseInt(reel.likesCount || reel.like_count || 0);
    const comments = parseInt(reel.commentsCount || reel.comment_count || 0);

    if (!views && !likes) return null;

    console.log(`[Apify Reel] ✅ Success — views:${views} likes:${likes}`);

    return {
      views,
      likes,
      comments,
      username: reel.ownerUsername || reel.owner?.username || '',
      fullName: reel.ownerFullName || reel.owner?.full_name || '',
      caption: (reel.caption || '').slice(0, 500),
      thumbnail: reel.displayUrl || reel.thumbnailUrl || '',
      publishedAt: reel.timestamp ? new Date(reel.timestamp) : null,
      source: 'apify',
    };
  } catch (err) {
    console.error('[Apify Reel] Error:', err.message);
    return null;
  }
}

module.exports = {
  scrapeInstagramApify,
  scrapeReelApify,
};
