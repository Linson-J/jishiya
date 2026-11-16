'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const { getFaqs, createFaq, updateFaq, deleteFaq } = require('../controllers/faqController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorMiddleware');

const router = express.Router();

const idRule = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

const createRules = [
  body('question').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('question is required (max 1000 chars)'),
  body('answer').isString().trim().isLength({ min: 1, max: 5000 }).withMessage('answer is required (max 5000 chars)'),
  body('sort_order').optional().isInt({ min: 0, max: 100000 }).toInt(),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean').toBoolean(),
];

const updateRules = [
  idRule,
  body('question').optional().isString().trim().isLength({ min: 1, max: 1000 }),
  body('answer').optional().isString().trim().isLength({ min: 1, max: 5000 }),
  body('sort_order').optional().isInt({ min: 0, max: 100000 }).toInt(),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean').toBoolean(),
];

router.get('/', authMiddleware.adminAllAccess, getFaqs);
router.post('/', authMiddleware, createRules, validate, createFaq);
router.put('/:id', authMiddleware, updateRules, validate, updateFaq);
router.delete('/:id', authMiddleware, idRule, validate, deleteFaq);

module.exports = router;
