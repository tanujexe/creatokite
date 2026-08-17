const nodemailer = require('nodemailer');

const emailUser = (process.env.EMAIL_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || '').trim();

const transporter = (emailUser && emailPass) ? nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  tls: {
    rejectUnauthorized: false
  }
}) : null;

const FROM   = `"CreatoKite" <${emailUser || 'creaotokite123@gmail.com'}>`;
const CLIENT = process.env.CLIENT_URL || 'http://localhost:5173';

const send = async (to, subject, html) => {
  if (!transporter) {
    console.log(`[Email SKIP] (Nodemailer credentials missing) ${subject} → ${to}`);
    return false;
  }
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html
    });
    console.log(`[Email SENT] ${subject} → ${to} (MessageID: ${info.messageId})`);
    return true;
  } catch(e) {
    console.error('[Email Error Failed to Send]', e.message);
    return false;
  }
};


const base = (content, title) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#0F1117;font-family:'Segoe UI',sans-serif;">
<div style="max-width:560px;margin:40px auto;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
  <div style="background:linear-gradient(135deg,#FF6B57,#E85D45);padding:32px 32px 24px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Creatokite</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Influencer Marketing OS</p>
  </div>
  <div style="background:#161C2A;padding:32px;">${content}</div>
  <div style="background:#0F1117;padding:16px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="color:#4A5568;font-size:11px;margin:0;">© 2025 CreatoKite · <a href="${CLIENT}" style="color:#FF6B57;text-decoration:none;">Visit Platform</a></p>
  </div>
</div></body></html>`;

const h2   = t => `<h2 style="color:#F0EDE6;margin:0 0 16px;font-size:20px;font-weight:700;">${t}</h2>`;
const p    = t => `<p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 14px;">${t}</p>`;
const btn  = (url, label) => `<div style="margin:24px 0;"><a href="${url}" style="background:linear-gradient(135deg,#FF6B57,#E85D45);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">${label}</a></div>`;
const pill = (label, color='#7C8B5A') => `<span style="background:${color}20;color:${color};border:1px solid ${color}40;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:600;">${label}</span>`;

/* ── Email functions ─────────────────────────────── */
exports.sendLoginMail = (to) => send(to,'Login Alert — CreatoKite', base(`${h2('New Login Detected')}${p('A new login to your CreatoKite account was detected. If this was you, no action is needed.')}${btn(CLIENT,'Go to Dashboard')}`, 'Login Alert'));

exports.sendWelcomeMail = (to, name, role) => send(to,`Welcome to CreatoKite, ${name}!`, base(`${h2(`Welcome, ${name}! 🎉`)}${p(`You've joined CreatoKite as a ${role}. Your account is being set up.`)}${btn(`${CLIENT}/${role}/dashboard`,'Get Started')}`, 'Welcome'));

exports.sendCreatorApprovedMail = (to, name) => send(to,'✅ Your Creator Profile is Approved!', base(`${h2('You\'re Approved! 🎉')}${p(`Hi ${name}, your creator profile has been reviewed and approved. You can now receive campaign assignments from top brands.`)}${btn(`${CLIENT}/creator/dashboard`,'View Dashboard')}`, 'Approved'));

exports.sendCreatorRejectedMail = (to, name, reason='') => send(to,'Creator Profile — Action Required', base(`${h2('Profile Needs Update')}${p(`Hi ${name}, your creator profile needs some changes before we can approve it.`)}${reason?p(`<strong>Reason:</strong> ${reason}`):''}${btn(`${CLIENT}/creator/profile`,'Update Profile')}`, 'Action Required'));

exports.sendResetPasswordMail = (to, otpCode) => send(
  to,
  '🔐 Password Reset Code — CreatoKite',
  base(
    `${h2('Password Reset Request')}
     ${p('You requested to reset your password for your CreatoKite account.')}
     <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:16px 24px;border-radius:12px;text-align:center;margin:20px 0;">
       <span style="font-size:32px;font-weight:900;letter-spacing:8px;color:#FF6B57;font-family:monospace;">${otpCode}</span>
     </div>
     ${p('This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.')}`,
    'Password Reset'
  )
);

exports.sendCampaignAssignedMail = (to, name, campaignTitle, deadline) => send(to,`🎯 New Campaign: ${campaignTitle}`, base(`${h2('Campaign Assigned!')}<div style="background:rgba(255,107,87,0.08);border:1px solid rgba(255,107,87,0.2);border-radius:10px;padding:16px;margin:16px 0;">${p(`<strong style="color:#FF6B57">${campaignTitle}</strong>`)}<p style="color:#8892A4;font-size:12px;margin:0;">Deadline: ${new Date(deadline).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p></div>${p(`Hi ${name}, you've been assigned to a new campaign. Please log in to review the brief and accept or decline.`)}${btn(`${CLIENT}/creator/assigned`,'View Campaign')}`, 'Campaign Assigned'));

exports.sendCampaignAcceptedMail = (to, adminName, creatorName, campaignTitle) => send(to,`Creator Accepted: ${campaignTitle}`, base(`${h2('Creator Accepted Campaign')}${p(`${creatorName} has accepted the campaign <strong>${campaignTitle}</strong>.`)}${btn(`${CLIENT}/admin/campaigns`,'View Campaign')}`, 'Creator Accepted'));

exports.sendSubmissionMail = (to, creatorName, campaignTitle) => send(to,`📤 New Submission: ${campaignTitle}`, base(`${h2('Submission Received')}<p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 14px;">${creatorName} has submitted work for <strong style="color:#F0EDE6">${campaignTitle}</strong>. Please review and approve.</p>${btn(`${CLIENT}/admin/campaigns`,'Review Submission')}`, 'New Submission'));

exports.sendSubmissionApprovedMail = (to, name, campaignTitle) => send(to,`✅ Submission Approved: ${campaignTitle}`, base(`${h2('Submission Approved! 🎉')}${p(`Hi ${name}, your submission for <strong>${campaignTitle}</strong> has been approved.`)}${btn(`${CLIENT}/creator/assigned`,'View Details')}`, 'Approved'));

exports.sendSubmissionRejectedMail = (to, name, campaignTitle, reason='') => send(to,`Changes Requested: ${campaignTitle}`, base(`${h2('Revision Requested')}${p(`Hi ${name}, your submission for <strong>${campaignTitle}</strong> needs some changes.`)}${reason?`<div style="background:rgba(255,107,87,0.08);border-left:3px solid #FF6B57;padding:12px 16px;border-radius:4px;margin:12px 0;"><p style="color:#8892A4;font-size:13px;margin:0;"><strong>Feedback:</strong> ${reason}</p></div>`:''}${btn(`${CLIENT}/creator/assigned`,'Revise Submission')}`, 'Revision Needed'));

exports.sendTaskAssignedMail = (to, name, taskTitle) => send(to,`📋 Task Assigned: ${taskTitle}`, base(`${h2('New Task Assigned')}${p(`Hi ${name}, you have a new task: <strong>${taskTitle}</strong>`)}${btn(`${CLIENT}/team/tasks`,'View Task')}`, 'Task Assigned'));

exports.sendRoleChangeMail = (to, name, newRole) => send(to,'🔑 Your Role Has Been Updated', base(`${h2('Role Updated')}${p(`Hi ${name}, your role on CreatoKite has been updated to:`)} <div style="margin:12px 0;">${pill(newRole,'#D4A24C')}</div>${p('Your new workspace is now available. Switch workspaces from the sidebar.')}${btn(`${CLIENT}`,'Open Platform')}`, 'Role Updated'));

exports.sendFollowUpReminderMail = (to, name, subject, notes='') => send(to,`⏰ Follow-Up Reminder: ${subject}`, base(`${h2('Follow-Up Due Today')}${p(`Hi ${name}, you have a follow-up scheduled for <strong>${subject}</strong>.`)}${notes?p(`Notes: ${notes}`):''}${btn(`${CLIENT}/admin/crm/creators`,'View CRM')}`, 'Follow-Up Reminder'));

exports.sendBroadcastMail = (to, title, body) => send(to,`[CreatoKite] ${title}`, base(`${h2(title)}${p(body)}${btn(CLIENT,'Open Platform')}`, title));

exports.sendPendingNotificationsMail = (to, name, unreadCount) => send(to, `⚠️ Pending Notifications — CreatoKite`, base(`${h2('Pending Notifications')}${p(`Hi ${name}, you have ${unreadCount} unread notifications waiting for your attention on CreatoKite.`)}${btn(`${CLIENT}/creator/dashboard`, 'Go & Check Them Out')}`, 'Pending Notifications'));

