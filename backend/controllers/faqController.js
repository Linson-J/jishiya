'use strict';

const { pool, buildUpdate } = require('../config/db');

const FIELDS = ['question', 'answer', 'sort_order', 'is_active'];

exports.getFaqs = async (req, res, next) => {
  try {
    // Admins (authenticated + ?all=true) also get inactive rows and the is_active flag.
    const isAdminView = Boolean(req.user) && req.query.all === 'true';
    const [rows] = await pool.query(
      `SELECT id, question, answer, is_active, sort_order
         FROM faq
        ${isAdminView ? '' : 'WHERE is_active = TRUE'}
        ORDER BY sort_order ASC, id ASC`
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createFaq = async (req, res, next) => {
  try {
    const { question, answer } = req.body;
    const sortOrder = req.body.sort_order !== undefined ? req.body.sort_order : 0;
    const isActive = req.body.is_active !== undefined ? req.body.is_active : true;

    const [result] = await pool.query(
      'INSERT INTO faq (question, answer, sort_order, is_active) VALUES (?, ?, ?, ?)',
      [question, answer, sortOrder, isActive]
    );

    const [rows] = await pool.query('SELECT * FROM faq WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateFaq = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sets, values } = buildUpdate(FIELDS, req.body);
    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const [result] = await pool.query(`UPDATE faq SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    const [rows] = await pool.query('SELECT * FROM faq WHERE id = ?', [id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteFaq = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM faq WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    res.status(200).json({ message: 'FAQ deleted' });
  } catch (err) {
    next(err);
  }
};
