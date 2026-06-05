import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

interface LoginProps {
    setIsAuthenticated: (value: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(formData);
            const { success, token, user } = response.data;
            
            if (success && token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('role', user.role);
                
                setIsAuthenticated(true);
                navigate('/dashboard');
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
                        Join thousands of developers monetizing their APIs on the most secure and reliable marketplace.
                    </p>

                    {/* Floating Mock Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl animate-[float_6s_ease-in-out_infinite]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center">
                                <span className="text-emerald-300 font-bold">✓</span>
                            </div>
                            <span className="text-white font-bold tracking-wide">API Key Generated</span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4 font-mono text-emerald-300 text-sm">
                            apinova_live_9f82d4c1...
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 sm:p-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
                        <p className="text-slate-500 font-medium">Log in to your account to continue</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-[10px] mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input (Floating Label) */}
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
                            className="w-full py-4 bg-gradient-primary text-white font-bold rounded-[10px] shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-slate-500 font-medium">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
