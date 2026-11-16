'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');
const { getGallery, uploadImage, updateImage, deleteImage } = require('../controllers/galleryController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/errorMiddleware');

const router = express.Router();

const CATEGORIES = ['portrait', 'workshop', 'logo'];

const listRules = [
  query('category').optional().isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(', ')}`),
];

// These run AFTER multer (so multipart fields are parsed). The controller reads
// the result with validationResult() so it can delete the temp file on failure.
const uploadRules = [
  body('category').isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(', ')}`),
  body('caption').optional().isString().trim().isLength({ max: 255 }),
  body('sort_order').optional().isInt({ min: 0, max: 100000 }).toInt(),
];

const idRule = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

router.get('/', listRules, validate, getGallery);

// Auth first so anonymous users can never write to disk.
// Form fields: image (file), category, caption (optional), sort_order (optional).
router.post('/upload', authMiddleware, upload.single('image'), uploadRules, uploadImage);

// Edit caption / order, optionally replacing the image. Multer runs before the rules (multipart).
const updateRules = [
  idRule,
  body('caption').optional().isString().trim().isLength({ max: 255 }),
  body('sort_order').optional().isInt({ min: 0, max: 100000 }).toInt(),
];
router.put('/:id', authMiddleware, upload.single('image'), updateRules, updateImage);

router.delete('/:id', authMiddleware, idRule, validate, deleteImage);

module.exports = router;
