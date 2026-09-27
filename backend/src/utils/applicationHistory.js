/**
 * Every flow that touches an Application (submit, status change, inspection
 * scheduled/completed, officer assignment...) needs to push the same shape
 * of history entry and record who did it. This was being repeated by hand
 * in every route - one helper instead.
 *
 * Usage:
 *   addHistory(application, req.user, 'Application submitted for review', {
 *     previousStatus: 'draft',
 *     newStatus: 'submitted'
 *   });
 *   await application.save();
 */
function addHistory(application, user, action, { details, previousStatus, newStatus } = {}) {
  application.history.push({
    actorName: user.name,
    actorRole: user.role,
    action,
    details,
    previousStatus,
    newStatus
  });
  if (newStatus) application.status = newStatus;
  return application;
}

module.exports = { addHistory };
