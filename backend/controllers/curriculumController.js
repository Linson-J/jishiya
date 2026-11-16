'use strict';

const { pool, buildUpdate } = require('../config/db');

const FIELDS = ['module_no', 'title', 'description', 'is_active'];

exports.getCurriculum = async (req, res, next) => {
  try {
    // Admins (authenticated + ?all=true) also get inactive rows and the is_active flag.
    const isAdminView = Boolean(req.user) && req.query.all === 'true';
    const [rows] = await pool.query(
      `SELECT id, module_no, title, description, is_active
         FROM curriculum
        ${isAdminView ? '' : 'WHERE is_active = TRUE'}
        ORDER BY module_no ASC, id ASC`
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createModule = async (req, res, next) => {
  try {
    const { module_no: moduleNo, title, description } = req.body;
    const isActive = req.body.is_active !== undefined ? req.body.is_active : true;

    const [result] = await pool.query(
      'INSERT INTO curriculum (module_no, title, description, is_active) VALUES (?, ?, ?, ?)',
      [moduleNo, title, description, isActive]
    );

    const [rows] = await pool.query('SELECT * FROM curriculum WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sets, values } = buildUpdate(FIELDS, req.body);
    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const [result] = await pool.query(`UPDATE curriculum SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Curriculum module not found' });
    }

    const [rows] = await pool.query('SELECT * FROM curriculum WHERE id = ?', [id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM curriculum WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Curriculum module not found' });
    }
    res.status(200).json({ message: 'Curriculum module deleted' });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/curriculum/reorder { ids: [3,1,2] } — renumbers module_no to 1..n in that order. */
exports.reorderModules = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const ids = req.body.ids;
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ error: 'ids must be unique' });
    }
    await conn.beginTransaction();
    for (let i = 0; i < ids.length; i += 1) {
      await conn.query('UPDATE curriculum SET module_no = ? WHERE id = ?', [i + 1, ids[i]]);
    }
    await conn.commit();
    const [rows] = await pool.query(
      'SELECT id, module_no, title, description, is_active FROM curriculum ORDER BY module_no ASC, id ASC'
    );
    res.status(200).json(rows);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
