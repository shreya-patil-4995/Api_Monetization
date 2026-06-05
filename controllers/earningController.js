const earningService = require('../services/earningService');
const User = require('../models/User');

class EarningController {

    /**
     * GET /api/earnings/my
     * Provider sees their own earnings + wallet balance.
     */
    async getMyEarnings(req, res) {
        try {
            const data = await earningService.getProviderEarnings(req.user.id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('getMyEarnings error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/earnings/platform
     * Platform owner sees all commissions. Role: platform_owner only.
     */
    async getPlatformEarnings(req, res) {
        try {
            if (req.user.role !== 'platform_owner') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Platform owner only.'
                });
            }
            const data = await earningService.getPlatformEarnings();
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('getPlatformEarnings error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/earnings/wallet
     * Any logged-in user sees their wallet balance.
     */
    async getWalletBalance(req, res) {
        try {
            const user = await User.findById(req.user.id).select('wallet_balance name email role');
            res.status(200).json({
                success: true,
                data: {
                    wallet_balance: user.wallet_balance,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/earnings/config
     * Public: anyone can see the current platform fee rate.
     */
    async getPlatformConfig(req, res) {
        try {
            const config = await earningService.getPlatformConfig();
            res.status(200).json({
                success: true,
                data: {
                    platform_fee_rate: config.platform_fee_rate,
                    platform_name: config.platform_name
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * PUT /api/earnings/config
     * Platform owner only: update fee rate / owner account.
     * Body: { fee_rate?, platform_owner_id? }
     */
    async updatePlatformConfig(req, res) {
        try {
            if (req.user.role !== 'platform_owner') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Platform owner only.'
                });
            }

            const { fee_rate, platform_owner_id } = req.body;
            const config = await earningService.updatePlatformConfig({ fee_rate, platform_owner_id });

            res.status(200).json({
                success: true,
                message: 'Platform config updated successfully',
                data: config
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/earnings/set-platform-owner
     * One-time setup: designates a user as platform_owner.
     * Requires a PLATFORM_SETUP_SECRET env variable to secure it.
     * Body: { user_id, setup_secret }
     */
    async setPlatformOwner(req, res) {
        try {
            const { user_id, setup_secret } = req.body;

            if (!setup_secret || setup_secret !== process.env.PLATFORM_SETUP_SECRET) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid setup secret.'
                });
            }

            const config = await earningService.updatePlatformConfig({ platform_owner_id: user_id });

            res.status(200).json({
                success: true,
                message: 'Platform owner set successfully. This user now receives all platform commissions.',
                data: {
                    platform_owner_id: config.platform_owner_id,
                    platform_fee_rate: config.platform_fee_rate
                }
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new EarningController();
