const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const API = require('../models/API');
const User = require('../models/User');

// Protect all admin routes — only admin role can access
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access only' });
    }
    next();
};

// GET /api/admin/earnings
router.get('/earnings', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const earnings = await Payment.aggregate([
            { $match: { status: 'success' } },
            {
                $group: {
                    _id: null,
                    total_collected: { $sum: '$amount' },
                    total_commission: { $sum: '$platform_commission' },
                    total_to_sellers: { $sum: '$seller_amount' },
                    total_transactions: { $sum: 1 }
                }
            }
        ]);

        // Bonus stats
        const totalSellers = await User.countDocuments({ role: 'provider' });
        const totalBuyers = await User.countDocuments({ role: 'consumer' });
        const totalApis = await API.countDocuments({ is_active: true });

        res.json({
            success: true,
            earnings: earnings[0] || {
                total_collected: 0,
                total_commission: 0,
                total_to_sellers: 0,
                total_transactions: 0
            },
            platform_stats: {
                total_sellers: totalSellers,
                total_buyers: totalBuyers,
                total_active_apis: totalApis
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;