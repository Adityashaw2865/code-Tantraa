require('express-async-errors');
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const departmentRoutes = require('./routes/departments.routes');
const approvalTypeRoutes = require('./routes/approvalTypes.routes');
const businessProfileRoutes = require('./routes/businessProfiles.routes');
const applicationRoutes = require('./routes/applications.routes');
const documentRoutes = require('./routes/documents.routes');
const inspectionRoutes = require('./routes/inspections.routes');
const licenceRoutes = require('./routes/licences.routes');
const grievanceRoutes = require('./routes/grievances.routes');
const notificationRoutes = require('./routes/notifications.routes');
const auditLogRoutes = require('./routes/auditLogs.routes');
const queryRoutes = require('./routes/queries.routes');
const aiRoutes = require('./routes/ai.routes');
const jobRoutes = require('./routes/jobs.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const paymentRoutes = require('./routes/payments.routes');

const sentry = require('./config/sentry');

const app = express();
sentry.init();

app.use(helmet());

// CORS: allow comma-separated origins from env, with a safe fallback list
// so production still works even if CLIENT_ORIGIN isn't set on the host.
const allowedOrigins = (
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173,https://code-tantra-zeta.vercel.app'
).split(',').map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global rate limit as a baseline; auth/login and AI routes layer stricter limits on top
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || 'unknown';
  res.status(dbState === 'connected' ? 200 : 503).json({
    status: dbState === 'connected' ? 'ok' : 'degraded',
    db: dbState,
    time: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/approval-types', approvalTypeRoutes);
app.use('/api/business-profiles', businessProfileRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/licences', licenceRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
