const mongoose = require('mongoose');
const PlatformConfig = require('../models/PlatformConfig');
const Payment = require('../models/Payment');
const Earning = require('../models/Earning');
const User = require('../models/User');
const API = require('../models/API');

class EarningService {

    /**
     * distributePayment
     * ─────────────────
     * Called right after a Razorpay payment is confirmed successful.
     * Splits the subscription price into:
     *   • Platform fee  → platform owner's wallet
     *   • Provider share → API owner's wallet
     *
     * Creates two immutable Earning records (audit trail) and updates
     * the Payment document with the fee breakdown.
     *
     * @param {Object} payment  - Mongoose Payment document (status already 'success')
     * @param {Object} api      - Mongoose API document (contains owner_id, pricing)
     * @param {string} buyerId  - ObjectId of the buyer (for context)
     * @returns {{ providerEarning, platformEarning, config }}
     */
    async distributePayment(payment, api, buyerId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Get platform config (fee rate + owner ID)
            const config = await PlatformConfig.getConfig();
            const feeRate = config.platform_fee_rate;                  // e.g. 10
            const grossAmount = payment.amount;                         // INR

            // 2. Calculate split
            const platformFee = parseFloat(((grossAmount * feeRate) / 100).toFixed(2));
            const providerEarning = parseFloat((grossAmount - platformFee).toFixed(2));

            // 3. Credit Provider wallet
            const provider = await User.findByIdAndUpdate(
                api.owner_id,
                { $inc: { wallet_balance: providerEarning } },
                { new: true, session }
            );

            if (!provider) {
                throw new Error(`Provider not found: ${api.owner_id}`);
            }

            // 4. Credit Platform Owner wallet (if configured)
            let platformOwnerUpdated = null;
            if (config.platform_owner_id) {
                platformOwnerUpdated = await User.findByIdAndUpdate(
                    config.platform_owner_id,
                    { $inc: { wallet_balance: platformFee } },
                    { new: true, session }
                );
            }

            // 5. Update Payment with fee breakdown
            await Payment.findByIdAndUpdate(
                payment._id,
                {
                    platform_fee_rate: feeRate,
                    platform_fee: platformFee,
                    provider_earning: providerEarning
                },
                { session }
            );

            // 6. Create Earning record for provider
            const providerEarningDoc = await Earning.create([{
                user_id: api.owner_id,
                api_id: api._id,
                payment_id: payment._id,
                buyer_id: buyerId,
                gross_amount: grossAmount,
                platform_fee: platformFee,
                net_amount: providerEarning,
                platform_fee_rate: feeRate,
                type: 'provider_credit',
                status: 'completed',
                description: `Earning from subscription to "${api.name}" (${feeRate}% platform fee deducted)`
            }], { session });

            // 7. Create Earning record for platform (if owner configured)
            let platformEarningDoc = null;
            if (config.platform_owner_id) {
                platformEarningDoc = await Earning.create([{
                    user_id: config.platform_owner_id,
                    api_id: api._id,
                    payment_id: payment._id,
                    buyer_id: buyerId,
                    gross_amount: grossAmount,
                    platform_fee: platformFee,
                    net_amount: platformFee,
                    platform_fee_rate: feeRate,
                    type: 'platform_credit',
                    status: 'completed',
                    description: `Platform commission from "${api.name}" subscription (${feeRate}%)`
                }], { session });
            }

            await session.commitTransaction();
            session.endSession();

            console.log(`✅ Payment distributed: ₹${grossAmount} → Provider: ₹${providerEarning} | Platform: ₹${platformFee} (${feeRate}%)`);

            return {
                gross_amount: grossAmount,
                platform_fee_rate: feeRate,
                platform_fee: platformFee,
                provider_earning: providerEarning,
                provider_wallet_balance: provider.wallet_balance,
                providerEarning: providerEarningDoc[0],
                platformEarning: platformEarningDoc ? platformEarningDoc[0] : null,
                config
            };

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('❌ earningService.distributePayment failed:', error.message);
            throw error;
        }
    }

    /**
     * getProviderEarnings
     * Returns all earning records + summary stats for a provider.
     */
    async getProviderEarnings(providerId) {
        const earnings = await Earning.find({
            user_id: providerId,
            type: 'provider_credit'
        })
            .populate('api_id', 'name description pricing category')
            .populate('buyer_id', 'name email')
            .sort({ createdAt: -1 });

        const provider = await User.findById(providerId).select('wallet_balance name email');

        const totalEarned = earnings.reduce((sum, e) => sum + e.net_amount, 0);
        const totalGross = earnings.reduce((sum, e) => sum + e.gross_amount, 0);
        const totalFeesPaid = earnings.reduce((sum, e) => sum + e.platform_fee, 0);

        return {
            wallet_balance: provider ? provider.wallet_balance : 0,
            total_earned: parseFloat(totalEarned.toFixed(2)),
            total_gross: parseFloat(totalGross.toFixed(2)),
            total_platform_fees: parseFloat(totalFeesPaid.toFixed(2)),
            transaction_count: earnings.length,
            earnings
        };
    }

    /**
     * getPlatformEarnings
     * Returns platform-wide commission summary (admin only).
     */
    async getPlatformEarnings() {
        const config = await PlatformConfig.getConfig();

        const allPlatformCredits = await Earning.find({ type: 'platform_credit' })
            .populate('api_id', 'name pricing category')
            .populate('buyer_id', 'name email')
            .sort({ createdAt: -1 });

        const totalCommission = allPlatformCredits.reduce((sum, e) => sum + e.net_amount, 0);
        const totalVolume = allPlatformCredits.reduce((sum, e) => sum + e.gross_amount, 0);

        // Per-API breakdown
        const apiBreakdown = {};
        for (const e of allPlatformCredits) {
            const apiName = e.api_id ? e.api_id.name : 'Unknown';
            if (!apiBreakdown[apiName]) {
                apiBreakdown[apiName] = { count: 0, volume: 0, commission: 0 };
            }
            apiBreakdown[apiName].count += 1;
            apiBreakdown[apiName].volume += e.gross_amount;
            apiBreakdown[apiName].commission += e.net_amount;
        }

        let platformOwner = null;
        if (config.platform_owner_id) {
            platformOwner = await User.findById(config.platform_owner_id).select('name email wallet_balance');
        }

        return {
            platform_fee_rate: config.platform_fee_rate,
            total_commission_earned: parseFloat(totalCommission.toFixed(2)),
            total_volume_processed: parseFloat(totalVolume.toFixed(2)),
            total_transactions: allPlatformCredits.length,
            platform_owner: platformOwner,
            api_breakdown: apiBreakdown,
            recent_transactions: allPlatformCredits.slice(0, 20)
        };
    }

    /**
     * updatePlatformConfig
     * Admin-only: update fee rate and/or platform owner.
     */
    async updatePlatformConfig({ fee_rate, platform_owner_id }) {
        const config = await PlatformConfig.getConfig();
        if (fee_rate !== undefined) {
            if (fee_rate < 0 || fee_rate > 100) {
                throw new Error('Fee rate must be between 0 and 100');
            }
            config.platform_fee_rate = fee_rate;
        }
        if (platform_owner_id !== undefined) {
            const owner = await User.findById(platform_owner_id);
            if (!owner) throw new Error('Platform owner user not found');
            config.platform_owner_id = platform_owner_id;
            // Promote the user to platform_owner role
            owner.role = 'platform_owner';
            await owner.save();
        }
        await config.save();
        return config;
    }

    /**
     * getPlatformConfig — public read
     */
    async getPlatformConfig() {
        return await PlatformConfig.getConfig();
    }
}

module.exports = new EarningService();
