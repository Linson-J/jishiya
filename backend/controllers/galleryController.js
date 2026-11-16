'use strict';

const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { pool } = require('../config/db');

const UPLOADS_ROOT = path.resolve(__dirname, '..', 'uploads');

// gallery.category -> folder under /uploads (or prefix in Vercel Blob)
const CATEGORY_FOLDER = {
  portrait: 'portrait',
  workshop: 'gallery',
  logo: 'logos',
};

const CONTENT_TYPE = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// On Vercel the filesystem is read-only, so images go to Vercel Blob.
// Connecting a Blob store to the project sets BLOB_READ_WRITE_TOKEN.
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Identifies the real image type from the first bytes of the upload.
 * The client-supplied mimetype/extension can be spoofed; the signature cannot.
 * Returns the safe extension (".jpg" | ".png" | ".webp") or null.
 */
function detectImageExtension(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return '.webp';
  }
  return null;
}

/** Stores the image and returns its public URL (absolute for Blob, "/uploads/..." locally). */
async function storeImage(buffer, folder, ext) {
  // Never trust the client-supplied filename.
  const name = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`;

  if (useBlob()) {
    const { put } = require('@vercel/blob');
    const blob = await put(`${folder}/${name}`, buffer, {
      access: 'public',
      contentType: CONTENT_TYPE[ext],
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const destDir = path.join(UPLOADS_ROOT, folder);
  await fsp.mkdir(destDir, { recursive: true });
  await fsp.writeFile(path.join(destDir, name), buffer);
  return `/uploads/${folder}/${name}`;
}

/** Deletes a stored image. Never throws: a missing file must not break the request. */
async function removeImage(imageUrl) {
  const url = String(imageUrl || '');
  if (!url) return;
  try {
    if (/^https?:\/\//i.test(url)) {
      if (useBlob() && /\.blob\.vercel-storage\.com\//i.test(url)) {
        const { del } = require('@vercel/blob');
        await del(url);
      }
      return;
    }
    // "/uploads/gallery/abc.jpg": resolve it and make sure it stays inside uploads/.
    const relative = url.replace(/^\/uploads\//, '');
    const filePath = path.resolve(UPLOADS_ROOT, relative);
    if (relative && filePath.startsWith(UPLOADS_ROOT + path.sep)) await fsp.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Failed to remove image:', url, err.message);
  }
}

exports.getGallery = async (req, res, next) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT id, image_url, caption, category, sort_order, created_at FROM gallery';
    const params = [];

    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY sort_order ASC, id ASC';

    const [rows] = await pool.query(sql, params);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required (form field name: "image")' });
    }

    const ext = detectImageExtension(req.file.buffer);
    if (!ext) {
      return res.status(400).json({ error: 'File content is not a valid jpg, png or webp image' });
    }

    const { category } = req.body;
    const caption = req.body.caption !== undefined ? req.body.caption : null;
    const sortOrder = req.body.sort_order !== undefined ? req.body.sort_order : 0;

    const imageUrl = await storeImage(req.file.buffer, CATEGORY_FOLDER[category], ext);

    let insertId;
    try {
      const [result] = await pool.query(
        'INSERT INTO gallery (image_url, caption, category, sort_order) VALUES (?, ?, ?, ?)',
        [imageUrl, caption, category, sortOrder]
      );
      insertId = result.insertId;
    } catch (dbErr) {
      // Don't leave an orphaned file behind if the DB write fails.
      await removeImage(imageUrl);
      throw dbErr;
    }

    const [rows] = await pool.query('SELECT * FROM gallery WHERE id = ?', [insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT id, image_url FROM gallery WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);

    await removeImage(rows[0].image_url);

    res.status(200).json({ message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/gallery/:id — edit caption / order and optionally replace the image file. */
exports.updateImage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM gallery WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const row = rows[0];

    const sets = [];
    const values = [];

    if (req.body.caption !== undefined) {
      const caption = String(req.body.caption).trim();
      sets.push('caption = ?');
      values.push(caption || null);
    }
    if (req.body.sort_order !== undefined) {
      sets.push('sort_order = ?');
      values.push(req.body.sort_order);
    }

    let oldFile = null;
    if (req.file) {
      const ext = detectImageExtension(req.file.buffer);
      if (!ext) {
        return res.status(400).json({ error: 'File content is not a valid jpg, png or webp image' });
      }
      const folder = CATEGORY_FOLDER[row.category] || 'gallery';
      sets.push('image_url = ?');
      values.push(await storeImage(req.file.buffer, folder, ext));
      oldFile = row.image_url;
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    await pool.query(`UPDATE gallery SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);

    if (oldFile) await removeImage(oldFile);

    const [updated] = await pool.query('SELECT * FROM gallery WHERE id = ?', [id]);
    res.status(200).json(updated[0]);
  } catch (err) {
    next(err);
  }
};
