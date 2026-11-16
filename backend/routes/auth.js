'use strict';

const express = require('express');
const { body } = require('express-validator');
const { login, verify } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorMiddleware');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isString().trim().toLowerCase().isEmail().withMessage('A valid email is required').isLength({ max: 255 }),
    // bcrypt only uses the first 72 bytes; cap length to avoid needless hashing work.
    body('password').isString().withMessage('Password is required').isLength({ min: 1, max: 72 }).withMessage('Password must be 1-72 characters'),
  ],
  validate,
  login
);

router.get('/verify', authMiddleware, verify);

module.exports = router;
