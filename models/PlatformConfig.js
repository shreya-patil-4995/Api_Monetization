const mongoose = require('mongoose');

/**
 * PlatformConfig — single document that stores platform-wide configuration.
 *
 * Usage:
 *   const config = await PlatformConfig.getConfig();
 *   config.platform_fee_rate  // e.g. 10 (means 10%)
 *
 * Only one document exists (enforced by the singleton helper).
 * The platform owner can update the fee rate via admin API.
 */
const PlatformConfigSchema = new mongoose.Schema({
    // Singleton key — always "main"
    key: {
        type: String,
        default: 'main',
        unique: true
    },
    // Platform commission percentage (0-100)
    platform_fee_rate: {
        type: Number,
        default: 10,        // 10% default
        min: 0,
        max: 100
    },
    // MongoDB ObjectId of the platform owner account
    platform_owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Human-readable platform name
    platform_name: {
        type: String,
        default: 'API Marketplace'
    }
}, {
    timestamps: true
});

/**
 * Static helper: always get the single platform config doc.
 * Creates it with defaults if it doesn't exist yet.
 */
PlatformConfigSchema.statics.getConfig = async function () {
    let config = await this.findOne({ key: 'main' });
    if (!config) {
        config = await this.create({ key: 'main' });
    }
    return config;
};

module.exports = mongoose.model('PlatformConfig', PlatformConfigSchema);
