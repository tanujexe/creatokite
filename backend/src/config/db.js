const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file!');
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to resolve Atlas host and avoid IPv6 NAT64 timeouts
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err.message);
    console.error('\n======================================================');
    console.error('👉 HOW TO FIX MONGODB ATLAS IP WHITELIST ERROR:');
    console.error('1. Go to https://cloud.mongodb.com and log in.');
    console.error('2. Click Network Access under Security in the left sidebar.');
    console.error('3. Click "+ Add IP Address".');
    console.error('4. Click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0) and Save.');
    console.error('======================================================\n');

    // Attempt fallback to local MongoDB if available
    try {
      console.log('🔄 Attempting fallback connection to local MongoDB (mongodb://127.0.0.1:27017/creatokite)...');
      const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/creatokite', {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`✅ Fallback Local MongoDB connected: ${fallbackConn.connection.host}`);
    } catch (fallbackErr) {
      console.error('❌ Local MongoDB fallback also failed. Please whitelist your IP in MongoDB Atlas to start the backend server.');
      process.exit(1);
    }
  }
};
