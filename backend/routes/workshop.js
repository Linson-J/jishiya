'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const {
  getWorkshop,
  listWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
} = require('../controllers/workshopController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorMiddleware');

const router = express.Router();

// Only absolute http(s) URLs, site-relative paths, or in-page anchors. Blocks "javascript:" etc.
const SAFE_LINK = /^(https?:\/\/[^\s]+|[#/][^\s]*)$/i;
const idRule = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

const text = (field, max, required) => {
  const chain = required ? body(field) : body(field).optional();
  return chain.isString().trim().isLength({ min: 1, max });
};

const fieldRules = (required) => [
  text('title', 255, required),
  text('subtitle', 5000, required),
  text('date', 100, required),
  text('platform', 100, required),
  text('time_slot', 100, required),
  text('duration', 50, required),
  text('language', 50, required),
  text('price', 50, required),
  (required ? body('cta_link') : body('cta_link').optional())
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .matches(SAFE_LINK)
    .withMessage('cta_link must be an http(s) URL, a relative path, or an anchor'),
  text('seats_note', 100, required),
  body('is_active').optional().isBoolean().toBoolean(),
  body('is_priority').optional().isBoolean().toBoolean(),
];

// Public: the priority workshop (hero, header price, CTAs) and the list of active workshops.
router.get('/', getWorkshop);
router.get('/list', authMiddleware.adminAllAccess, listWorkshops);

// Admin
router.post('/', authMiddleware, fieldRules(true), validate, createWorkshop);
router.put('/:id', authMiddleware, idRule, fieldRules(false), validate, updateWorkshop);
router.delete('/:id', authMiddleware, idRule, validate, deleteWorkshop);

module.exports = router;
