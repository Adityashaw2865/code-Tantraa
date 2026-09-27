require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { startScheduler } = require('./jobs/scheduler');
const { captureException } = require('./config/sentry');

process.on('uncaughtException', (err) => {
  console.error('[server] uncaught exception:', err);
  captureException(err, { type: 'uncaughtException' });
});
process.on('unhandledRejection', (err) => {
  console.error('[server] unhandled rejection:', err);
  captureException(err, { type: 'unhandledRejection' });
});

// Refuse to boot with the placeholder secret from .env.example - a leaked/default
// JWT secret means anyone can forge a valid admin token.
const insecureDefaults = ['change_this_to_a_long_random_secret', ''];
if (insecureDefaults.includes(process.env.JWT_SECRET) || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('[server] Refusing to start: set a real JWT_SECRET (16+ random characters) in backend/.env');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] VyaparSetu API running on http://localhost:${PORT}`);
      if (process.env.DISABLE_JOBS !== 'true') startScheduler();
    });
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

start();
