const Subscription = require('../models/Subscription');
const API = require('../models/API');
const generateApiKey = require('../utils/generateApiKey');
const { isSubscriptionActive } = require('../utils/dateUtils');

class SubscriptionService {

    async createSubscription(userId, apiId) {
        // 1. Check if active subscription already exists
        const existingSub = await Subscription.findOne({
            user_id: userId,
            api_id: apiId,
            status: 'active'
        });

        if (existingSub) {
            throw new Error('You already have an active subscription for this API');
        }

        // 2. Fetch the API to get duration_days (set by seller when publishing)
        const api = await API.findById(apiId);
        if (!api) {
            throw new Error('API not found');
        }

        // 3. Calculate end_date from API's duration_days (default 30 if not set)
        const durationDays = api.duration_days || 30;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        // 4. Generate unique API key for this subscription
        const apiKey = generateApiKey();

        // 5. Create and return subscription
        return await Subscription.create({
            user_id: userId,
            api_id: apiId,
            api_key: apiKey,
            start_date: startDate,
            end_date: endDate,
            status: 'active'
        });
    }

    async checkSubscriptionValidity(apiKey, apiId) {
        const subscription = await Subscription.findOne({
            api_key: apiKey,
            api_id: apiId,
            status: 'active'
        });

        if (!subscription) {
            return { valid: false, message: 'Invalid API key or subscription not found' };
        }

        if (!isSubscriptionActive(subscription.end_date)) {
            subscription.status = 'expired';
            await subscription.save();
            return { valid: false, message: 'Subscription has expired' };
        }

        return { valid: true, subscription };
    }

    async validateSubscription(apiKey) {
        const subscription = await Subscription.findOne({
            api_key: apiKey,
            status: 'active'
        }).populate('api_id');

        if (!subscription) {
            return { valid: false, message: 'Invalid API key' };
        }

        if (!isSubscriptionActive(subscription.end_date)) {
            subscription.status = 'expired';
            await subscription.save();
            return { valid: false, message: 'Subscription has expired' };
        }

        return {
            valid: true,
            subscription,
            api: subscription.api_id
        };
    }

    async getUserSubscriptions(userId) {
        return await Subscription.find({ user_id: userId })
            .populate('api_id', 'name description pricing duration_days category')
            .sort({ createdAt: -1 });
    }

    async getSubscriptionById(id, userId) {
        const subscription = await Subscription.findById(id)
            .populate('api_id', 'name description pricing duration_days');

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        if (subscription.user_id.toString() !== userId) {
            throw new Error('Not authorized to view this subscription');
        }

        return subscription;
    }

    async cancelSubscription(id, userId) {
        const subscription = await Subscription.findById(id);

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        if (subscription.user_id.toString() !== userId) {
            throw new Error('Not authorized to cancel this subscription');
        }

        subscription.status = 'cancelled';
        await subscription.save();

        return subscription;
    }
}

module.exports = new SubscriptionService();