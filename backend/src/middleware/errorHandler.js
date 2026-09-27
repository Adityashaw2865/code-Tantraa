// Central error handler. Any thrown/rejected error in a route (with express-async-errors
// wired in server.js, this includes async handlers) lands here.
const { captureException } = require('../config/sentry');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[error]', err);
  captureException(err, { path: req.originalUrl, method: req.method });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `Duplicate value for ${field}` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid id: ${err.value}` });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
