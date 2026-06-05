import React from 'react';
import { Navigate } from 'react-router-dom';
import ProviderDashboard from './ProviderDashboard';
import ConsumerDashboard from './ConsumerDashboard';

const Dashboard: React.FC = () => {
    const isLoggedIn = !!localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const user = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); }
        catch { return null; }
    })();

    if (!isLoggedIn || !user) {
        return <Navigate to="/login" replace />;
    }

    if (role === 'provider') {
        return <ProviderDashboard />;
    }

    if (role === 'admin') {
        // Placeholder for admin dashboard
        return <div className="p-10 text-white text-center">Admin Dashboard Coming Soon</div>;
    }

    // Default to consumer
    return <ConsumerDashboard />;
};

export default Dashboard;
