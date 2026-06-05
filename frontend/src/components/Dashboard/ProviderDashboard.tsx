import React, { useState, useEffect, useCallback } from 'react';
import { apisAPI, paymentAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface UserAPI {
    _id: string;
    name: string;
    description: string;
    endpoint_url: string;
    pricing: number;
    duration_days: number;
    category: string;
    is_active: boolean;
    listing_fee_paid: boolean;
    createdAt: string;
}

interface SellerStats {
    total_apis: number;
    total_sales: number;
    total_earned: number;
    per_api_stats: {
        api_id: string;
        api_name: string;
        total_sales: number;
        total_earned: number;
        total_revenue: number;
        active_subscribers: number;
    }[];
    recent_buyers: {
        buyer_name: string;
        buyer_email: string;
        api_name: string;
        amount_paid: number;
        seller_received: number;
        date: string;
    }[];
}

const CATEGORIES = [
    'General', 'Finance', 'Weather', 'Data & Analytics',
    'Communication', 'Maps', 'AI', 'Security', 'Payments', 'E-Commerce'
];

declare global {
    interface Window {
        Razorpay: any;
    }
}

const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const StatCard: React.FC<{ label: string; value: string | number; icon: string; colorClass: string }> = ({ label, value, icon, colorClass }) => (
    <div className={`bg-white border border-slate-200 rounded-[16px] p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
        <div className={`w-14 h-14 rounded-[12px] flex items-center justify-center text-3xl ${colorClass}`}>{icon}</div>
        <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
            <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        </div>
    </div>
);

const ProviderDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'my-apis' | 'earnings'>('my-apis');
    const [userAPIs, setUserAPIs] = useState<UserAPI[]>([]);
    const [stats, setStats] = useState<SellerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState('');
    const [payingFeeId, setPayingFeeId] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState({
        name: '', description: '', endpoint_url: '', pricing: 0, duration_days: 30, category: 'General'
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 'my-apis') {
                const r = await apisAPI.getUserAPIs();
                setUserAPIs(r.data.data || []);
            } else {
                const r = await paymentAPI.getSellerStats();
                setStats(r.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDeleteApi = async (id: string) => {
        if (!window.confirm('Delete this API? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            await apisAPI.delete(id);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete API');
        } finally {
            setDeletingId('');
        }
    };

    const handlePayListingFee = async (apiId: string) => {
        setPayingFeeId(apiId);
        setError('');
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.');

            const r = await paymentAPI.payListingFee(apiId);
            const { order_id, amount, key_id } = r.data.data;

            const options = {
                key: key_id,
                amount: amount * 100, // convert INR to paise
                currency: 'INR',
                name: 'API Marketplace',
                description: 'API Listing Fee',
                order_id,
                handler: async (response: any) => {
                    try {
                        await paymentAPI.verifyListingFee(apiId, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert('Listing fee paid successfully! Your API is now live.');
                        fetchData();
                    } catch (err: any) {
                        setError(err.response?.data?.message || 'Payment verified but activation failed. Contact support.');
                    } finally {
                        setPayingFeeId('');
                    }
                },
                theme: { color: '#6366f1' },
                modal: {
                    ondismiss: () => {
                        setPayingFeeId('');
                        setError('Payment was cancelled.');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to initiate listing fee payment');
            setPayingFeeId('');
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        try {
            await apisAPI.create(formData);
            setShowForm(false);
            setFormData({ name: '', description: '', endpoint_url: '', pricing: 0, duration_days: 30, category: 'General' });
            fetchData();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to publish API');
        } finally {
            setFormLoading(false);
        }
    };

    const tabs = [
        { id: 'my-apis', label: 'My APIs', icon: '🚀' },
        { id: 'earnings', label: 'Earnings & Analytics', icon: '📊' },
    ] as const;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Provider Dashboard</h1>
                    <p className="text-slate-600 mt-2 text-lg">Manage your APIs and track your earnings</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-[12px] font-bold transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200'
                            }`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-[10px] mb-8 font-medium">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* ── My APIs ── */}
                        {activeTab === 'my-apis' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-slate-900">My APIs ({userAPIs.length})</h2>
                                    <button
                                        id="publish-new-api-btn"
                                        onClick={() => setShowForm(!showForm)}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[10px] transition-colors shadow-sm"
                                    >
                                        + Publish New API
                                    </button>
                                </div>

                                {/* Inline Publish Form */}
                                {showForm && (
                                    <div className="bg-white border border-indigo-200 rounded-[16px] p-8 mb-8 shadow-md">
                                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Publish a New API</h2>
                                        {formError && (
                                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-[10px] mb-6 font-medium">{formError}</div>
                                        )}
                                        <form onSubmit={handlePublish} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">API Name *</label>
                                                    <input name="name" required value={formData.name} onChange={handleFormChange}
                                                        placeholder="e.g., Weather Forecast API"
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                                                    <select name="category" value={formData.category} onChange={handleFormChange}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
                                                <textarea name="description" required rows={3} value={formData.description} onChange={handleFormChange}
                                                    placeholder="What does your API do?"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Endpoint URL * <span className="text-slate-500 font-medium">(private — never shown to consumers)</span>
                                                </label>
                                                <input name="endpoint_url" type="url" required value={formData.endpoint_url} onChange={handleFormChange}
                                                    placeholder="https://your-api.com/endpoint"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono text-sm" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Pricing (₹) *</label>
                                                    <input name="pricing" type="number" required min="0" value={formData.pricing} onChange={handleFormChange}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Duration (days)</label>
                                                    <input name="duration_days" type="number" min="1" max="365" value={formData.duration_days} onChange={handleFormChange}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                                                </div>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4 text-sm font-medium text-amber-700 flex items-start gap-2">
                                                <span>⚠️</span>
                                                After publishing, you must pay the ₹199 listing fee to make your API live on the marketplace.
                                            </div>
                                            <div className="flex gap-4 pt-2">
                                                <button type="submit" disabled={formLoading} id="submit-publish-btn"
                                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-[10px] transition-all shadow-sm">
                                                    {formLoading ? 'Publishing...' : 'Publish API'}
                                                </button>
                                                <button type="button" onClick={() => setShowForm(false)}
                                                    className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-[10px] transition-colors border border-slate-200">
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* API Table Layout */}
                                {userAPIs.length === 0 ? (
                                    <div className="text-center py-24 bg-white rounded-[16px] border border-slate-200 shadow-sm">
                                        <p className="text-6xl mb-4">🚀</p>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">No APIs published yet</h3>
                                        <p className="text-slate-500 font-medium">Publish your first API and start earning money today.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                                        <th className="px-6 py-4">API Name</th>
                                                        <th className="px-6 py-4">Category</th>
                                                        <th className="px-6 py-4">Price</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {userAPIs.map(api => (
                                                        <tr key={api._id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-5">
                                                                <p className="font-bold text-slate-900 mb-1">{api.name}</p>
                                                                <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={api.endpoint_url}>
                                                                    {api.endpoint_url}
                                                                </p>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                                                                    {api.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <p className="font-bold text-slate-900">₹{api.pricing}</p>
                                                                <p className="text-xs text-slate-500">{api.duration_days} days</p>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                {api.listing_fee_paid ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide">
                                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wide">
                                                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-5 text-right space-x-3">
                                                                {!api.listing_fee_paid && (
                                                                    <button
                                                                        onClick={() => handlePayListingFee(api._id)}
                                                                        disabled={payingFeeId === api._id}
                                                                        className="text-xs font-bold px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-[8px] transition-colors disabled:opacity-50"
                                                                    >
                                                                        {payingFeeId === api._id ? 'Processing...' : 'Pay ₹199 Fee'}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteApi(api._id)}
                                                                    disabled={deletingId === api._id}
                                                                    className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Earnings & Analytics ── */}
                        {activeTab === 'earnings' && stats && (
                            <div className="space-y-8">
                                {/* Stat Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard label="Total Earned" value={`₹${stats.total_earned.toFixed(2)}`} icon="💰" colorClass="bg-emerald-100 text-emerald-600" />
                                    <StatCard label="Total Sales" value={stats.total_sales} icon="🛒" colorClass="bg-indigo-100 text-indigo-600" />
                                    <StatCard label="Active Subs" value={stats.per_api_stats.reduce((acc, curr) => acc + curr.active_subscribers, 0)} icon="👥" colorClass="bg-cyan-100 text-cyan-600" />
                                    <StatCard label="Total APIs" value={stats.total_apis} icon="🚀" colorClass="bg-violet-100 text-violet-600" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Recharts Bar Chart */}
                                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm">
                                        <h2 className="text-lg font-bold text-slate-900 mb-6">Earnings by API</h2>
                                        {stats.per_api_stats.length > 0 ? (
                                            <div className="h-72 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={stats.per_api_stats} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="api_name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(value) => `₹${value}`} />
                                                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                                                        <Bar dataKey="total_earned" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="h-72 flex items-center justify-center text-slate-500 font-medium">No earnings data to display yet.</div>
                                        )}
                                    </div>

                                    {/* Recent Buyers */}
                                    <div className="lg:col-span-1 bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm flex flex-col">
                                        <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Buyers</h2>
                                        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '288px' }}>
                                            {stats.recent_buyers.length > 0 ? (
                                                <div className="space-y-4">
                                                    {stats.recent_buyers.map((b, i) => (
                                                        <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0">
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">{b.buyer_name}</p>
                                                                <p className="text-xs text-slate-500">{b.api_name}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-emerald-600 text-sm">+₹{b.seller_received?.toFixed(2)}</p>
                                                                <p className="text-xs text-slate-400">{fmtDate(b.date)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-slate-500 font-medium pb-10">No recent buyers.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'earnings' && !stats && !loading && (
                            <div className="text-center py-20 bg-white rounded-[16px] border border-slate-200">
                                <p className="text-slate-500 font-medium">No analytics data available.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProviderDashboard;
