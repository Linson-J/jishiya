'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const { getStats, updateStat, createStat, deleteStat } = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorMiddleware');

const router = express.Router();

const rules = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt(),
  body('value').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('label').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('sort_order').optional().isInt({ min: 0, max: 100000 }).toInt(),
];

const createRules = [
  body('label').isString().trim().isLength({ min: 1, max: 100 }).withMessage('label is required (max 100 chars)'),
  body('value').isString().trim().isLength({ min: 1, max: 50 }).withMessage('value is required (max 50 chars)'),
  body('sort_order').optional().isInt({ min: 0, max: 100000 }).toInt(),
];
const idRule = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

router.get('/', getStats);
router.post('/', authMiddleware, createRules, validate, createStat);
router.delete('/:id', authMiddleware, idRule, validate, deleteStat);
router.put('/:id', authMiddleware, rules, validate, updateStat);

module.exports = router;
