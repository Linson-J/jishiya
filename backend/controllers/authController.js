'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Compared against when the email is unknown so response time doesn't reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query('SELECT id, email, password FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];

    const hash = user ? user.password : DUMMY_HASH;
    const match = await bcrypt.compare(password, hash);

    if (!user || !match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });

    return res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
};

// Reached only if authMiddleware accepted the token.
exports.verify = (req, res) => {
  res.status(200).json({ valid: true });
};
