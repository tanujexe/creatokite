const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const { sendLoginMail, sendWelcomeMail } = require('../utils/sendEmail');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️ Google Client ID or Client Secret is missing in env. Google OAuth will not work.');
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("✅ GOOGLE PROFILE RECEIVED:", profile.id);
      
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (!email) {
        return done(new Error("No email found in Google profile"), null);
      }

      let user = await User.findOne({ email });

      if (!user) {
        console.log("CREATING NEW GOOGLE USER:", email);
        user = await User.create({
          displayName: profile.displayName || profile.username || 'Google User',
          email,
          role: 'creator',
          provider: 'google',
          emailVerified: true,
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
        });
        console.log("USER CREATED VIA GOOGLE OAUTH:", user._id);
        sendWelcomeMail(user.email, user.displayName).catch(e => console.error("Google welcome email failed:", e));
      } else {
        // Update user provider/verification/avatar if necessary
        let modified = false;
        if (user.provider !== 'google') {
          user.provider = 'google';
          modified = true;
        }
        if (!user.emailVerified) {
          user.emailVerified = true;
          modified = true;
        }
        if (!user.avatar && profile.photos && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
          modified = true;
        }
        if (modified) {
          await user.save({ validateBeforeSave: false });
        }
        sendLoginMail(user.email).catch(e => console.error("Google login email failed:", e));
      }

      return done(null, user);
    } catch (error) {
      console.error("❌ GOOGLE AUTH ERROR:", error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});