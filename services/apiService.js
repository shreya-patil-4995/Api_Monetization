const API = require('../models/API');

class ApiService {
    async publishApi(apiData, ownerId, readmeFile) {
        const data = {
            ...apiData,
            owner_id: ownerId,
            is_active: false,      // inactive until listing fee paid
            listing_fee_paid: false
        };

        if (readmeFile) {
            data.readme = readmeFile.buffer.toString('utf-8');
            data.readme_filename = readmeFile.originalname;
        }

        return await API.create(data);
    }

    async getAllApis() {
        // Never expose endpoint_url to consumers — filter only active APIs for marketplace
        return await API.find({ is_active: true })
            .select('-endpoint_url')
            .populate('owner_id', 'name');
    }

    async searchApis(query) {
        return await API.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }).populate('owner_id', 'name email');
    }

    async getAPIById(id) {
        // Never expose endpoint_url to consumers
        return await API.findById(id)
            .select('-endpoint_url')
            .populate('owner_id', 'name');
    }

    async updateAPI(id, updateData, userId, readmeFile) {
        const api = await API.findById(id);
        if (!api) {
            throw new Error('API not found');
        }
        if (api.owner_id.toString() !== userId) {
            throw new Error('Not authorized to update this API');
        }

        if (readmeFile) {
            updateData.readme = readmeFile.buffer.toString('utf-8');
            updateData.readme_filename = readmeFile.originalname;
        }

        return await API.findByIdAndUpdate(id, updateData, { new: true });
    }

    async deleteAPI(id, userId) {
        const api = await API.findById(id);
        if (!api) {
            throw new Error('API not found');
        }
        if (api.owner_id.toString() !== userId) {
            throw new Error('Not authorized to delete this API');
        }
        return await API.findByIdAndDelete(id);
    }

    async getUserAPIs(userId) {
        // Provider CAN see their own endpoint_url — no .select exclusion here
        return await API.find({ owner_id: userId })
            .populate('owner_id', 'name email');
    }
}

module.exports = new ApiService();
