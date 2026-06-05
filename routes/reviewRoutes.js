const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

// GET /api/apis/:apiId/reviews — public, anyone can see reviews
router.get('/', reviewController.getApiReviews);

// GET /api/apis/:apiId/reviews/my — get logged in user's review for this API
router.get('/my', authMiddleware, reviewController.getMyReview);

// POST /api/apis/:apiId/reviews — post a review (must be logged in)
router.post('/', [
  authMiddleware,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 100 }),
  body('comment').optional().trim().isLength({ max: 1000 })
], reviewController.createReview);

// PUT /api/apis/:apiId/reviews/:reviewId — update own review
router.put('/:reviewId', authMiddleware, reviewController.updateReview);

// DELETE /api/apis/:apiId/reviews/:reviewId — delete own review
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

module.exports = router;
