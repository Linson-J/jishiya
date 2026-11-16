'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require('../controllers/testimonialController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorMiddleware');

const router = express.Router();

const idRule = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

const createRules = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('name is required (max 100 chars)'),
  body('location').isString().trim().isLength({ min: 1, max: 100 }).withMessage('location is required (max 100 chars)'),
  body('review').isString().trim().isLength({ min: 1, max: 2000 }).withMessage('review is required (max 2000 chars)'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating must be 1-5').toInt(),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean').toBoolean(),
  body('sort_order').optional().isInt({ min: 0, max: 100000 }).toInt(),
];

const updateRules = [
  idRule,
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('location').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('review').optional().isString().trim().isLength({ min: 1, max: 2000 }),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating must be 1-5').toInt(),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean').toBoolean(),
  body('sort_order').optional().isInt({ min: 0, max: 100000 }).toInt(),
];

router.get('/', authMiddleware.adminAllAccess, getTestimonials);
router.post('/', authMiddleware, createRules, validate, createTestimonial);
router.put('/:id', authMiddleware, updateRules, validate, updateTestimonial);
router.delete('/:id', authMiddleware, idRule, validate, deleteTestimonial);

module.exports = router;
