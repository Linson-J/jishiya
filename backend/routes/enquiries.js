'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  createEnquiry,
  listEnquiries,
  unreadCount,
  setRead,
  markAllRead,
  deleteEnquiry,
} = require('../controllers/enquiryController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorMiddleware');

const router = express.Router();

// Public form: at most 5 submissions / hour / IP in production.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 5 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You have sent several messages already. Please try again later.' },
});

const idRule = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

const PHONE = /^\+?[0-9][0-9\s().-]{5,28}$/;

const submitRules = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Please enter your name'),
  body('email')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 255 })
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('phone')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .matches(PHONE)
    .withMessage('Please enter a valid phone number'),
  body('message').isString().trim().isLength({ min: 1, max: 2000 }).withMessage('Please enter your message (max 2000 characters)'),
  body().custom((value) => {
    const hasEmail = typeof value.email === 'string' && value.email.trim() !== '';
    const hasPhone = typeof value.phone === 'string' && value.phone.trim() !== '';
    if (!hasEmail && !hasPhone) throw new Error('Please enter an email address or a phone number');
    return true;
  }),
];

// Public
router.post('/', submitLimiter, submitRules, validate, createEnquiry);

// Admin
router.get('/unread-count', authMiddleware, unreadCount);
router.get('/', authMiddleware, [query('status').optional().isIn(['all', 'unread', 'read'])], validate, listEnquiries);
router.put('/read-all', authMiddleware, markAllRead);
router.put('/:id', authMiddleware, idRule, body('is_read').isBoolean().toBoolean(), validate, setRead);
router.delete('/:id', authMiddleware, idRule, validate, deleteEnquiry);

module.exports = router;
