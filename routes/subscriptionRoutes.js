const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

// Create subscription — only called internally by paymentService after payment
// (kept for manual/admin use)
router.post('/', [
    authMiddleware,
    body('api_id').notEmpty().withMessage('API ID is required')
], subscriptionController.createSubscription);

// GET /api/subscriptions/my — get logged-in user's subscriptions
router.get('/my', authMiddleware, subscriptionController.getUserSubscriptions);

// GET /api/subscriptions/check/:apiId — check if user is subscribed to an API
router.get('/check/:apiId', authMiddleware, subscriptionController.checkSubscription);

// GET /api/subscriptions/:id — single subscription detail
router.get('/:id', authMiddleware, subscriptionController.getSubscriptionById);

// PUT /api/subscriptions/:id/cancel — cancel a subscription
router.put('/:id/cancel', authMiddleware, subscriptionController.cancelSubscription);

// POST /api/subscriptions/validate — validate api key (internal)
router.post('/validate', subscriptionController.validateSubscription);

module.exports = router;
