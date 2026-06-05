import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

interface SignupProps {
    setIsAuthenticated: (value: boolean) => void;
}

const Signup: React.FC<SignupProps> = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'consumer' // default role
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.register(formData);
            const { success, token, user } = response.data;
            
            if (success && token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('role', user.role);
                
                setIsAuthenticated(true);
                navigate('/dashboard');
            } else {
                setError('Registration failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)]">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex w-1/2 bg-gradient-primary p-12 flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                
                <div className="relative z-10 max-w-lg mx-auto">
                    <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
                        Build.<br />
                        Publish.<br />
                        Earn.
                    </h1>
                    <p className="text-indigo-100 text-lg mb-12">
                        Whether you are a developer looking for powerful APIs, or a creator ready to monetize your code, you belong here.
                    </p>

                    {/* Floating Mock Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl animate-[float_6s_ease-in-out_infinite]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-400/20 flex items-center justify-center">
                                <span className="text-indigo-300 font-bold">⚡</span>
                            </div>
                            <span className="text-white font-bold tracking-wide">Publish Your First API</span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4 font-mono text-indigo-300 text-sm">
                            $ npm run deploy --api="sentiment-analyzer"
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Create an Account</h2>
                        <p className="text-slate-500 font-medium">Join the API Marketplace today</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-[10px] mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Buyer Role */}
                            <div
                                onClick={() => setFormData({ ...formData, role: 'consumer' })}
                                className={`cursor-pointer rounded-[12px] p-4 border-2 transition-all ${
                                    formData.role === 'consumer'
                                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                        : 'border-slate-200 hover:border-indigo-300 bg-white'
                                }`}
                            >
                                <svg className={`w-8 h-8 mb-2 drop-shadow-sm transition-colors ${formData.role === 'consumer' ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <h3 className={`font-bold ${formData.role === 'consumer' ? 'text-indigo-900' : 'text-slate-700'}`}>Buyer</h3>
                                <p className={`text-xs mt-1 ${formData.role === 'consumer' ? 'text-indigo-700' : 'text-slate-500'}`}>
                                    Browse & subscribe to APIs
                                </p>
                            </div>

                            {/* Seller Role */}
                            <div
                                onClick={() => setFormData({ ...formData, role: 'provider' })}
                                className={`cursor-pointer rounded-[12px] p-4 border-2 transition-all ${
                                    formData.role === 'provider'
                                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                        : 'border-slate-200 hover:border-indigo-300 bg-white'
                                }`}
                            >
                                <svg className={`w-8 h-8 mb-2 drop-shadow-sm transition-colors ${formData.role === 'provider' ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <h3 className={`font-bold ${formData.role === 'provider' ? 'text-indigo-900' : 'text-slate-700'}`}>Seller</h3>
                                <p className={`text-xs mt-1 ${formData.role === 'provider' ? 'text-indigo-700' : 'text-slate-500'}`}>
                                    Publish & earn money
                                </p>
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="relative">
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="peer w-full px-4 py-4 border border-slate-200 rounded-[10px] text-slate-900 placeholder-transparent focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                                placeholder="Full name"
                                required
                            />
                            <label
                                htmlFor="name"
                                className="absolute left-4 top-2 text-xs font-bold text-slate-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-indigo-600 bg-white px-1"
                            >
                                Full name
                            </label>
                        </div>

                        {/* Email Input */}
                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="peer w-full px-4 py-4 border border-slate-200 rounded-[10px] text-slate-900 placeholder-transparent focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                                placeholder="Email address"
                                required
                            />
                            <label
                                htmlFor="email"
                                className="absolute left-4 top-2 text-xs font-bold text-slate-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-indigo-600 bg-white px-1"
                            >
                                Email address
                            </label>
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="peer w-full px-4 py-4 border border-slate-200 rounded-[10px] text-slate-900 placeholder-transparent focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white pr-12"
                                placeholder="Password"
                                minLength={6}
                                required
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-4 top-2 text-xs font-bold text-slate-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-indigo-600 bg-white px-1"
                            >
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 font-medium text-sm transition-colors"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-primary text-white font-bold rounded-[10px] shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg mt-4"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-slate-500 font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
