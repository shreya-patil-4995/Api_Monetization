const reviewService = require('../services/reviewService');

class ReviewController {

  async createReview(req, res) {
    try {
      const { rating, title, comment } = req.body;
      if (!rating) return res.status(400).json({ success: false, message: 'Rating is required' });

      const review = await reviewService.createReview(req.user.id, req.params.apiId, { rating, title, comment });
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getApiReviews(req, res) {
    try {
      const data = await reviewService.getApiReviews(req.params.apiId);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateReview(req, res) {
    try {
      const review = await reviewService.updateReview(req.params.reviewId, req.user.id, req.body);
      res.json({ success: true, data: review });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async deleteReview(req, res) {
    try {
      await reviewService.deleteReview(req.params.reviewId, req.user.id);
      res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getMyReview(req, res) {
    try {
      const review = await reviewService.getUserReview(req.user.id, req.params.apiId);
      res.json({ success: true, data: review });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ReviewController();
