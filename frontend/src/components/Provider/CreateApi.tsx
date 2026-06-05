import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apisAPI } from '../../services/api';

const CATEGORIES = [
    'General', 'Finance', 'Weather', 'Data & Analytics',
    'Communication', 'Maps', 'AI', 'Security', 'Payments', 'E-Commerce'
];

interface ApiFormData {
    name: string;
    description: string;
    endpoint_url: string;
    pricing: number;
    duration_days: number;
    category: string;
}

const CreateApi: React.FC = () => {
    const [formData, setFormData] = useState<ApiFormData>({
        name: '',
        description: '',
        endpoint_url: '',
        pricing: 0,
        duration_days: 30,
        category: 'General',
    });
    const [readmeFile, setReadmeFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('endpoint_url', formData.endpoint_url);
            data.append('pricing', formData.pricing.toString());
            data.append('duration_days', formData.duration_days.toString());
            data.append('category', formData.category);
            if (readmeFile) {
                data.append('readme', readmeFile);
            }

            await apisAPI.create(data);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create API');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-2 transition-colors"
                    >
                        ← Back
                    </button>
                    <h1 className="text-3xl font-bold text-white">Publish New API</h1>
                    <p className="text-gray-400 mt-1 text-sm">Make your API discoverable and start earning</p>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                                API Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Company Enrichment API"
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Description <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                required
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe what your API does, features, and use cases..."
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                            />
                        </div>

                        {/* Endpoint URL */}
                        <div>
                            <label htmlFor="endpoint_url" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Endpoint URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="endpoint_url"
                                name="endpoint_url"
                                type="url"
                                required
                                value={formData.endpoint_url}
                                onChange={handleChange}
                                placeholder="http://localhost:4000/enrich"
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-600">
                                The platform will proxy requests to this URL (keep it private)
                            </p>
                        </div>

                        {/* Pricing + Duration row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="pricing" className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Pricing (₹) <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                    <input
                                        id="pricing"
                                        name="pricing"
                                        type="number"
                                        required
                                        min="0"
                                        step="1"
                                        value={formData.pricing}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="duration_days" className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Access Duration (days)
                                </label>
                                <input
                                    id="duration_days"
                                    name="duration_days"
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={formData.duration_days}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Documentation Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Documentation (README.md) — <span className="text-gray-500">Optional</span>
                            </label>
                            <div className="relative border-2 border-dashed border-white/20 hover:border-indigo-500/50 rounded-xl p-6 transition-colors bg-white/5 text-center">
                                <input
                                    type="file"
                                    accept=".md"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setReadmeFile(e.target.files[0]);
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="pointer-events-none">
                                    <div className="text-3xl mb-2">📄</div>
                                    <p className="text-sm font-medium text-gray-300">
                                        Drop your README.md here or click to browse
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Max 1MB · .md files only
                                    </p>
                                </div>
                            </div>
                            {readmeFile && (
                                <div className="mt-3 flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-400">✅</span>
                                        <span className="text-sm text-gray-300 font-medium">{readmeFile.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReadmeFile(null)}
                                        className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4">
                            <p className="text-xs font-semibold text-indigo-400 mb-2">💡 Tips for a great listing</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                                <li>• Write a clear, concise description explaining what problem your API solves</li>
                                <li>• Set competitive pricing — check similar APIs in the marketplace</li>
                                <li>• Ensure your endpoint URL is publicly reachable</li>
                            </ul>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                id="publish-api-btn"
                                disabled={loading}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Publishing...
                                    </span>
                                ) : 'Publish API'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors border border-white/10"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateApi;
