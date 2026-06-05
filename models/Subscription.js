const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
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
    api_key: {
        type: String,
        required: true,
        unique: true
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    end_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
