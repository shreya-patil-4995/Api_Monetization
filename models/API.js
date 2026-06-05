const mongoose = require('mongoose');

const ApiSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add an API name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    endpoint_url: {
        type: String,
        required: [true, 'Please add an endpoint URL']
    },
    pricing: {
        type: Number,
        required: [true, 'Please add pricing']
    },
    duration_days: {
        type: Number,
        default: 30          // 30 days subscription by default
    },
    category: {
        type: String,
        default: 'General'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listing_fee_paid: {
        type: Boolean,
        default: false
    },
    readme: {
        type: String,
        default: null
    },
    readme_filename: {
        type: String,
        default: null
    },
    avg_rating: {
        type: Number,
        default: 0
    },
    review_count: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('API', ApiSchema);