import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apisAPI, subscriptionAPI } from '../../services/api';

interface API {
    _id: string;
    name: string;
    description: string;
    pricing: number;
    duration_days: number;
    category: string;
    is_active: boolean;
    owner_id: { _id: string; name: string; email: string };
    createdAt: string;
    method?: string; // e.g. GET, POST
    avg_rating?: number;
    review_count?: number;
}

const ApiList: React.FC = () => {
    const [apis, setApis] = useState<API[]>([]);
    const [filtered, setFiltered] = useState<API[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [error, setError] = useState('');
    const [subscribedApiIds, setSubscribedApiIds] = useState<string[]>([]);

    useEffect(() => { fetchAPIs(); }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            subscriptionAPI.getUserSubscriptions()
                .then(res => {
                    const activeIds = res.data.data
                        .filter((s: any) => s.status === 'active')
                        .map((s: any) => s.api_id._id);
                    setSubscribedApiIds(activeIds);
                })
                .catch(() => {});
        }
    }, []);

    useEffect(() => {
        let result = apis;
        if (activeCategory !== 'All') {
            result = result.filter(a => a.category === activeCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q) ||
                (a.category || '').toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [apis, activeCategory, searchQuery]);

    const fetchAPIs = async () => {
        try {
            const response = await apisAPI.getAll();
            const data: API[] = response.data.data || [];
            setApis(data);
            setFiltered(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch APIs');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', ...Array.from(new Set(apis.map(a => a.category || 'General')))];

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading marketplace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 pb-20">
            {/* Header & Search */}
            <div className="bg-white border-b border-slate-200 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Explore <span className="text-gradient">APIs</span>
                    </h1>
                    <p className="text-slate-600 text-lg mb-10">
                        Discover, integrate, and build with the best APIs available.
                    </p>

                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            id="api-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search APIs by name, description or category..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                {/* Category Tabs */}
                <div className="flex justify-center flex-wrap gap-2 mb-12">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            id={`cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                activeCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-center max-w-2xl mx-auto font-medium">
                        {error}
                    </div>
                )}

                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔍</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No APIs found</h3>
                        <p className="text-slate-500">Try adjusting your search or category filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map((api, index) => {
                            const method = api.method || 'POST';
                            const methodClass = method === 'GET' ? 'badge-get' : 'badge-post';
                            
                            return (
                                <div
                                    key={api._id}
                                    className="api-card rounded-[16px] p-6 flex flex-col opacity-0 animate-[slideUp_0.5s_ease-out_forwards]"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Top Row */}
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                                            {api.category || 'General'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {!api.is_active && (
                                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                                    Inactive
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-[6px] uppercase tracking-wide ${methodClass}`}>
                                                {method}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-extrabold text-slate-900 mb-2 line-clamp-1">
                                        {api.name}
                                    </h3>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
                                        {api.description}
                                    </p>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mb-6">
                                        {(api.review_count || 0) > 0 ? (
                                            <>
                                                <div className="flex items-center text-amber-500 text-sm">
                                                    <span className="font-bold mr-1">{api.avg_rating}</span>
                                                    ★
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    ({api.review_count} reviews)
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">No reviews yet</span>
                                        )}
                                    </div>

                                    {/* Meta & Price */}
                                    <div className="flex gap-3 mb-6">
                                        <div className="flex-1 bg-slate-50 rounded-[10px] p-3 border border-slate-100 text-center">
                                            <p className="text-lg font-bold text-slate-900">₹{api.pricing}<span className="text-xs text-slate-500 font-medium">/mo</span></p>
                                        </div>
                                        <div className="flex-1 bg-slate-50 rounded-[10px] p-3 border border-slate-100 text-center flex flex-col justify-center">
                                            <p className="text-sm font-bold text-slate-900">{api.duration_days} <span className="font-medium text-slate-500">days</span></p>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    {subscribedApiIds.includes(api._id) ? (
                                        <div style={{
                                            width: '100%', padding: '12px',
                                            background: '#d1fae5', border: '1px solid #6ee7b7',
                                            borderRadius: 10, color: '#065f46',
                                            fontWeight: 700, fontSize: 14, textAlign: 'center'
                                        }}>
                                            Subscribed
                                        </div>
                                    ) : (
                                        <Link
                                            to={`/apis/${api._id}`}
                                            id={`view-api-${api._id}`}
                                            className="block w-full text-center px-4 py-3 bg-white border-2 border-indigo-100 hover:border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white text-sm font-bold rounded-[10px] transition-all"
                                        >
                                            Subscribe
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiList;
