const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  views:      { type: Number, default: 0 },
  likes:      { type: Number, default: 0 },
  comments:   { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
  capturedAt: { type: Date,   default: Date.now },
}, { _id: false });

const reelSchema = new mongoose.Schema({
  url:       { type: String, required: true },
  shortcode: { type: String, required: true, unique: true },
  addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaignId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },

  // Creator info
  username:  { type: String, default: '' },
  fullName:  { type: String, default: '' },

  // Content
  caption:    { type: String, default: '' },
  thumbnail:  { type: String, default: '' },
  publishedAt:{ type: Date },

  // Latest metrics
  views:      { type: Number, default: 0 },
  likes:      { type: Number, default: 0 },
  comments:   { type: Number, default: 0 },
  engagement: { type: Number, default: 0 }, // %

  // Velocity (views/hr in last window)
  velocity:   { type: Number, default: 0 },

  // History snapshots
  history: [snapshotSchema],

  // Status
  status: {
    type: String,
    enum: ['queued', 'fetching', 'tracking', 'failed', 'private', 'deleted'],
    default: 'queued',
  },
  failReason:   { type: String, default: '' },
  fetchAttempts:{ type: Number, default: 0 },
  lastFetchedAt:{ type: Date },
  nextFetchAt:  { type: Date, default: Date.now },

  // Data source
  dataSource: { type: String, default: 'unknown' }, // scrapecreators, rapidapi, estimated
}, { timestamps: true });

reelSchema.index({ addedBy: 1 });
reelSchema.index({ nextFetchAt: 1, status: 1 });
reelSchema.index({ username: 1 });

// Auto-schedule next fetch based on reel age
reelSchema.methods.scheduleNext = function () {
  const ageHrs = this.publishedAt
    ? (Date.now() - this.publishedAt.getTime()) / 3600000
    : 999;
  const delayMins = ageHrs < 24 ? 15 : ageHrs < 72 ? 60 : 360;
  this.nextFetchAt = new Date(Date.now() + delayMins * 60000);
};

module.exports = mongoose.model('Reel', reelSchema);
