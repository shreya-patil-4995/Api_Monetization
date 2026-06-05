import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Components
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ApiList from './components/Marketplace/ApiList';
import ApiDetail from './components/Marketplace/ApiDetail';
import Dashboard from './components/Dashboard/Dashboard';
import CreateApi from './components/Provider/CreateApi';

import Home from './components/Home';

// Layout Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    // Keep auth state in sync across tabs
    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem('token');
            setIsAuthenticated(!!token);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
    };

    return (
        <Router>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

                <main className="flex-grow">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/browse" element={<ApiList />} />
                        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                        <Route path="/signup" element={<Signup setIsAuthenticated={setIsAuthenticated} />} />
                        <Route path="/apis/:id" element={<ApiDetail />} />

                        {/* Protected Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/create-api"
                            element={
                                <ProtectedRoute>
                                    <CreateApi />
                                </ProtectedRoute>
                            }
                        />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>

                <Footer />
            </div>
        </Router>
    );
};

export default App;
