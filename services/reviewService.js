const mongoose = require('mongoose');
const Review = require('../models/Review');
const Subscription = require('../models/Subscription');

class ReviewService {

  async createReview(userId, apiId, { rating, title, comment }) {
    // Check if user already reviewed this API
    const existing = await Review.findOne({ user_id: userId, api_id: apiId });
    if (existing) throw new Error('You have already reviewed this API');

    // Any subscription status counts — expired buyers can also review
    const subscription = await Subscription.findOne({
      user_id: userId,
      api_id: apiId
    });

    if (!subscription) {
      throw new Error('You must purchase this API before leaving a review');
    }

    const review = await Review.create({
      api_id: apiId,
      user_id: userId,
      rating,
      title,
      comment,
      verified_purchase: true
    });

    await this.updateApiRating(apiId);

    return await Review.findById(review._id).populate('user_id', 'name');
  }

  async getApiReviews(apiId) {
    const reviews = await Review.find({ api_id: apiId })
      .populate('user_id', 'name')
      .sort({ createdAt: -1 });

    // Calculate average rating and distribution
    const total = reviews.length;
    const avgRating = total > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : 0;

    const distribution = [5,4,3,2,1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
      percent: total > 0
        ? Math.round((reviews.filter(r => r.rating === star).length / total) * 100)
        : 0
    }));

    return { reviews, avgRating: parseFloat(avgRating), total, distribution };
  }

  async updateReview(reviewId, userId, { rating, title, comment }) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error('Review not found');
    if (review.user_id.toString() !== userId) throw new Error('Not authorized');

    review.rating = rating ?? review.rating;
    review.title = title ?? review.title;
    review.comment = comment ?? review.comment;
    await review.save();

    await this.updateApiRating(review.api_id);

    return await Review.findById(reviewId).populate('user_id', 'name');
  }

  async deleteReview(reviewId, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error('Review not found');
    if (review.user_id.toString() !== userId) throw new Error('Not authorized');
    
    const apiId = review.api_id;
    await Review.findByIdAndDelete(reviewId);
    await this.updateApiRating(apiId);
    
    return true;
  }

  async getUserReview(userId, apiId) {
    return await Review.findOne({ user_id: userId, api_id: apiId });
  }

  // Call this after any review change
  async updateApiRating(apiId) {
    const API = require('../models/API');
    const stats = await Review.aggregate([
      { $match: { api_id: new mongoose.Types.ObjectId(apiId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const avg = stats[0] ? parseFloat(stats[0].avg.toFixed(1)) : 0;
    const count = stats[0] ? stats[0].count : 0;

    await API.findByIdAndUpdate(apiId, { avg_rating: avg, review_count: count });
  }
}

module.exports = new ReviewService();
