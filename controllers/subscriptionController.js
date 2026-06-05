const subscriptionService = require('../services/subscriptionService');
const Subscription = require('../models/Subscription');

class SubscriptionController {
    async checkSubscription(req, res) {
        try {
            const subscription = await Subscription.findOne({
                user_id: req.user.id,
                api_id: req.params.apiId,
                status: 'active'
            });
            res.json({
                success: true,
                subscribed: !!subscription,
                subscription: subscription || null
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    async createSubscription(req, res) {
        try {
            const { api_id } = req.body;
            
            if (!api_id) {
                return res.status(400).json({ success: false, message: 'Please provide API ID' });
            }

            const subscription = await subscriptionService.createSubscription(req.user.id, api_id);
            res.status(201).json({ success: true, data: subscription });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getUserSubscriptions(req, res) {
        try {
            const subscriptions = await subscriptionService.getUserSubscriptions(req.user.id);
            res.status(200).json({ success: true, count: subscriptions.length, data: subscriptions });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getSubscriptionById(req, res) {
        try {
            const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.user.id);
            res.status(200).json({ success: true, data: subscription });
        } catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }

    async cancelSubscription(req, res) {
        try {
            const subscription = await subscriptionService.cancelSubscription(req.params.id, req.user.id);
            res.status(200).json({ success: true, message: 'Subscription cancelled successfully', data: subscription });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async validateSubscription(req, res) {
        try {
            const { api_key } = req.body;
            if (!api_key) {
                return res.status(400).json({ success: false, message: 'API key is required' });
            }

            const validation = await subscriptionService.validateSubscription(api_key);
            res.status(200).json({ success: true, data: validation });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new SubscriptionController();
