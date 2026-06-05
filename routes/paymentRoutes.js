const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

const router = express.Router();
router.post('/listing-fee/:apiId', authMiddleware, paymentController.payListingFee);
router.post('/listing-fee-verify/:apiId', authMiddleware, paymentController.verifyListingFee);
// Create Razorpay order (consumer only)
router.post('/create-order', [
    authMiddleware,
    body('api_id').notEmpty().withMessage('API ID is required')
], paymentController.createOrder);

// Verify payment + create subscription → returns api_key (consumer only)
router.post('/verify', [
    authMiddleware,
    body('razorpay_order_id').notEmpty().withMessage('razorpay_order_id is required'),
    body('razorpay_payment_id').notEmpty().withMessage('razorpay_payment_id is required'),
    body('razorpay_signature').notEmpty().withMessage('razorpay_signature is required'),
    body('api_id').notEmpty().withMessage('api_id is required')
], paymentController.verifyPayment);

// GET /api/payments/my — consumer payment history
router.get('/my', authMiddleware, paymentController.getMyPayments);

// GET /api/payments/seller-stats — provider earnings analytics
router.get('/seller-stats', authMiddleware, paymentController.getSellerStats);

// GET /api/payments/:id — single payment detail
router.get('/:id', authMiddleware, paymentController.getPaymentById);

module.exports = router;
