import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="border-t border-slate-200 bg-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">⚡</span>
                        </div>
                        <span className="font-extrabold text-sm tracking-tight text-gradient">API Nova</span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
                        <Link to="/browse" className="hover:text-indigo-600 transition-colors">Browse APIs</Link>
                        <Link to="/signup" className="hover:text-indigo-600 transition-colors">Get Started</Link>
                        <a href="/health" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">System Status</a>
                    </div>

                    {/* Copy */}
                    <p className="text-xs font-medium text-slate-400">
                        © {new Date().getFullYear()} API Nova Marketplace. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
