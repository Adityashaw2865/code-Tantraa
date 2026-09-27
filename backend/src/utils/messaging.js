// Real SMS (Twilio) and Email (SMTP via Nodemailer) delivery, used for OTPs, password-reset
// codes and account notifications. Nothing is sent anywhere until the matching environment
// variables are set - until then everything is logged to the console (and, for OTP/reset
// flows, also returned directly in the API response outside production) so the app is fully
// testable today. Fill in the env vars in `.env` and delivery switches on automatically;
// no other code in the app needs to change.

let twilioClient = null;
function getTwilioClient() {
  if (twilioClient) return twilioClient;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

let mailTransport = null;
function getMailTransport() {
  if (mailTransport) return mailTransport;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  const nodemailer = require('nodemailer');
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return mailTransport;
}

// Sends an SMS via Twilio if TWILIO_* env vars are set, otherwise logs it. Never throws -
// a failed/unconfigured SMS should not break the request that triggered it.
async function sendSms(mobile, message) {
  const client = getTwilioClient();
  if (!client) {
    console.log(`[sms:dev - no SMS provider configured] to ${mobile}: ${message}`);
    return { delivered: false, channel: 'console' };
  }
  try {
    await client.messages.create({ to: `+91${String(mobile).replace(/^\+?91/, '')}`, from: process.env.TWILIO_FROM_NUMBER, body: message });
    return { delivered: true, channel: 'sms' };
  } catch (err) {
    console.error('[sms] Twilio send failed:', err.message);
    return { delivered: false, channel: 'sms-error' };
  }
}

// Sends an email via SMTP (Nodemailer) if SMTP_* env vars are set, otherwise logs it.
async function sendEmail(to, subject, text) {
  const transport = getMailTransport();
  if (!transport) {
    console.log(`[email:dev - no SMTP configured] to ${to} | ${subject}: ${text}`);
    return { delivered: false, channel: 'console' };
  }
  try {
    await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
    return { delivered: true, channel: 'email' };
  } catch (err) {
    console.error('[email] SMTP send failed:', err.message);
    return { delivered: false, channel: 'email-error' };
  }
}

module.exports = { sendSms, sendEmail };
