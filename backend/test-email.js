require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('--- Testing SMTP configuration ---');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

if (!process.env.EMAIL_PASS) {
  console.error('❌ EMAIL_PASS is empty. Make sure you set it in your backend/.env and restarted your server.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'creatokite123@gmail.com',
    pass: process.env.EMAIL_PASS
  }
});

const mailOptions = {
  from: `"CreatoKite Test" <${process.env.EMAIL_USER || 'creatokite123@gmail.com'}>`,
  to: process.env.EMAIL_USER || 'creatokite123@gmail.com',
  subject: 'SMTP Diagnostics Test',
  text: 'If you receive this, your SMTP and passcode credentials are correct!'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('\n❌ SMTP send failed with error:\n', error);
  } else {
    console.log('\n✅ SMTP test succeeded! Message ID:', info.messageId);
  }
});
