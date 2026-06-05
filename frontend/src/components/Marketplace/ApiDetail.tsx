import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { apisAPI, paymentAPI, reviewAPI, subscriptionAPI } from '../../services/api';

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
    method?: string;
    avg_rating?: number;
    review_count?: number;
}

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

const ApiDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const [api, setApi] = useState<API | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paying, setPaying] = useState(false);
    const [successData, setSuccessData] = useState<{
        api_key: string;
        end_date: string;
        subscription_id: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);
    const [typedCode, setTypedCode] = useState('');

    const location = useLocation();

    const [activeTab, setActiveTab] = useState<'overview' | 'documentation' | 'reviews'>(
        (location.state as any)?.activeTab || 'overview'
    );
    const [readme, setReadme] = useState<string | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewSummary, setReviewSummary] = useState<any>(null);
    const [canReview, setCanReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [myReview, setMyReview] = useState<any>(null);
    
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const [isSubscribed, setIsSubscribed] = useState(false);
    const [userSubscription, setUserSubscription] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetchAPIDetails(id);
            fetchReadme(id);
            // Reviews are handled in a separate useEffect below per user snippet
        }
    }, [id]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && id) {
            subscriptionAPI.checkSubscription(id)
                .then(res => {
                    setIsSubscribed(res.data.subscribed);
                    setUserSubscription(res.data.subscription);
                })
                .catch(() => {});
        }
    }, [id]);

    useEffect(() => {
        if (!id) return;
      
        // Load reviews — visible to all
        reviewAPI.getApiReviews(id).then(res => {
          setReviews(res.data.data.reviews);
          setReviewSummary(res.data.data);
        }).catch(() => {});
      
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
      
        if (token && role === 'consumer') {
          // Check if user has ever bought this API
          subscriptionAPI.getUserSubscriptions().then(res => {
            const hasBought = res.data.data.some((s: any) => s.api_id._id === id);
            setCanReview(hasBought);
          }).catch(() => {});
      
          // Check if user already reviewed
          reviewAPI.getMyReview(id)
            .then(res => {
              if (res.data.data) {
                setHasReviewed(true);
                setMyReview(res.data.data);
              }
            })
            .catch(() => {});
        }
      }, [id]);

    const fetchAPIDetails = async (apiId: string) => {
        try {
            const response = await apisAPI.getById(apiId);
            setApi(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch API details');
        } finally {
            setLoading(false);
        }
    };

    const fetchReadme = async (apiId: string) => {
        try {
            const res = await apisAPI.getReadme(apiId);
            setReadme(res.data.data.content);
        } catch (err) {
            setReadme(null);
        }
    };



    const handleSubscribe = useCallback(async () => {
        if (!api) return;

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setPaying(true);
        setError('');

        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.');

            const orderRes = await paymentAPI.createOrder(api._id);
            const { order_id, amount, currency, key_id } = orderRes.data.data;

            const options = {
                key: key_id,
                amount,
                currency,
                name: 'API Marketplace',
                description: `Subscription: ${api.name} (${api.duration_days} days)`,
                order_id,
                handler: async (response: any) => {
                    try {
                        const verifyRes = await paymentAPI.verify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            api_id: api._id,
                        });
                        setSuccessData(verifyRes.data);
                    } catch (err: any) {
                        setError(err.response?.data?.message || 'Payment verified but subscription failed. Contact support.');
                    } finally {
                        setPaying(false);
                    }
                },
                prefill: {},
                theme: { color: '#6366f1' },
                modal: {
                    ondismiss: () => {
                        setPaying(false);
                        setError('Payment was cancelled.');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to initiate payment');
            setPaying(false);
        }
    }, [api, navigate]);

    const copyKey = () => {
        if (successData?.api_key) {
            navigator.clipboard.writeText(successData.api_key);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewRating) return;
        try {
            await reviewAPI.createReview(id!, { rating: reviewRating, title: reviewTitle, comment: reviewComment });
            setHasReviewed(true);
            reviewAPI.getApiReviews(id!).then(res => setReviews(res.data.data.reviews));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit review');
        }
    };

    const handleDeleteReview = async () => {
        if (!myReview) return;
        await reviewAPI.deleteReview(id!, myReview._id);
        setHasReviewed(false);
        setMyReview(null);
        reviewAPI.getApiReviews(id!).then(res => setReviews(res.data.data.reviews));
    };

    // Typing effect for the code snippet
    useEffect(() => {
        if (!api) return;
        const codeSnippet = `// Example Request
${api.method || 'POST'} ${API_BASE_URL}/proxy/${api._id}
Headers:
  x-api-key: spkv_••••••••••••••••
  Content-Type: application/json`;

        let i = 0;
        setTypedCode('');
        const timer = setInterval(() => {
            if (i < codeSnippet.length) {
                setTypedCode((prev) => prev + codeSnippet.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 20); // typing speed

        return () => clearInterval(timer);
    }, [api, API_BASE_URL]);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (error && !api) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center px-4">
                <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl max-w-md text-center shadow-sm">
                    {error || 'API not found'}
                </div>
            </div>
        );
    }

    // ─── Success Modal ────────────────────────────────────────────────────────
    if (successData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl animate-[slideUp_0.3s_ease-out_forwards]">
                    {/* Success Icon */}
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <span className="text-3xl animate-[pulse-green_2s_infinite]">✅</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Payment Successful!</h2>
                    <p className="text-slate-600 text-sm mb-6">
                        Active until{' '}
                        <span className="text-slate-900 font-bold">
                            {new Date(successData.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </p>

                    <div className="text-left mb-6">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Your API Key</p>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-[10px] p-3">
                            <code className="flex-1 text-slate-800 text-sm font-mono break-all font-bold">
                                {successData.api_key}
                            </code>
                            <button
                                id="copy-api-key"
                                onClick={copyKey}
                                className={`flex-shrink-0 px-3 py-1.5 text-white text-xs font-bold rounded-[8px] transition-colors ${copied ? 'bg-emerald-500' : 'bg-slate-800 hover:bg-slate-700'}`}
                            >
                                {copied ? '✓ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-[10px] p-4 text-left mb-6 shadow-inner">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Quick Start</p>
                        <pre className="text-emerald-400 text-xs font-mono leading-relaxed overflow-x-auto">
{`curl -X ${api?.method || 'POST'} "${API_BASE_URL}/proxy/${api?._id}" \\
  -H "x-api-key: ${successData.api_key}"`}
                        </pre>
                    </div>

                    <div className="flex gap-3">
                        <button
                            id="go-dashboard"
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-[10px] transition-colors shadow-sm"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={() => setSuccessData(null)}
                            className="px-6 py-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-[10px] transition-colors shadow-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const method = api?.method || 'POST';
    const methodClass = method === 'GET' ? 'badge-get' : 'badge-post';

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-8">
                    <button onClick={() => navigate('/')} className="hover:text-indigo-600 transition-colors">Home</button>
                    <span>/</span>
                    <button onClick={() => navigate('/browse')} className="hover:text-indigo-600 transition-colors">Browse</button>
                    <span>/</span>
                    <span className="text-slate-900 truncate max-w-[200px]">{api?.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (70%) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[16px] p-8 shadow-sm border border-slate-200">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                                    {api?.category || 'General'}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-[6px] uppercase tracking-wide ${methodClass}`}>
                                    {method}
                                </span>
                                {api?.is_active ? (
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-[6px] uppercase tracking-wide bg-emerald-100 text-emerald-700">
                                        Live
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-[6px] uppercase tracking-wide bg-red-100 text-red-600">
                                        Inactive
                                    </span>
                                )}
                            </div>
                            
                            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{api?.name}</h1>
                            <p className="text-slate-600 text-lg leading-relaxed mb-8">{api?.description}</p>
                            
                            {/* Tabs */}
                            <div className="flex border-b border-slate-200 mb-8">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('documentation')}
                                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'documentation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                                >
                                    Documentation
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'reviews' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                                >
                                    Reviews ({reviewSummary?.total || 0})
                                </button>
                            </div>

                            {activeTab === 'overview' && (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">What you get</h3>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                        {[
                                            `✓ ${api?.duration_days || 30} days of full access`,
                                            '✓ Unique API key generated',
                                            '✓ 1,000 requests/day limit',
                                            '✓ High availability & uptime',
                                            '✓ Secure API gateway',
                                            '✓ Simple billing & renewal'
                                        ].map((feat, i) => (
                                            <li key={i} className="text-slate-600 font-medium flex items-start gap-2">
                                                <span className="text-indigo-600 font-bold">{feat.split(' ')[0]}</span>
                                                {feat.split(' ').slice(1).join(' ')}
                                            </li>
                                        ))}
                                    </ul>

                                    <h3 className="text-xl font-bold text-slate-900 mb-4">Integration Example</h3>
                                    <div className="bg-slate-900 rounded-[12px] p-6 shadow-inner relative overflow-hidden">
                                        {/* Mac-like buttons */}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        </div>
                                        <pre className="text-emerald-400 text-sm font-mono mt-6 whitespace-pre-wrap">
                                            {typedCode}
                                            <span className="animate-pulse inline-block w-2 h-4 bg-emerald-400 ml-1 translate-y-1" />
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documentation' && (
                                <div className="prose prose-slate max-w-none">
                                    {readme ? (
                                        <ReactMarkdown>{readme}</ReactMarkdown>
                                    ) : (
                                        <p className="text-slate-500 italic">No documentation available. Contact the seller.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div>
                                    {reviewSummary && (
                                        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                            <span style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>
                                            {reviewSummary?.avgRating || 0}
                                            </span>
                                            <div>
                                            <div style={{ color: '#f59e0b', fontSize: 18 }}>
                                                {'★'.repeat(Math.round(reviewSummary?.avgRating || 0))}
                                                {'☆'.repeat(5 - Math.round(reviewSummary?.avgRating || 0))}
                                            </div>
                                            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                                                {reviewSummary?.total || 0} reviews
                                            </p>
                                            </div>
                                        </div>
                                        {[5,4,3,2,1].map(star => {
                                            const item = reviewSummary?.distribution?.find((d: any) => d.star === star);
                                            return (
                                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontSize: 11, color: '#64748b', width: 16 }}>{star}</span>
                                                <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>
                                                <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: 999,
                                                    background: '#f59e0b',
                                                    width: `${item?.percent || 0}%`
                                                }} />
                                                </div>
                                                <span style={{ fontSize: 11, color: '#94a3b8', width: 24 }}>{item?.count || 0}</span>
                                            </div>
                                            );
                                        })}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {reviews.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>
                                            No reviews yet. Be the first to review this API!
                                        </p>
                                        ) : reviews.map((review: any) => (
                                        <div key={review._id} style={{
                                            background: '#fff', border: '1px solid #e2e8f0',
                                            borderRadius: 12, padding: 14, marginBottom: 10
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                width: 34, height: 34, borderRadius: '50%',
                                                background: '#e0e7ff', color: '#4338ca',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 13
                                                }}>
                                                {review.user_id?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', margin: 0 }}>
                                                    {review.user_id?.name}
                                                </p>
                                                {review.verified_purchase && (
                                                    <span style={{
                                                    fontSize: 10, color: '#059669', fontWeight: 600,
                                                    background: '#d1fae5', padding: '1px 6px', borderRadius: 999
                                                    }}>
                                                    Verified Purchase
                                                    </span>
                                                )}
                                                </div>
                                            </div>
                                            <span style={{ color: '#f59e0b', fontSize: 13 }}>
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                            </span>
                                            </div>
                                            {review.title && (
                                            <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', margin: '0 0 4px' }}>
                                                {review.title}
                                            </p>
                                            )}
                                            {review.comment && (
                                            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                                                {review.comment}
                                            </p>
                                            )}
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>
                                            {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                            </p>
                                        </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>

                                        {/* Not logged in */}
                                        {!localStorage.getItem('token') && (
                                            <p style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                                            <a href="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Log in</a> to leave a review
                                            </p>
                                        )}

                                        {/* Logged in but never purchased */}
                                        {localStorage.getItem('token') && !canReview && !hasReviewed && (
                                            <div style={{
                                            background: '#fef3c7', border: '1px solid #fcd34d',
                                            borderRadius: 10, padding: 14, textAlign: 'center'
                                            }}>
                                            <p style={{ color: '#92400e', fontSize: 13, fontWeight: 500, margin: 0 }}>
                                                Only buyers can leave a review. Subscribe to this API to share your experience.
                                            </p>
                                            </div>
                                        )}

                                        {/* Already reviewed */}
                                        {hasReviewed && myReview && (
                                            <div style={{
                                            background: '#f0fdf4', border: '1px solid #6ee7b7',
                                            borderRadius: 10, padding: 14
                                            }}>
                                            <p style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 8 }}>
                                                Your Review
                                            </p>
                                            <div style={{ color: '#f59e0b' }}>
                                                {'★'.repeat(myReview.rating)}{'☆'.repeat(5 - myReview.rating)}
                                            </div>
                                            {myReview.title && <p style={{ fontWeight: 600, fontSize: 13, margin: '4px 0' }}>{myReview.title}</p>}
                                            {myReview.comment && <p style={{ fontSize: 13, color: '#475569' }}>{myReview.comment}</p>}
                                            <button
                                                onClick={handleDeleteReview}
                                                style={{
                                                marginTop: 8, fontSize: 12, color: '#ef4444',
                                                background: 'none', border: '1px solid #ef4444',
                                                borderRadius: 6, padding: '4px 12px', cursor: 'pointer'
                                                }}
                                            >
                                                Delete Review
                                            </button>
                                            </div>
                                        )}

                                        {/* Can review and has not reviewed yet */}
                                        {canReview && !hasReviewed && (
                                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                                            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>
                                                Write a Review
                                            </p>
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                                                {[1,2,3,4,5].map(star => (
                                                <span
                                                    key={star}
                                                    onClick={() => setReviewRating(star)}
                                                    style={{
                                                    fontSize: 28, cursor: 'pointer',
                                                    color: star <= reviewRating ? '#f59e0b' : '#e2e8f0'
                                                    }}
                                                >★</span>
                                                ))}
                                            </div>
                                            <input
                                                placeholder="Review title (optional)"
                                                value={reviewTitle}
                                                onChange={e => setReviewTitle(e.target.value)}
                                                style={{
                                                width: '100%', padding: '8px 12px', marginBottom: 8,
                                                border: '1px solid #e2e8f0', borderRadius: 8,
                                                fontSize: 13, outline: 'none', boxSizing: 'border-box'
                                                }}
                                            />
                                            <textarea
                                                placeholder="Share your experience with this API..."
                                                value={reviewComment}
                                                onChange={e => setReviewComment(e.target.value)}
                                                rows={3}
                                                style={{
                                                width: '100%', padding: '8px 12px',
                                                border: '1px solid #e2e8f0', borderRadius: 8,
                                                fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box'
                                                }}
                                            />
                                            <button
                                                onClick={handleSubmitReview}
                                                disabled={!reviewRating}
                                                style={{
                                                marginTop: 10, width: '100%', padding: '10px',
                                                background: reviewRating ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : '#e2e8f0',
                                                border: 'none', borderRadius: 8,
                                                color: reviewRating ? '#fff' : '#94a3b8',
                                                fontWeight: 600, fontSize: 13,
                                                cursor: reviewRating ? 'pointer' : 'not-allowed'
                                                }}
                                            >
                                                Submit Review
                                            </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Right Column (30%) - Pricing Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[16px] p-8 shadow-md border border-slate-200 sticky top-24">
                            <div className="text-center mb-8 pb-8 border-b border-slate-100">
                                <p className="text-5xl font-extrabold text-slate-900 tracking-tight">₹{api?.pricing}</p>
                                <p className="text-slate-500 font-medium mt-2">for {api?.duration_days || 30} days</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {[
                                    'Instant API key generation',
                                    '1,000 requests per day limit',
                                    'Cancel anytime'
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-[10px] mb-6 text-center">
                                    {error}
                                </div>
                            )}

                            {isSubscribed ? (
                                <div>
                                    <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: '#d1fae5', border: '1px solid #6ee7b7',
                                    borderRadius: 10, padding: '10px 16px', marginBottom: 8
                                    }}>
                                    <span style={{ color: '#065f46', fontSize: 16 }}>✓</span>
                                    <span style={{ color: '#065f46', fontWeight: 600, fontSize: 14 }}>
                                        You are already subscribed
                                    </span>
                                    </div>
                                    <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 8 }}>
                                    Active until {new Date(userSubscription?.end_date).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                    </p>
                                    <button
                                    onClick={() => navigate('/dashboard')}
                                    style={{
                                        width: '100%', padding: '10px',
                                        background: '#f1f5f9', border: '1px solid #e2e8f0',
                                        borderRadius: 10, color: '#475569', fontWeight: 600,
                                        fontSize: 13, cursor: 'pointer'
                                    }}
                                    >
                                    Go to Dashboard to view API Key
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleSubscribe}
                                    disabled={paying || !api?.is_active}
                                    style={{
                                    width: '100%', padding: '12px',
                                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                    border: 'none', borderRadius: 10, color: '#fff',
                                    fontWeight: 700, fontSize: 14, cursor: 'pointer'
                                    }}
                                    className="hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                >
                                    {paying ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : !api?.is_active ? 'API Unavailable' : `Subscribe — ₹${api?.pricing}/mo`}
                                </button>
                            )}

                            <p className="text-xs text-slate-400 font-medium text-center mt-6 flex items-center justify-center gap-1">
                                🔒 Secured by Razorpay
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiDetail;
