'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const {
  getCurriculum,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} = require('../controllers/curriculumController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorMiddleware');

const router = express.Router();

const idRule = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

const createRules = [
  body('module_no').isInt({ min: 1, max: 1000 }).withMessage('module_no must be a positive integer').toInt(),
  body('title').isString().trim().isLength({ min: 1, max: 100 }).withMessage('title is required (max 100 chars)'),
  body('description').isString().trim().isLength({ min: 1, max: 5000 }).withMessage('description is required (max 5000 chars)'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean').toBoolean(),
];

const updateRules = [
  idRule,
  body('module_no').optional().isInt({ min: 1, max: 1000 }).toInt(),
  body('title').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().trim().isLength({ min: 1, max: 5000 }),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean').toBoolean(),
];

router.get('/', authMiddleware.adminAllAccess, getCurriculum);
router.post('/', authMiddleware, createRules, validate, createModule);
const reorderRules = [
  body('ids').isArray({ min: 1, max: 200 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isInt({ min: 1 }).withMessage('each id must be a positive integer').toInt(),
];
// Must be registered before '/:id'.
router.put('/reorder', authMiddleware, reorderRules, validate, reorderModules);
router.put('/:id', authMiddleware, updateRules, validate, updateModule);
router.delete('/:id', authMiddleware, idRule, validate, deleteModule);

module.exports = router;
