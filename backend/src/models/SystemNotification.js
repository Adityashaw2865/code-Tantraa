const mongoose = require('mongoose');

const systemNotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: ['application', 'query', 'inspection', 'renewal', 'scheme', 'alert'],
      required: true
    },
    isRead: { type: Boolean, default: false },
    actionUrl: { type: String },
    relatedEntityId: { type: String },
    urgency: { type: String, enum: ['normal', 'high', 'critical'], default: 'normal' }
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

systemNotificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('SystemNotification', systemNotificationSchema);
