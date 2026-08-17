require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const { User } = require('./src/models');

  const testEmails = ['creator1@demo.com', 'brand@demo.com', 'admin@creatokite.com'];

  for (const email of testEmails) {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ NOT FOUND: ${email}`);
      continue;
    }
    const bcrypt = require('bcryptjs');
    const password = email === 'admin@creatokite.com' ? (process.env.ADMIN_PASSWORD || 'Admin@12345') : 'Demo@12345';
    const match = await bcrypt.compare(password, user.password || '');
    console.log(`${match ? '✅' : '❌'} ${email} | role: ${user.role} | emailVerified: ${user.emailVerified} | provider: ${user.provider || 'local'} | password match: ${match}`);
  }

  await mongoose.disconnect();
}).catch(e => { console.error('DB Error:', e.message); process.exit(1); });
