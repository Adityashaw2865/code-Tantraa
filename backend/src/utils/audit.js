const AuditLogRecord = require('../models/AuditLogRecord');

/**
 * Fire-and-forget audit trail entry. Never throws into the calling route -
 * a logging failure should not fail the user's actual request.
 */
async function writeAudit({ req, action, entityType, entityId, description, previousValue, newValue }) {
  try {
    await AuditLogRecord.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action,
      entityType,
      entityId: String(entityId),
      description,
      ipAddress: req.ip,
      previousValue,
      newValue
    });
  } catch (err) {
    console.error('[audit] failed to write audit log:', err.message);
  }
}

module.exports = { writeAudit };
