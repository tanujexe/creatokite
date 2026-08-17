// ═══════════════════════════════════════════════════════════════
// reelTracker.js — Background cron that refreshes reel metrics
// ═══════════════════════════════════════════════════════════════
const Reel = require('../models/Reel');
const { scrapeReel } = require('./reelScraper');

let isRunning = false;

async function refreshDueReels(io) {
  if (isRunning) return;
  isRunning = true;

  try {
    const due = await Reel.find({
      status:     { $in: ['queued', 'tracking'] },
      nextFetchAt:{ $lte: new Date() },
    }).limit(10); // process 10 at a time

    for (const reel of due) {
      try {
        reel.status       = 'fetching';
        reel.fetchAttempts += 1;
        await reel.save();

        const data = await scrapeReel(reel.shortcode);

        // Compute velocity (views gained since last snapshot)
        let velocity = 0;
        if (reel.history.length > 0) {
          const last    = reel.history[reel.history.length - 1];
          const hrs     = (Date.now() - last.capturedAt.getTime()) / 3600000;
          const gained  = Math.max(0, data.views - last.views);
          velocity      = hrs > 0 ? Math.round(gained / hrs) : 0;
        }

        // Push snapshot
        reel.history.push({
          views:      data.views,
          likes:      data.likes,
          comments:   data.comments,
          engagement: data.engagement,
          capturedAt: new Date(),
        });

        // Keep max 500 snapshots
        if (reel.history.length > 500) reel.history.shift();

        // Update fields
        reel.views       = data.views;
        reel.likes       = data.likes;
        reel.comments    = data.comments;
        reel.engagement  = data.engagement;
        reel.velocity    = velocity;
        reel.dataSource  = data.source;
        reel.status      = 'tracking';
        reel.failReason  = '';
        reel.lastFetchedAt = new Date();
        if (data.username  && !reel.username)   reel.username   = data.username;
        if (data.fullName  && !reel.fullName)   reel.fullName   = data.fullName;
        if (data.caption   && !reel.caption)    reel.caption    = data.caption;
        if (data.thumbnail && !reel.thumbnail)  reel.thumbnail  = data.thumbnail;
        if (data.publishedAt && !reel.publishedAt) reel.publishedAt = data.publishedAt;

        reel.scheduleNext();
        await reel.save();

        // Emit live update
        if (io) {
          io.to(`user:${reel.addedBy}`).emit('reel:updated', {
            _id: reel._id, views: reel.views, likes: reel.likes,
            comments: reel.comments, engagement: reel.engagement,
            velocity: reel.velocity, status: reel.status,
          });
        }

        console.log(`[Tracker] ✅ ${reel.shortcode} — ${data.views} views`);
      } catch (err) {
        reel.status     = reel.fetchAttempts >= 3 ? 'failed' : 'queued';
        reel.failReason = err.message;
        reel.nextFetchAt = new Date(Date.now() + 30 * 60000); // retry in 30min
        await reel.save();
        console.log(`[Tracker] ✗ ${reel.shortcode}: ${err.message}`);
      }
    }
  } finally {
    isRunning = false;
  }
}

function startTracker(io) {
  console.log('[Tracker] 🚀 Reel tracker started');
  // Run every 5 minutes
  setInterval(() => refreshDueReels(io), 5 * 60 * 1000);
  // Also run immediately on start
  setTimeout(() => refreshDueReels(io), 3000);
}

module.exports = { startTracker, refreshDueReels };
