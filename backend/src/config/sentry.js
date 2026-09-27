// Centralised Sentry setup. If SENTRY_DSN isn't set (e.g. local dev), every
// function here is a safe no-op so the app behaves exactly as before.
const Sentry = require('@sentry/node');

const enabled = Boolean(process.env.SENTRY_DSN);

function init() {
  if (!enabled) {
    console.log('[sentry] SENTRY_DSN not set — error monitoring disabled');
    return;
  }
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1
  });
  console.log('[sentry] initialized');
}

function captureException(err, context) {
  if (!enabled) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

module.exports = { init, captureException, enabled };
