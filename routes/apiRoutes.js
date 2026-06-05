const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const apiController = require('../controllers/apiController');

const router = express.Router();

// Get all APIs (public)
router.get('/', apiController.getAllAPIs);

// Get user's APIs (protected) — must be before /:id to avoid conflict
router.get('/user/my-apis', authMiddleware, apiController.getUserAPIs);

// Search APIs (public)
router.get('/search/:query', apiController.searchAPIs);

// Get API by ID (public)
router.get('/:id', apiController.getAPIById);

// Create new API (protected - providers only)
router.post('/', authMiddleware, upload.single('readme'), [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('API name is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('endpoint_url')
    .isURL()
    .withMessage('Valid endpoint URL is required'),
  body('pricing')
    .isNumeric()
    .withMessage('Pricing must be a number'),
  body('duration_days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (days)'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty if provided')
], apiController.createAPI);

// Update API (protected - only owner)
router.put('/:id', authMiddleware, upload.single('readme'), [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('API name cannot be empty'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('endpoint_url')
    .optional()
    .isURL()
    .withMessage('Valid endpoint URL is required'),
  body('pricing')
    .optional()
    .isNumeric()
    .withMessage('Pricing must be a number'),
  body('duration_days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (days)'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty if provided')
], apiController.updateAPI);

// Delete API (protected - only owner)
router.delete('/:id', authMiddleware, apiController.deleteAPI);

// Get README
router.get('/:id/readme', apiController.getReadme);

module.exports = router;