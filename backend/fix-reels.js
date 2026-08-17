// fix-reels.js — Run once to fix existing unlinked reels
// Usage: node fix-reels.js
require('dotenv').config();
const mongoose = require('mongoose');

function decodeUrl(url) {
  if (!url) return url;
  return url.replace(/&#x2F;/g, '/').replace(/&#x2f;/g, '/').replace(/&amp;/g, '&').trim();
}

function extractShortcode(input) {
  if (!input) return null;
  input = decodeUrl(input).split('?')[0].split('#')[0].trim();
  const m = input.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  return null;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const campaigns = await db.collection('campaigns').find({}).toArray();
  const { ObjectId } = mongoose.Types;

  let fixed = 0;

  for (const campaign of campaigns) {
    const assigned = campaign.assignedCreators || [];
    for (const a of assigned) {
      if (!a.submissionUrl) continue;
      const cleanUrl = decodeUrl(a.submissionUrl);
      const shortcode = extractShortcode(cleanUrl);
      if (!shortcode) {
        console.log(`⚠ Could not extract shortcode from: ${cleanUrl}`);
        continue;
      }

      // Check if reel exists
      const existing = await db.collection('reels').findOne({ shortcode });
      if (existing) {
        // Link to campaign if not linked
        if (!existing.campaignId) {
          await db.collection('reels').updateOne(
            { shortcode },
            { $set: { campaignId: campaign._id } }
          );
          console.log(`✅ Linked existing reel ${shortcode} → campaign "${campaign.title}"`);
          fixed++;
        } else {
          console.log(`ℹ Reel ${shortcode} already linked`);
        }
      } else {
        // Create new reel document
        await db.collection('reels').insertOne({
          url:         `https://www.instagram.com/reel/${shortcode}/`,
          shortcode,
          addedBy:     a.creator,
          campaignId:  campaign._id,
          status:      'queued',
          views: 0, likes: 0, comments: 0, engagement: 0,
          velocity: 0,
          history:     [],
          dataSource:  'pending',
          nextFetchAt: new Date(),
          createdAt:   new Date(),
          updatedAt:   new Date(),
        });
        console.log(`✅ Created reel ${shortcode} → campaign "${campaign.title}"`);
        fixed++;
      }
    }
  }

  console.log(`\n🎉 Done! Fixed ${fixed} reels.`);
  console.log('Now restart backend — tracker will auto-fetch real data.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
