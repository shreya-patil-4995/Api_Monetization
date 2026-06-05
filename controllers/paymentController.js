const paymentService = require('../services/paymentService');
const Payment = require('../models/Payment');
const API = require('../models/API');
const Subscription = require('../models/Subscription');

class PaymentController {

    /**
     * POST /api/payments/create-order
     * Body: { api_id }
     * Returns Razorpay order details + key_id for frontend checkout
     */
    async createOrder(req, res) {
        try {
            const { api_id } = req.body;

            if (!api_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide api_id'
                });
            }

            const { order, payment, key_id } = await paymentService.createOrder(
                req.user.id,
                api_id
            );

            res.status(200).json({
                success: true,
                data: {
                    order_id: order.id,
                    amount: order.amount,          // in paise
                    currency: order.currency,
                    key_id,
                    payment_db_id: payment._id
                }
            });
        } catch (error) {
            console.error('Error in createOrder:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/payments/verify
     * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, api_id }
     * Returns: { api_key, end_date, subscription_id }
     */
    async verifyPayment(req, res) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, api_id } = req.body;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !api_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide razorpay_order_id, razorpay_payment_id, razorpay_signature, and api_id'
                });
            }

            const result = await paymentService.verifyPayment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                userId: req.user.id,
                apiId: api_id
            });

            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/payments/my
     * Returns all payments for the logged-in user
     */
    async getMyPayments(req, res) {
        try {
            const payments = await paymentService.getUserPayments(req.user.id);
            res.status(200).json({
                success: true,
                count: payments.length,
                data: payments
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/payments/:id
     */
    async getPaymentById(req, res) {
        try {
            const payment = await paymentService.getPaymentById(req.params.id, req.user.id);
            res.status(200).json({ success: true, data: payment });
        } catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }

    async payListingFee(req, res) {
        try {
            const result = await paymentService.createListingFeeOrder(
                req.user.id,
                req.params.apiId
            );
            res.json({ success: true, data: { ...result, key_id: process.env.RAZORPAY_KEY_ID } });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async verifyListingFee(req, res) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            const apiId = req.params.apiId;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !apiId) {
                return res.status(400).json({ success: false, message: 'Missing payment details' });
            }

            const result = await paymentService.verifyListingFee(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                apiId
            );

            res.json({ success: true, data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    /**
     * GET /api/payments/seller-stats
     * Returns earnings analytics for the currently logged-in provider.
     */
    async getSellerStats(req, res) {
        try {
            // Find all APIs owned by this seller
            const sellerApis = await API.find({ owner_id: req.user.id }).select('_id name pricing');
            const apiIds = sellerApis.map(a => a._id);

            // Find all successful payments for those APIs
            const payments = await Payment.find({
                api_id: { $in: apiIds },
                status: 'success'
            }).populate('api_id', 'name pricing').populate('user_id', 'name email');

            // Aggregate earnings per API
            const stats = await Payment.aggregate([
                { $match: { api_id: { $in: apiIds }, status: 'success' } },
                { $group: {
                    _id: '$api_id',
                    total_sales: { $sum: 1 },
                    total_earned: { $sum: '$seller_amount' },
                    total_revenue: { $sum: '$amount' }
                }}
            ]);

            // Count active subscriptions per API
            const subscriptions = await Subscription.aggregate([
                { $match: { api_id: { $in: apiIds }, status: 'active' } },
                { $group: { _id: '$api_id', active_subscribers: { $sum: 1 } } }
            ]);

            // Build a lookup map: apiId (string) -> name
            const apiNameMap = {};
            sellerApis.forEach(a => { apiNameMap[a._id.toString()] = a.name; });

            // Build a lookup map for active subscribers
            const subMap = {};
            subscriptions.forEach(s => { subMap[s._id.toString()] = s.active_subscribers; });

            // Enrich per-api stats with name and subscriber count
            const perApiStats = stats.map(s => ({
                api_id: s._id,
                api_name: apiNameMap[s._id.toString()] || 'Unknown',
                total_sales: s.total_sales,
                total_earned: s.total_earned,
                total_revenue: s.total_revenue,
                active_subscribers: subMap[s._id.toString()] || 0
            }));

            res.json({
                success: true,
                data: {
                    total_apis: sellerApis.length,
                    total_sales: payments.length,
                    total_earned: stats.reduce((sum, s) => sum + (s.total_earned || 0), 0),
                    per_api_stats: perApiStats,
                    recent_buyers: payments.slice(0, 10).map(p => ({
                        buyer_name: p.user_id?.name,
                        buyer_email: p.user_id?.email,
                        api_name: p.api_id?.name,
                        amount_paid: p.amount,
                        seller_received: p.seller_amount,
                        date: p.createdAt
                    }))
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new PaymentController();
