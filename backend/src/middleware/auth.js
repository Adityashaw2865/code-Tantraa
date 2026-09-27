const { verifyToken } = require('../utils/token');
const User = require('../models/User');

/**
 * Verifies the Bearer token, loads the user, and attaches it to req.user.
 * Rejects with 401 if missing/invalid/expired.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'User not found or deactivated' });
  }
  // tokenVersion is bumped on logout / password change / reset, instantly invalidating
  // every token issued before that point - this is what makes logout actually work for a JWT.
  if ((payload.tokenVersion || 0) !== (user.tokenVersion || 0)) {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }

  req.user = user;
  next();
}

/**
 * Restricts a route to one or more roles. Use after requireAuth.
 * e.g. router.post('/x', requireAuth, requireRole('officer', 'admin'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
