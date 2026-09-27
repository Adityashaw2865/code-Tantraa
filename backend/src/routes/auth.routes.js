const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const User = require('../models/User');
const { signToken } = require('../utils/token');
const { requireAuth } = require('../middleware/auth');

const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many OTP requests. Please try again later.' } });
const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } });
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

const { sendSms, sendEmail } = require('../utils/messaging');

// Delivers an OTP / reset code by real SMS + email when Twilio/SMTP are configured
// (see utils/messaging.js); otherwise it's logged server-side. Either way, this always
// returns - a delivery failure never blocks the auth flow that triggered it.
async function deliverToUser(user, label, value) {
  await Promise.all([
    sendSms(user.mobile, `VyaparSetu: your ${label} is ${value}. Do not share this with anyone.`),
    sendEmail(user.email, `VyaparSetu - ${label}`, `Your ${label} is: ${value}\n\nIf you did not request this, you can safely ignore this email.`)
  ]);
}

const router = express.Router();

// Slow down brute-force attempts on login specifically
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, mobile, password, role, state, district, designation } = req.body;

  if (!name || !email || !mobile || !password) {
    return res.status(400).json({ error: 'name, email, mobile and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  // Only 'applicant' is self-registrable through the public form. Government-side
  // roles (officer/inspector/admin) must be provisioned by a
  // admin via POST /api/users, never picked by the person signing up.
  const user = new User({
    name,
    email: email.toLowerCase(),
    mobile,
    role: 'applicant',
    state,
    district,
    designation
  });
  await user.setPassword(password);
  await user.save();

  const token = signToken(user);
  res.status(201).json({ token, user: user.toPublicJSON() });
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);
  res.json({ token, user: user.toPublicJSON() });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

// POST /api/auth/send-otp - sends a 6-digit OTP to verify the logged-in user's mobile number
router.post('/send-otp', requireAuth, otpLimiter, async (req, res) => {
  const otp = String(crypto.randomInt(100000, 999999));
  req.user.otpHash = hashCode(otp);
  req.user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await req.user.save();
  await deliverToUser(req.user, `Mobile verification OTP (${req.user.mobile})`, otp);
  const dev = process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {};
  res.json({ message: 'OTP sent to your registered mobile number', expiresInMinutes: 10, ...dev });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', requireAuth, async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user._id).select('+otpHash +otpExpiresAt');
  if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    return res.status(400).json({ error: 'No active OTP. Please request a new one.' });
  }
  if (hashCode(String(otp || '')) !== user.otpHash) {
    return res.status(400).json({ error: 'Incorrect OTP' });
  }
  user.mobileVerified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save();
  res.json({ user: user.toPublicJSON() });
});

// POST /api/auth/change-password - logged-in user changes their own password.
// Bumps tokenVersion so every other logged-in session is signed out; a fresh token is
// returned so the caller's own session keeps working.
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.comparePassword(currentPassword || ''))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  await user.setPassword(newPassword);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  res.json({ token: signToken(user), user: user.toPublicJSON() });
});

// POST /api/auth/forgot-password - always returns a generic message so the response
// can't be used to check which emails are registered on the platform.
router.post('/forgot-password', forgotLimiter, async (req, res) => {
  const { email } = req.body;
  const generic = { message: 'If an account exists for that email, a reset link has been sent.' };
  const user = await User.findOne({ email: String(email || '').toLowerCase() });
  if (!user) return res.json(generic);

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetTokenHash = hashCode(rawToken);
  user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  await deliverToUser(user, 'Password reset token', rawToken);
  const dev = process.env.NODE_ENV !== 'production' ? { devResetToken: rawToken } : {};
  res.json({ ...generic, ...dev });
});

// POST /api/auth/reset-password
router.post('/reset-password', forgotLimiter, async (req, res) => {
  const { token, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const user = await User.findOne({ resetTokenHash: hashCode(String(token || '')), resetTokenExpiresAt: { $gt: new Date() } })
    .select('+resetTokenHash +resetTokenExpiresAt');
  if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired' });

  await user.setPassword(newPassword);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();
  res.json({ message: 'Password reset. Please log in with your new password.' });
});

// POST /api/auth/logout - revokes the current session (and every other one, since this
// app doesn't track sessions per-device) by bumping tokenVersion.
router.post('/logout', requireAuth, async (req, res) => {
  req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
  await req.user.save();
  res.json({ message: 'Logged out' });
});

module.exports = router;
