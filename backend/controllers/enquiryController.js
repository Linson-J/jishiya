'use strict';

const { pool } = require('../config/db');

const COLUMNS = 'id, name, email, phone, message, is_read, created_at';

/** POST /api/enquiries — public. Name + message required; email OR phone required. */
exports.createEnquiry = async (req, res, next) => {
  try {
    // Honeypot: real visitors never fill the hidden field. Pretend success to bots, but log it.
    if (req.body.hp_confirm) {
      console.warn('[enquiries] submission ignored (honeypot field was filled)');
      return res.status(201).json({ message: 'Thank you! We will get back to you soon.' });
    }

    const { name, message } = req.body;
    const email = req.body.email ? req.body.email : null;
    const phone = req.body.phone ? req.body.phone : null;

    await pool.query('INSERT INTO enquiries (name, email, phone, message) VALUES (?, ?, ?, ?)', [
      name,
      email,
      phone,
      message,
    ]);
    res.status(201).json({ message: 'Thank you! We will get back to you soon.' });
  } catch (err) {
    next(err);
  }
};

/** GET /api/enquiries?status=unread|read — admin. Newest first. */
exports.listEnquiries = async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = '';
    if (status === 'unread') where = 'WHERE is_read = FALSE';
    if (status === 'read') where = 'WHERE is_read = TRUE';
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM enquiries ${where} ORDER BY created_at DESC, id DESC LIMIT 500`);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

exports.unreadCount = async (req, res, next) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM enquiries WHERE is_read = FALSE');
    res.status(200).json({ unread: total });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/enquiries/:id { is_read } */
exports.setRead = async (req, res, next) => {
  try {
    const [result] = await pool.query('UPDATE enquiries SET is_read = ? WHERE id = ?', [req.body.is_read, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Enquiry not found' });
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM enquiries WHERE id = ?`, [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/** PUT /api/enquiries/read-all */
exports.markAllRead = async (req, res, next) => {
  try {
    await pool.query('UPDATE enquiries SET is_read = TRUE WHERE is_read = FALSE');
    res.status(200).json({ message: 'All enquiries marked as read' });
  } catch (err) {
    next(err);
  }
};

exports.deleteEnquiry = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM enquiries WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.status(200).json({ message: 'Enquiry deleted' });
  } catch (err) {
    next(err);
  }
};
