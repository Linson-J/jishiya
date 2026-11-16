'use strict';

const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * The token must be HS256-signed with JWT_SECRET, unexpired, and belong to a
 * user that still exists in the database.
 */
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return res.status(401).json({ error: message });
    }

    const [rows] = await pool.query('SELECT id, email FROM users WHERE id = ? LIMIT 1', [payload.id]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { id: rows[0].id, email: rows[0].email };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Public list endpoints only return active rows. The admin dashboard sends
 * "?all=true" plus its Bearer token to also see inactive rows (so they can be
 * re-activated). Without "all=true" the request stays fully public.
 */
function adminAllAccess(req, res, next) {
  if (req.query.all === 'true') return authMiddleware(req, res, next);
  return next();
}

module.exports = authMiddleware;
module.exports.adminAllAccess = adminAllAccess;
