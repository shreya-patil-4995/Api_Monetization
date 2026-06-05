const Usage = require('../models/Usage');

const MAX_REQUESTS_PER_DAY = 1000;

const rateLimiter = async (req, res, next) => {
    const apiKey = req.apiKey || req.headers['x-api-key'];

    if (!apiKey) return next();

    try {
        const today = new Date();
        let usage = await Usage.findOne({ api_key: apiKey });

        if (!usage) {
            // First ever request with this key
            usage = await Usage.create({
                api_key: apiKey,
                request_count: 1,
                last_used: today
            });
        } else {
            const lastUsed = new Date(usage.last_used);
            const isSameDay = today.toDateString() === lastUsed.toDateString();

            if (isSameDay) {
                // Same day — check limit BEFORE incrementing
                if (usage.request_count >= MAX_REQUESTS_PER_DAY) {
                    return res.status(429).json({
                        success: false,
                        message: `Rate limit exceeded. Max ${MAX_REQUESTS_PER_DAY} requests per day.`,
                        limit: MAX_REQUESTS_PER_DAY,
                        used: usage.request_count,
                        resets_at: 'midnight'
                    });
                }
                usage.request_count += 1;
                usage.last_used = today;
            } else {
                // New day — reset counter
                usage.request_count = 1;
                usage.last_used = today;
            }

            await usage.save();
        }

        // Attach usage info to req for logging/response headers
        req.usage = usage;

        // Optional: add rate limit headers so buyer knows their usage
        res.set('X-RateLimit-Limit', MAX_REQUESTS_PER_DAY);
        res.set('X-RateLimit-Remaining', MAX_REQUESTS_PER_DAY - usage.request_count);

        next();
    } catch (error) {
        console.error('rateLimitMiddleware error:', error.message);
        res.status(500).json({ success: false, message: 'Error checking rate limit.' });
    }
};

// Export as direct function — NOT as { rateLimiter }
module.exports = rateLimiter;