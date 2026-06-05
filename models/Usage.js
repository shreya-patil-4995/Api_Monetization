const mongoose = require('mongoose');

const UsageSchema = new mongoose.Schema({
    api_key: {
        type: String,
        required: true
    },
    request_count: {
        type: Number,
        default: 0
    },
    last_used: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Usage', UsageSchema);
