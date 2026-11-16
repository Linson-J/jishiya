'use strict';

const path = require('path');
const multer = require('multer');

// Vercel functions reject request bodies over 4.5 MB, so stay under that.
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Files are kept in memory (never written to a temp folder), because the
// filesystem on Vercel is read-only. The gallery controller validates the body,
// checks the real file signature, then stores the image in Vercel Blob
// (production) or in uploads/<portrait|gallery|logos> (local development).
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    const err = new Error('Only jpg, jpeg, png and webp images are allowed');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 10,
    fieldSize: 1024,
  },
});

module.exports = { upload, MAX_FILE_SIZE };
