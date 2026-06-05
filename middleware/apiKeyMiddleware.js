const Subscription = require('../models/Subscription');

const apiKeyAuth = async (req, res, next) => {
  try {
    // 1. Extract API key from header — this is all the buyer needs to send
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required. Pass it as x-api-key header.'
      });
    }

    // 2. Find subscription by key — populate api_id to get endpoint_url
    const subscription = await Subscription.findOne({ api_key: apiKey })
      .populate('api_id')
      .populate('user_id', 'name email');

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Invalid API key. No active subscription found.'
      });
    }

    // 3. Check subscription status
    if (subscription.status === 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Subscription has been cancelled. Please subscribe again.'
      });
    }

    // 4. Check expiry — auto-update status in DB if expired
    const now = new Date();
    if (now > new Date(subscription.end_date)) {
      subscription.status = 'expired';
      await subscription.save();

      return res.status(403).json({
        success: false,
        message: 'Subscription has expired. Please renew to continue.',
        expired_at: subscription.end_date
      });
    }

    // 5. Check if the API itself is still active (seller may have deactivated it)
    if (!subscription.api_id || !subscription.api_id.is_active) {
      return res.status(403).json({
        success: false,
        message: 'The API you subscribed to is no longer available.'
      });
    }

    // 6. Attach to req — used by rateLimitMiddleware and proxy
    req.subscription = subscription;
    req.apiDoc = subscription.api_id;  // contains endpoint_url, name, pricing etc.
    req.apiKey = apiKey;

    next();

  } catch (error) {
    console.error('apiKeyMiddleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during API key validation.'
    });
  }
};

module.exports = apiKeyAuth;