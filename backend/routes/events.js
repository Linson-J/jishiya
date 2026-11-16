'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorMiddleware');

const router = express.Router();

const SAFE_LINK = /^(https?:\/\/[^\s]+|[#/][^\s]*)$/i;
const idRule = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

const optionalText = (field, max) => body(field).optional({ values: 'falsy' }).isString().trim().isLength({ max });
const linkRule = body('link')
  .optional({ values: 'falsy' })
  .isString()
  .trim()
  .isLength({ max: 255 })
  .matches(SAFE_LINK)
  .withMessage('link must be an http(s) URL, a relative path, or an anchor');

const createRules = [
  body('title').isString().trim().isLength({ min: 1, max: 255 }).withMessage('title is required (max 255 chars)'),
  body('event_date').isISO8601({ strict: true }).withMessage('event_date must be a valid date (YYYY-MM-DD)'),
  optionalText('event_time', 100),
  optionalText('location', 255),
  optionalText('description', 5000),
  linkRule,
  body('is_active').optional().isBoolean().toBoolean(),
];

const updateRules = [
  idRule,
  body('title').optional().isString().trim().isLength({ min: 1, max: 255 }),
  body('event_date').optional().isISO8601({ strict: true }),
  optionalText('event_time', 100),
  optionalText('location', 255),
  optionalText('description', 5000),
  linkRule,
  body('is_active').optional().isBoolean().toBoolean(),
];

// Public: active + upcoming only. Admin: ?all=true (authenticated) returns everything.
router.get('/', authMiddleware.adminAllAccess, getEvents);
router.post('/', authMiddleware, createRules, validate, createEvent);
router.put('/:id', authMiddleware, updateRules, validate, updateEvent);
router.delete('/:id', authMiddleware, idRule, validate, deleteEvent);

module.exports = router;
