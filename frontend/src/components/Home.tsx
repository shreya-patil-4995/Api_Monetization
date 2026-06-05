import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
    }, []);

    return (
        <div className="bg-white min-h-[calc(100vh-64px)]">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-16 pb-32">
                <div className="absolute inset-0 bg-slate-50/50" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className={`transition-all duration-700 delay-300 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                                The API Marketplace <br />
                                <span className="text-gradient">for Developers</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 max-w-xl">
                                Publish, discover, and monetize APIs. Buy access with a single subscription and integrate powerful tools into your apps in minutes.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/browse" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-[10px] transition-colors shadow-md hover:shadow-lg">
                                    Browse APIs
                                </Link>
                                <Link to="/signup" className="px-8 py-3.5 bg-white border border-slate-200 hover:border-indigo-200 text-slate-700 font-medium rounded-[10px] transition-all hover:shadow-md">
                                    Sell Your API
                                </Link>
                            </div>
                        </div>

                        {/* Animated Cards Background */}
                        <div className="hidden lg:block relative h-[400px]">
                            {/* Card 1 */}
                            <div className="absolute right-10 top-0 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 w-72 animate-[float_6s_ease-in-out_infinite]">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">AI & NLP</span>
                                    <span className="badge-post text-xs font-bold px-2 py-0.5 rounded-full">POST</span>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">Sentiment Analyzer</h3>
                                <div className="flex justify-between items-center mt-6">
                                    <span className="font-bold text-indigo-600">₹299/mo</span>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">→</div>
                                </div>
                            </div>
                            
                            {/* Card 2 */}
                            <div className="absolute right-40 top-32 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 w-72 animate-[float-delayed_7s_ease-in-out_infinite]">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">Finance</span>
                                    <span className="badge-get text-xs font-bold px-2 py-0.5 rounded-full">GET</span>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">Live Exchange Rates</h3>
                                <div className="flex justify-between items-center mt-6">
                                    <span className="font-bold text-indigo-600">₹99/mo</span>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">→</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="border-y border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-wrap justify-center gap-12 md:gap-24">
                        <div className="text-center">
                            <p className="text-3xl font-extrabold text-indigo-600">120+</p>
                            <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">APIs Available</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-extrabold text-indigo-600">500+</p>
                            <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Developers</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-extrabold text-indigo-600">₹2L+</p>
                            <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Earned by Providers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to scale</h2>
                        <p className="text-slate-600">Built for developers by developers. Whether you're consuming data or monetizing algorithms, our platform handles the heavy lifting.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-50 rounded-[10px] flex items-center justify-center text-2xl mb-6">🔑</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant API Keys</h3>
                            <p className="text-slate-600 leading-relaxed">Subscribe to any API and get your unique access key immediately. No waiting for approvals or manual provisioning.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-cyan-50 rounded-[10px] flex items-center justify-center text-2xl mb-6">🛡️</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure & Rate Limited</h3>
                            <p className="text-slate-600 leading-relaxed">Every subscription includes up to 1000 requests per day. We protect providers from abuse and ensure high availability.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-emerald-50 rounded-[10px] flex items-center justify-center text-2xl mb-6">💰</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Earn from Your APIs</h3>
                            <p className="text-slate-600 leading-relaxed">Turn your code into a business. Set your own pricing and keep 90% of every sale, paid out securely via our platform.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">How it works for providers</h2>
                    
                    <div className="relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                            <div className="text-center bg-white p-6">
                                <div className="w-16 h-16 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md mb-6">1</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Publish your API</h3>
                                <p className="text-slate-600">Define your endpoints, set your monthly pricing, and pay a one-time listing fee.</p>
                            </div>
                            <div className="text-center bg-white p-6">
                                <div className="w-16 h-16 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md mb-6">2</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Buyers Subscribe</h3>
                                <p className="text-slate-600">Developers discover your API on our marketplace and purchase monthly access.</p>
                            </div>
                            <div className="text-center bg-white p-6">
                                <div className="w-16 h-16 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md mb-6">3</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Earn Money</h3>
                                <p className="text-slate-600">Track your subscribers and earnings from your dashboard. We take care of billing.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
