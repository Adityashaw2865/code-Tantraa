const multer = require('multer');
const path = require('path');
const { fromBuffer } = require('file-type');

// Files are held in memory only long enough to verify + stream to Cloudinary.
// Nothing touches local disk (safe for ephemeral hosts like Vercel).
const storage = multer.memoryStorage();

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);
const maxSizeBytes = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: maxSizeBytes },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      return cb(new Error('Only PDF, JPEG, PNG or WEBP files are allowed'));
    }
    cb(null, true);
  }
});

// Client-reported mimetype/extension can be spoofed (fileFilter above only checks those).
// This re-checks the file's actual magic bytes in memory before it's uploaded to Cloudinary.
async function verifyMagicBytes(req, res, next) {
  if (!req.file) return next();
  try {
    const detected = await fromBuffer(req.file.buffer);
    const ok = detected && ALLOWED_MIME.has(detected.mime);
    if (!ok) {
      return res.status(400).json({ error: 'File content does not match an allowed type (PDF/JPEG/PNG/WEBP)' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, verifyMagicBytes };
