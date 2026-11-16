'use strict';

const { pool, buildUpdate } = require('../config/db');

const FIELDS = [
  'title',
  'subtitle',
  'date',
  'platform',
  'time_slot',
  'duration',
  'language',
  'price',
  'cta_link',
  'seats_note',
  'is_active',
];

// Priority rule: the active workshop flagged is_priority; otherwise the first active one; otherwise the first row.
const PRIORITY_SQL = `SELECT * FROM workshop
  ORDER BY (is_active = TRUE AND is_priority = TRUE) DESC, is_active DESC, id ASC LIMIT 1`;

const findById = async (conn, id) => {
  const [rows] = await conn.query('SELECT * FROM workshop WHERE id = ?', [id]);
  return rows[0];
};

/** GET /api/workshop — the priority workshop (drives the hero, header price, CTAs). */
exports.getWorkshop = async (req, res, next) => {
  try {
    const [rows] = await pool.query(PRIORITY_SQL);
    if (rows.length === 0) return res.status(404).json({ error: 'Workshop not found' });
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/** GET /api/workshop/list — public: active workshops, priority first. Admin (?all=true): everything. */
exports.listWorkshops = async (req, res, next) => {
  try {
    const where = req.query.all === 'true' && Boolean(req.user) ? '' : 'WHERE is_active = TRUE';
    const [rows] = await pool.query(`SELECT * FROM workshop ${where} ORDER BY is_priority DESC, id ASC`);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createWorkshop = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const data = {};
    FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    const makePriority = req.body.is_priority === true;

    await conn.beginTransaction();
    if (makePriority) await conn.query('UPDATE workshop SET is_priority = FALSE');
    const cols = [...Object.keys(data), 'is_priority'];
    const vals = [...Object.values(data), makePriority];
    const [result] = await conn.query(
      `INSERT INTO workshop (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      vals
    );
    await conn.commit();
    res.status(201).json(await findById(pool, result.insertId));
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.updateWorkshop = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const id = req.params.id;
    const { sets, values } = buildUpdate(FIELDS, req.body);
    const wantsPriority = req.body.is_priority === true;
    if (sets.length === 0 && !wantsPriority) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    await conn.beginTransaction();
    if (!(await findById(conn, id))) {
      await conn.rollback();
      return res.status(404).json({ error: 'Workshop not found' });
    }
    if (wantsPriority) {
      await conn.query('UPDATE workshop SET is_priority = (id = ?)', [id]);
    }
    if (sets.length > 0) {
      await conn.query(`UPDATE workshop SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }
    await conn.commit();
    res.status(200).json(await findById(pool, id));
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.deleteWorkshop = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM workshop');
    if (total <= 1) {
      return res.status(400).json({ error: 'You need at least one workshop. Edit it instead of deleting it.' });
    }
    const [result] = await pool.query('DELETE FROM workshop WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Workshop not found' });
    res.status(200).json({ message: 'Workshop deleted' });
  } catch (err) {
    next(err);
  }
};
