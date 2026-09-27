const DigitalLicence = require('../models/DigitalLicence');
const BusinessProfile = require('../models/BusinessProfile');
const Application = require('../models/Application');
const User = require('../models/User');
const { notify } = require('../utils/notify');

const DAY = 24 * 60 * 60 * 1000;
const REMINDER_THRESHOLDS = [90, 60, 30]; // days before expiry
const SLA_ACTIVE_STATUSES = [
  'submitted', 'under_verification', 'documents_resubmitted', 'inspection_required',
  'inspection_scheduled', 'inspection_completed', 'under_final_review'
]; // 'query_raised' is excluded: the clock is waiting on the applicant

// Marks licences Renewal Due / Expired and sends 90/60/30-day expiry reminders (once per threshold).
async function runLicenceJob() {
  const summary = { renewalDue: 0, expired: 0, reminders: 0 };
  const licences = await DigitalLicence.find({ status: { $in: ['Active', 'Renewal Due'] } });

  for (const lic of licences) {
    const days = Math.ceil((new Date(lic.expiryDate).getTime() - Date.now()) / DAY);
    const biz = await BusinessProfile.findById(lic.businessId).select('applicantId');
    const applicantId = biz && biz.applicantId;

    if (days < 0) {
      lic.status = 'Expired';
      await lic.save();
      summary.expired++;
      if (!lic.renewedByLicenceId) {
        await notify({
          userId: applicantId, category: 'renewal', urgency: 'high', relatedEntityId: String(lic._id),
          title: `Licence expired: ${lic.approvalName}`,
          message: `${lic.licenceNumber} expired on ${new Date(lic.expiryDate).toISOString().slice(0, 10)}. Please renew it to stay compliant.`
        });
      }
      continue;
    }

    let changed = false;
    if (days <= 90 && lic.status === 'Active') { lic.status = 'Renewal Due'; changed = true; summary.renewalDue++; }

    if (!lic.renewedByLicenceId) {
      const crossed = REMINDER_THRESHOLDS.filter((t) => days <= t);
      const sent = lic.remindersSent || [];
      if (crossed.some((t) => !sent.includes(t))) {
        await notify({
          userId: applicantId, category: 'renewal', urgency: days <= 30 ? 'high' : 'normal', relatedEntityId: String(lic._id),
          title: `Renewal due in ${days} day(s): ${lic.approvalName}`,
          message: `${lic.licenceNumber} expires on ${new Date(lic.expiryDate).toISOString().slice(0, 10)}. You can renew it in one click from the Licence Renewal Center.`
        });
        lic.remindersSent = [...new Set([...sent, ...crossed])];
        changed = true;
        summary.reminders++;
      }
    }
    if (changed) await lic.save();
  }
  return summary;
}

// Alerts the assigned officer + admins once when an application crosses its SLA date.
async function runSlaJob() {
  const summary = { breached: 0 };
  const apps = await Application.find({
    status: { $in: SLA_ACTIVE_STATUSES },
    targetSLADate: { $lt: new Date() },
    slaBreachNotified: { $ne: true }
  }).populate('approvalTypeId', 'approvalName');
  if (!apps.length) return summary;

  const admins = await User.find({ role: 'admin', isActive: { $ne: false } }).select('_id');
  for (const app of apps) {
    const recipients = new Set([app.assignedOfficerId, ...admins.map((a) => a._id)].filter(Boolean).map(String));
    const late = Math.ceil((Date.now() - new Date(app.targetSLADate).getTime()) / DAY);
    for (const userId of recipients) {
      await notify({
        userId, category: 'alert', urgency: 'high', relatedEntityId: String(app._id),
        title: `SLA breached: ${app.applicationNumber}`,
        message: `${(app.approvalTypeId && app.approvalTypeId.approvalName) || 'Application'} is ${late} day(s) past its statutory deadline (status: ${app.status}).`
      });
    }
    await Application.updateOne({ _id: app._id }, { slaBreachNotified: true });
    summary.breached++;
  }
  return summary;
}

async function runAllJobs() {
  const out = {};
  try { out.licences = await runLicenceJob(); } catch (e) { out.licences = { error: e.message }; console.error('[jobs] licence job failed:', e); }
  try { out.sla = await runSlaJob(); } catch (e) { out.sla = { error: e.message }; console.error('[jobs] SLA job failed:', e); }
  return out;
}

// Runs once at boot, then every JOBS_INTERVAL_HOURS (default 6). No extra library needed.
function startScheduler() {
  const hours = Number(process.env.JOBS_INTERVAL_HOURS || 6);
  const tick = () => runAllJobs().then((r) => console.log('[jobs]', JSON.stringify(r)));
  setTimeout(tick, 5000).unref();
  setInterval(tick, hours * 60 * 60 * 1000).unref();
  console.log(`[jobs] scheduler started (every ${hours}h)`);
}

module.exports = { startScheduler, runAllJobs, runLicenceJob, runSlaJob };
