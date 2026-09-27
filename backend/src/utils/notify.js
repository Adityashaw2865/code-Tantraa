const SystemNotification = require('../models/SystemNotification');
const User = require('../models/User');
const { sendEmail } = require('./messaging');

async function notify({ userId, title, message, category, relatedEntityId, urgency = 'normal' }) {
  if (!userId) return;
  try {
    // The in-app notification is the part callers actually depend on for the
    // request to be meaningful, so it stays awaited.
    await SystemNotification.create({ userId, title, message, category, relatedEntityId, urgency });

    // Email is best-effort. Awaiting sendEmail here used to block the whole
    // HTTP request (PATCH status, POST /inspections, etc.) until SMTP
    // succeeded or timed out - if SMTP was unreachable that meant requests
    // hanging for 100+ seconds and the client's session/token expiring
    // before it got a response. Fire it and let it resolve in the
    // background instead, so a slow/broken mail server never blocks an API
    // response.
    const user = await User.findById(userId).select('email name');
    if (user?.email) {
      sendEmail(user.email, `VyaparSetu: ${title}`, message).catch((err) => {
        console.error('[notify] email send failed:', err.message);
      });
    }
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
}

module.exports = { notify };
