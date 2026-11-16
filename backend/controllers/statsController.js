'use strict';

const { pool, buildUpdate } = require('../config/db');

const FIELDS = ['label', 'value', 'sort_order'];

exports.getStats = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, label, value, sort_order FROM stats ORDER BY sort_order ASC, id ASC');
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

exports.updateStat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sets, values } = buildUpdate(FIELDS, req.body);
    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const [result] = await pool.query(`UPDATE stats SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Stat not found' });
    }

    const [rows] = await pool.query('SELECT id, label, value, sort_order FROM stats WHERE id = ?', [id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.createStat = async (req, res, next) => {
  try {
    const [[{ next: nextOrder }]] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM stats');
    const sortOrder = req.body.sort_order !== undefined ? req.body.sort_order : nextOrder;
    const [result] = await pool.query('INSERT INTO stats (label, value, sort_order) VALUES (?, ?, ?)', [
      req.body.label,
      req.body.value,
      sortOrder,
    ]);
    const [rows] = await pool.query('SELECT id, label, value, sort_order FROM stats WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteStat = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM stats WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Stat not found' });
    res.status(200).json({ message: 'Stat deleted' });
  } catch (err) {
    next(err);
  }
};
