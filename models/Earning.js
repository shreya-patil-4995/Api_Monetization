const mongoose = require('mongoose');

/**
 * Earning — immutable audit trail of every credit/debit to any wallet.
 *
 * Every successful subscription payment creates TWO Earning records:
 *   1. type='provider_credit'  → provider gets their share
 *   2. type='platform_credit'  → platform owner gets the commission
 *
 * Future: withdrawal creates type='withdrawal' (debit).
 */
const EarningSchema = new mongoose.Schema({
    // Who received / was debited this money
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Which API sale triggered this earning
    api_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'API',
        required: true
    },
    // The payment that triggered this earning
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    // Who bought this API (for context / admin views)
    buyer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Full subscription price paid by the buyer (INR)
    gross_amount: {
        type: Number,
        required: true
    },
    // Platform commission deducted (INR)
    platform_fee: {
        type: Number,
        required: true
    },
    // Actual amount credited to this user's wallet (INR)
    net_amount: {
        type: Number,
        required: true
    },
    // Fee rate applied (e.g. 10)
    platform_fee_rate: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['provider_credit', 'platform_credit', 'withdrawal'],
        required: true
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed'],
        default: 'completed'
    },
    // Human-readable description
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for fast provider earnings queries
EarningSchema.index({ user_id: 1, createdAt: -1 });
EarningSchema.index({ payment_id: 1 });

module.exports = mongoose.model('Earning', EarningSchema);
