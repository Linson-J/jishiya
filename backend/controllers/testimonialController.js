'use strict';

const { pool, buildUpdate } = require('../config/db');

const FIELDS = ['name', 'location', 'review', 'rating', 'is_active', 'sort_order'];

exports.getTestimonials = async (req, res, next) => {
  try {
    // Admins (authenticated + ?all=true) also get inactive rows and the is_active flag.
    const isAdminView = Boolean(req.user) && req.query.all === 'true';
    const [rows] = await pool.query(
      `SELECT id, name, location, review, rating, is_active, sort_order, created_at
         FROM testimonials
        ${isAdminView ? '' : 'WHERE is_active = TRUE'}
        ORDER BY sort_order ASC, id ASC`
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createTestimonial = async (req, res, next) => {
  try {
    const { name, location, review } = req.body;
    const rating = req.body.rating !== undefined ? req.body.rating : 5;
    const isActive = req.body.is_active !== undefined ? req.body.is_active : true;
    const sortOrder = req.body.sort_order !== undefined ? req.body.sort_order : 0;

    const [result] = await pool.query(
      `INSERT INTO testimonials (name, location, review, rating, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, location, review, rating, isActive, sortOrder]
    );

    const [rows] = await pool.query('SELECT * FROM testimonials WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sets, values } = buildUpdate(FIELDS, req.body);
    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const [result] = await pool.query(`UPDATE testimonials SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    const [rows] = await pool.query('SELECT * FROM testimonials WHERE id = ?', [id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteTestimonial = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.status(200).json({ message: 'Testimonial deleted' });
  } catch (err) {
    next(err);
  }
};
