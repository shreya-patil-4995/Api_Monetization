const mongoose = require('mongoose');
const razorpayInstance = require('../config/razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const API = require('../models/API');
const subscriptionService = require('./subscriptionService');
const earningService = require('./earningService');
const LISTING_FEE = 199; // ₹199 to list an API

class PaymentService {

    /**
     * Creates a Razorpay order and saves a pending Payment record.
     * @param {string} userId
     * @param {string} apiId
     * @returns {{ order, payment }} — Razorpay order + saved Payment doc
     */
    async createOrder(userId, apiId) {
        // 0. Validate ID
        if (!mongoose.Types.ObjectId.isValid(apiId)) {
            throw new Error('Invalid API ID format');
        }

        // 1. Fetch the API to get its real price
        const api = await API.findById(apiId);
        if (!api) throw new Error('API not found');
        if (!api.is_active) throw new Error('This API is no longer available');

        const amountInPaise = Math.round(api.pricing * 100); // INR → paise
        console.log(`Creating Razorpay order for API ${apiId}, Amount: ${amountInPaise} paise`);

        // 2. Create Razorpay order
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${userId.toString().slice(-4)}`
        };

        let order;
        try {
            order = await razorpayInstance.orders.create(options);
            console.log('Razorpay order created:', order.id);
        } catch (rzpError) {
            console.error('Razorpay SDK Error:', rzpError);
            throw new Error(`Razorpay Error: ${rzpError.description || rzpError.message}`);
        }

        // 3. Save a pending Payment record
        const payment = await Payment.create({
            user_id: userId,
            api_id: apiId,
            amount: api.pricing,
            razorpay_order_id: order.id,
            status: 'pending'
        });

        return { order, payment, key_id: process.env.RAZORPAY_KEY_ID };
    }


    async createListingFeeOrder(userId, apiId) {
        const api = await API.findById(apiId);
        if (!api) throw new Error('API not found');
        if (api.owner_id.toString() !== userId) throw new Error('Not your API');
        if (api.listing_fee_paid) throw new Error('Listing fee already paid');

        // Create Razorpay order for listing fee
        const order = await razorpayInstance.orders.create({
            amount: LISTING_FEE * 100,  // in paise
            currency: 'INR',
            receipt: `listing_${apiId}`
        });

        return { order_id: order.id, amount: LISTING_FEE, api_id: apiId };
    }

    async verifyListingFee(razorpay_order_id, razorpay_payment_id, razorpay_signature, apiId) {
        // HMAC verify same as regular payment
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            throw new Error('Invalid payment signature. Payment verification failed.');
        }

        // Activate the API
        await API.findByIdAndUpdate(apiId, {
            listing_fee_paid: true,
            is_active: true
        });

        return { message: 'API is now live on marketplace', api_id: apiId };
    }
    /**
     * Verifies Razorpay payment signature, updates Payment to success,
     * creates subscription, and returns api_key + end_date.
     * @param {object} data
     * @param {string} data.razorpay_order_id
     * @param {string} data.razorpay_payment_id
     * @param {string} data.razorpay_signature
     * @param {string} data.userId
     * @param {string} data.apiId
     */
    async verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, apiId }) {
        // 1. HMAC-SHA256 signature verification
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            // Mark payment as failed
            await Payment.findOneAndUpdate(
                { razorpay_order_id },
                { status: 'failed' }
            );
            throw new Error('Invalid payment signature. Payment verification failed.');
        }

        const payment = await Payment.findOne({ razorpay_order_id });
        const amount = payment.amount;

        // Calculate split
        const COMMISSION_PERCENT = 10;
        const platformCut = (amount * COMMISSION_PERCENT) / 100;
        const sellerCut = amount - platformCut;

        // Update payment with split
        payment.status = 'success';
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.platform_commission = platformCut;
        payment.seller_amount = sellerCut;
        await payment.save();

        // Create subscription for buyer
        const subscription = await subscriptionService.createSubscription(userId, apiId);

        return {
            api_key: subscription.api_key,
            end_date: subscription.end_date,
            subscription_id: subscription._id,
            amount_paid: amount,
            seller_receives: sellerCut,
            platform_commission: platformCut

        };
    }

    /**
     * Get all payments for a user.
     */
    async getUserPayments(userId) {
        return await Payment.find({ user_id: userId })
            .populate('api_id', 'name description pricing category')
            .sort({ createdAt: -1 });
    }

    /**
     * Get a single payment by ID, scoped to user.
     */
    async getPaymentById(id, userId) {
        const payment = await Payment.findById(id)
            .populate('api_id', 'name description pricing');

        if (!payment) throw new Error('Payment not found');
        if (payment.user_id.toString() !== userId) {
            throw new Error('Not authorized to view this payment');
        }

        return payment;
    }
}

module.exports = new PaymentService();
