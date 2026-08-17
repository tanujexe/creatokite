require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const { User } = require('./src/models');
  // Patch all users that don't have emailVerified set to true
  const result = await User.updateMany(
    { emailVerified: { $ne: true } },
    { $set: { emailVerified: true } }
  );
  console.log('✅ Patched', result.modifiedCount, 'users -> emailVerified: true');
  await mongoose.disconnect();
  console.log('✅ Done');
}).catch(e => { console.error('❌', e.message); process.exit(1); });
