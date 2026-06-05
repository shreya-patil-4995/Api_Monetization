import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, setIsAuthenticated }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const user = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); }
        catch { return null; }
    })();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setIsAuthenticated(false);
        setMobileOpen(false);
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;

    const navLink = (to: string, label: string) => (
        <Link
            to={to}
            onClick={() => setMobileOpen(false)}
            className={`text-sm transition-colors nav-link ${
                isActive(to) ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-indigo-600 font-medium'
            }`}
        >
            {label}
        </Link>
    );

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                        <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                            <span className="text-white text-sm font-bold">⚡</span>
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-gradient hidden sm:block">API Nova</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden sm:flex items-center gap-7">
                        {(!isAuthenticated || user?.role === 'consumer') && navLink('/', 'Browse APIs')}
                        {isAuthenticated && user?.role === 'consumer' && navLink('/dashboard', 'My Subscriptions')}

                        {isAuthenticated && user?.role === 'provider' && navLink('/dashboard', 'My APIs')}

                        {isAuthenticated && user?.role === 'admin' && navLink('/dashboard', 'Platform Earnings')}
                        {isAuthenticated && user?.role === 'admin' && navLink('/users', 'All Users')}
                    </div>

                    {/* Right side */}
                    <div className="hidden sm:flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {user?.name && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-xs text-white font-bold">
                                            {user.name[0].toUpperCase()}
                                        </div>
                                        <span className="text-slate-700 text-sm font-medium">{user.name.split(' ')[0]}</span>
                                        {user.role && (
                                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                                                user.role === 'provider'
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : user.role === 'admin'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {user.role}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <button
                                    id="logout-btn"
                                    onClick={handleLogout}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    id="nav-signup"
                                    className="text-sm font-medium px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        id="mobile-menu-btn"
                        className="sm:hidden text-slate-500 hover:text-slate-900 transition-colors p-2"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileOpen
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            }
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl">
                    <div className="px-4 py-4 space-y-3">
                        {(!isAuthenticated || user?.role === 'consumer') && (
                            <Link to="/browse" onClick={() => setMobileOpen(false)} className="block text-slate-600 hover:text-indigo-600 font-medium text-sm py-2">Browse APIs</Link>
                        )}
                        {isAuthenticated && user?.role === 'consumer' && (
                            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-slate-600 hover:text-indigo-600 font-medium text-sm py-2">My Subscriptions</Link>
                        )}
                        {isAuthenticated && user?.role === 'provider' && (
                            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-slate-600 hover:text-indigo-600 font-medium text-sm py-2">My APIs & Earnings</Link>
                        )}
                        {isAuthenticated && user?.role === 'admin' && (
                            <>
                                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-slate-600 hover:text-indigo-600 font-medium text-sm py-2">Platform Earnings</Link>
                                <Link to="/users" onClick={() => setMobileOpen(false)} className="block text-slate-600 hover:text-indigo-600 font-medium text-sm py-2">All Users</Link>
                            </>
                        )}
                        {isAuthenticated && (
                            <button onClick={handleLogout} className="block w-full text-left text-slate-600 hover:text-indigo-600 font-medium text-sm py-2">Logout</button>
                        )}
                        {!isAuthenticated && (
                            <>
                                <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-slate-600 hover:text-indigo-600 font-medium text-sm py-2">Login</Link>
                                <Link to="/signup" onClick={() => setMobileOpen(false)} className="block text-slate-600 hover:text-indigo-600 font-medium text-sm py-2">Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
