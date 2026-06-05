const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    api_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'API',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    razorpay_order_id: {
        type: String,
        required: true
    },
    razorpay_payment_id: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    // Platform commission breakdown (populated after payment success)
    platform_fee_rate: {
        type: Number,
        default: 0           // e.g. 10 means 10%
    },
    platform_fee: {
        type: Number,
        default: 0           // amount taken by platform (INR)
    },
    provider_earning: {
        type: Number,
        default: 0           // amount credited to provider wallet (INR)
    },
    platform_commission: {
        type: Number,   // 10% of amount
        default: 0
    },
    seller_amount: {
        type: Number,   // 90% of amount
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
