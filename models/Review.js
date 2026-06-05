const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  api_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'API',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  verified_purchase: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// One review per user per API
ReviewSchema.index({ api_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
