'use strict';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { validationResult } = require('express-validator');
const { pool } = require('../config/db');

const UPLOADS_ROOT = path.resolve(__dirname, '..', 'uploads');

// gallery.category -> folder under /uploads
const CATEGORY_FOLDER = {
  portrait: 'portrait',
  workshop: 'gallery',
  logo: 'logos',
};

async function removeQuietly(filePath) {
  try {
    await fsp.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Failed to remove file:', filePath, err.message);
  }
}

/**
 * Reads the first bytes of the file and identifies the real image type.
 * The client-supplied mimetype/extension can be spoofed; the signature cannot.
 * Returns the safe extension (".jpg" | ".png" | ".webp") or null.
 */
async function detectImageExtension(filePath) {
  const handle = await fsp.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(12);
    const { bytesRead } = await handle.read(buf, 0, 12, 0);
    if (bytesRead < 12) return null;

    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
    if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
      return '.webp';
    }
    return null;
  } finally {
    await handle.close();
  }
}

// rename() fails across devices (EXDEV); fall back to copy + delete.
async function moveFile(from, to) {
  try {
    await fsp.rename(from, to);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err;
    await fsp.copyFile(from, to);
    await fsp.unlink(from);
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
  const tmpPath = req.file ? req.file.path : null;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (tmpPath) await removeQuietly(tmpPath);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required (form field name: "image")' });
    }

    const ext = await detectImageExtension(tmpPath);
    if (!ext) {
      await removeQuietly(tmpPath);
      return res.status(400).json({ error: 'File content is not a valid jpg, png or webp image' });
    }

    const { category } = req.body;
    const caption = req.body.caption !== undefined ? req.body.caption : null;
    const sortOrder = req.body.sort_order !== undefined ? req.body.sort_order : 0;

    const folder = CATEGORY_FOLDER[category];
    const destDir = path.join(UPLOADS_ROOT, folder);
    await fsp.mkdir(destDir, { recursive: true });

    const finalName = `${path.basename(tmpPath, '.upload')}${ext}`;
    await moveFile(tmpPath, path.join(destDir, finalName));

    const imageUrl = `/uploads/${folder}/${finalName}`;

    let insertId;
    try {
      const [result] = await pool.query(
        'INSERT INTO gallery (image_url, caption, category, sort_order) VALUES (?, ?, ?, ?)',
        [imageUrl, caption, category, sortOrder]
      );
      insertId = result.insertId;
    } catch (dbErr) {
      // Don't leave an orphaned file behind if the DB write fails.
      await removeQuietly(path.join(destDir, finalName));
      throw dbErr;
    }

    const [rows] = await pool.query('SELECT * FROM gallery WHERE id = ?', [insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (tmpPath && fs.existsSync(tmpPath)) await removeQuietly(tmpPath);
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

    // image_url looks like "/uploads/gallery/abc.jpg". Resolve it and make sure
    // it stays inside the uploads folder before touching the disk.
    const relative = String(rows[0].image_url || '').replace(/^\/uploads\//, '');
    const filePath = path.resolve(UPLOADS_ROOT, relative);
    if (relative && filePath.startsWith(UPLOADS_ROOT + path.sep)) {
      await removeQuietly(filePath);
    }

    res.status(200).json({ message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/gallery/:id — edit caption / order and optionally replace the image file. */
exports.updateImage = async (req, res, next) => {
  const tmpPath = req.file ? req.file.path : null;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (tmpPath) await removeQuietly(tmpPath);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM gallery WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      if (tmpPath) await removeQuietly(tmpPath);
      return res.status(404).json({ error: 'Image not found' });
    }
    const row = rows[0];

    const sets = [];
    const values = [];

    if (req.body.caption !== undefined) {
      const caption = String(req.body.caption).trim();
      if (row.category === 'logo' && !caption) {
        if (tmpPath) await removeQuietly(tmpPath);
        return res.status(400).json({ error: 'Organisation name (caption) is required for logos' });
      }
      sets.push('caption = ?');
      values.push(caption || null);
    }
    if (req.body.sort_order !== undefined) {
      sets.push('sort_order = ?');
      values.push(req.body.sort_order);
    }

    let oldFile = null;
    if (req.file) {
      const ext = await detectImageExtension(tmpPath);
      if (!ext) {
        await removeQuietly(tmpPath);
        return res.status(400).json({ error: 'File content is not a valid jpg, png or webp image' });
      }
      const folder = CATEGORY_FOLDER[row.category];
      const destDir = path.join(UPLOADS_ROOT, folder);
      await fsp.mkdir(destDir, { recursive: true });
      const finalName = `${path.basename(tmpPath, '.upload')}${ext}`;
      await moveFile(tmpPath, path.join(destDir, finalName));
      sets.push('image_url = ?');
      values.push(`/uploads/${folder}/${finalName}`);
      oldFile = String(row.image_url || '').replace(/^\/uploads\//, '');
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    await pool.query(`UPDATE gallery SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);

    if (oldFile) {
      const filePath = path.resolve(UPLOADS_ROOT, oldFile);
      if (filePath.startsWith(UPLOADS_ROOT + path.sep)) await removeQuietly(filePath);
    }

    const [updated] = await pool.query('SELECT * FROM gallery WHERE id = ?', [id]);
    res.status(200).json(updated[0]);
  } catch (err) {
    if (tmpPath && fs.existsSync(tmpPath)) await removeQuietly(tmpPath);
    next(err);
  }
};
