'use strict';

const { pool, buildUpdate } = require('../config/db');

const FIELDS = ['title', 'event_date', 'event_time', 'location', 'description', 'link', 'is_active'];
// DATE as plain 'YYYY-MM-DD' so it never shifts with the server's timezone.
const SELECT = `SELECT id, title, DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date, event_time,
                       location, description, link, is_active FROM events`;

// Empty optional strings are stored as NULL.
function clean(body) {
  const out = { ...body };
  ['event_time', 'location', 'description', 'link'].forEach((k) => {
    if (out[k] !== undefined && String(out[k]).trim() === '') out[k] = null;
  });
  return out;
}

exports.getEvents = async (req, res, next) => {
  try {
    const isAdminView = Boolean(req.user) && req.query.all === 'true';
    const [rows] = await pool.query(
      `${SELECT} ${isAdminView ? '' : 'WHERE is_active = TRUE AND event_date >= CURDATE()'}
        ORDER BY event_date ASC, id ASC`
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const b = clean(req.body);
    const [result] = await pool.query(
      `INSERT INTO events (title, event_date, event_time, location, description, link, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        b.title,
        b.event_date,
        b.event_time ?? null,
        b.location ?? null,
        b.description ?? null,
        b.link ?? null,
        b.is_active !== undefined ? b.is_active : true,
      ]
    );
    const [rows] = await pool.query(`${SELECT} WHERE id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const { sets, values } = buildUpdate(FIELDS, clean(req.body));
    if (sets.length === 0) return res.status(400).json({ error: 'No valid fields provided to update' });
    const [result] = await pool.query(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`, [...values, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    const [rows] = await pool.query(`${SELECT} WHERE id = ?`, [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    res.status(200).json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};
