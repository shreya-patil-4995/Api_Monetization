const apiService = require('../services/apiService');

class ApiController {
    async createAPI(req, res) {
        try {
            if (req.user.role !== 'provider') {
                return res.status(403).json({ success: false, message: 'Only providers can publish APIs' });
            }

            const api = await apiService.publishApi(req.body, req.user.id, req.file);
            res.status(201).json({ success: true, data: api });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getAllAPIs(req, res) {
        try {
            const apis = await apiService.getAllApis();
            res.status(200).json({ success: true, count: apis.length, data: apis });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async searchAPIs(req, res) {
        try {
            const { query } = req.params;
            if (!query) {
                return res.status(400).json({ success: false, message: 'Please provide a search query' });
            }
            
            const apis = await apiService.searchApis(query);
            res.status(200).json({ success: true, count: apis.length, data: apis });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAPIById(req, res) {
        try {
            const api = await apiService.getAPIById(req.params.id);
            res.status(200).json({ success: true, data: api });
        } catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }

    async updateAPI(req, res) {
        try {
            const api = await apiService.updateAPI(req.params.id, req.body, req.user.id, req.file);
            res.status(200).json({ success: true, data: api });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteAPI(req, res) {
        try {
            await apiService.deleteAPI(req.params.id, req.user.id);
            res.status(200).json({ success: true, message: 'API deleted successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getUserAPIs(req, res) {
        try {
            const apis = await apiService.getUserAPIs(req.user.id);
            res.status(200).json({ success: true, count: apis.length, data: apis });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getReadme(req, res) {
        try {
            const API = require('../models/API');
            const api = await API.findById(req.params.id).select('readme readme_filename name');
            if (!api) return res.status(404).json({ success: false, message: 'API not found' });
            if (!api.readme) return res.status(404).json({ success: false, message: 'No documentation available' });

            res.json({
                success: true,
                data: {
                    filename: api.readme_filename,
                    content: api.readme
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new ApiController();
