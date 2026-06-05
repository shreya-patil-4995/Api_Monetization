import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionAPI } from '../../services/api';

interface Subscription {
    _id: string;
    api_id: {
        _id: string;
        name: string;
        description: string;
        pricing: number;
        duration_days: number;
        category: string;
    };
    api_key: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'expired' | 'cancelled';
    createdAt: string;
}

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        active: 'text-emerald-700 bg-emerald-100 status-active',
        expired: 'text-red-700 bg-red-100',
        cancelled: 'text-slate-700 bg-slate-200',
    };
    return map[status] || 'text-slate-700 bg-slate-200';
};

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const daysLeft = (endDate: string): number => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const ConsumerDashboard: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedKey, setCopiedKey] = useState('');
    const [cancellingId, setCancellingId] = useState('');
    const [revealedKey, setRevealedKey] = useState<Record<string, boolean>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const r = await subscriptionAPI.getUserSubscriptions();
            setSubscriptions(r.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(''), 2000);
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm('Cancel this subscription?')) return;
        setCancellingId(id);
        try {
            await subscriptionAPI.cancel(id);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel');
        } finally {
            setCancellingId('');
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">My Subscriptions</h1>
                    <p className="text-slate-600 mt-2 text-lg">Manage your API subscriptions and access keys</p>
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
                    <div className="space-y-6">
                        {subscriptions.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[16px] border border-slate-200 shadow-sm">
                                <p className="text-6xl mb-4">🔑</p>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No subscriptions yet</h3>
                                <p className="text-slate-500 font-medium mb-6">Browse the marketplace and subscribe to APIs you need.</p>
                                <Link
                                    to="/browse"
                                    className="inline-flex px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[10px] transition-colors shadow-sm"
                                >
                                    Explore APIs
                                </Link>
                            </div>
                        ) : (
                            subscriptions.map(sub => {
                                const days = daysLeft(sub.end_date);
                                const isRevealed = revealedKey[sub._id];
                                return (
                                    <div key={sub._id} className={`bg-white rounded-[16px] p-8 border ${sub.status === 'expired' ? 'border-red-200 shadow-sm' : 'border-slate-200 shadow-sm hover:shadow-md transition-shadow'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-1">{sub.api_id?.name}</h3>
                                                <p className="text-slate-500 font-medium text-sm">
                                                    Category: <span className="text-slate-700 font-bold">{sub.api_id?.category}</span> | Expires in <span className="text-slate-700 font-bold">{days} days</span>
                                                </p>
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${statusBadge(sub.status)}`}>
                                                {sub.status === 'active' ? 'Active' : sub.status}
                                            </span>
                                        </div>

                                        {/* API Key */}
                                        <div className="mb-6">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">YOUR API KEY</p>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                <div className="flex-1 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-[10px] p-3">
                                                    <code className="text-sm font-mono text-slate-800 font-bold break-all">
                                                        {isRevealed ? sub.api_key : 'apinova_••••••••••••••••••••••••'}
                                                    </code>
                                                    <div className="flex gap-2 ml-4">
                                                        <button
                                                            onClick={() => setRevealedKey(prev => ({ ...prev, [sub._id]: !isRevealed }))}
                                                            className="text-xl text-slate-400 hover:text-indigo-600 transition-colors"
                                                            title={isRevealed ? "Hide Key" : "Reveal Key"}
                                                        >
                                                            {isRevealed ? '👁️‍🗨️' : '👁️'}
                                                        </button>
                                                        <button
                                                            id={`copy-key-${sub._id}`}
                                                            onClick={() => copyKey(sub.api_key)}
                                                            className="text-xl text-slate-400 hover:text-indigo-600 transition-colors"
                                                            title="Copy to Clipboard"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                </div>
                                                {copiedKey === sub.api_key && (
                                                    <span className="text-emerald-600 text-sm font-bold animate-pulse">Copied!</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quick Start */}
                                        <div className="mb-6">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Start</p>
                                            <div className="bg-slate-900 rounded-[10px] p-4 border border-slate-800 shadow-inner">
                                                <pre className="text-emerald-400 text-xs font-mono leading-relaxed overflow-x-auto">
{`POST ${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/proxy/${sub.api_id?._id}
x-api-key: ${isRevealed ? sub.api_key : 'apinova_••••••••••••••••••••••••'}`}
                                                </pre>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-slate-500 font-medium pt-6 border-t border-slate-100 gap-4">
                                            <span>Valid: {fmtDate(sub.start_date)} → {fmtDate(sub.end_date)}</span>
                                            <div className="flex flex-wrap items-center gap-4">
                                                {sub.status === 'active' && (
                                                    <>
                                                        <Link
                                                            to={`/apis/${sub.api_id?._id}`}
                                                            state={{ activeTab: 'reviews' }}
                                                            className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors border border-indigo-200 hover:border-indigo-300 rounded-[8px] px-4 py-2"
                                                        >
                                                            Leave a Review
                                                        </Link>
                                                        <button
                                                            id={`cancel-sub-${sub._id}`}
                                                            disabled={cancellingId === sub._id}
                                                            onClick={() => handleCancel(sub._id)}
                                                            className="text-red-600 hover:text-red-700 font-bold transition-colors disabled:opacity-50 border border-red-200 hover:border-red-300 rounded-[8px] px-4 py-2"
                                                        >
                                                            {cancellingId === sub._id ? 'Cancelling...' : 'Cancel Subscription'}
                                                        </button>
                                                    </>
                                                )}
                                                {sub.status === 'expired' && (
                                                    <Link
                                                        to={`/apis/${sub.api_id?._id}`}
                                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[8px] transition-colors shadow-sm"
                                                    >
                                                        Renew Subscription
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsumerDashboard;
