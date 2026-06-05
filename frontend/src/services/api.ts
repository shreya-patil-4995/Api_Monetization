import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
    // Backend route is /auth/register (not /signup)
    register: (userData: { name: string; email: string; password: string; role?: string }) =>
        api.post('/auth/register', userData),
    login: (credentials: { email: string; password: string }) =>
        api.post('/auth/login', credentials),
};

// ─── APIs ──────────────────────────────────────────────────────────────────
export const apisAPI = {
    getAll: () => api.get('/apis'),
    getById: (id: string) => api.get(`/apis/${id}`),
    search: (query: string) => api.get(`/apis/search/${query}`),
    create: (apiData: FormData | any) => {
        if (apiData instanceof FormData) {
            return api.post('/apis', apiData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        return api.post('/apis', apiData);
    },
    update: (id: string, apiData: FormData | any) => {
        if (apiData instanceof FormData) {
            return api.put(`/apis/${id}`, apiData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        return api.put(`/apis/${id}`, apiData);
    },
    delete: (id: string) => api.delete(`/apis/${id}`),
    getUserAPIs: () => api.get('/apis/user/my-apis'),
    getReadme: (id: string) => api.get(`/apis/${id}/readme`),
};

// ─── Reviews ───────────────────────────────────────────────────────────────
export const reviewAPI = {
    getApiReviews: (apiId: string) => api.get(`/apis/${apiId}/reviews`),
    getMyReview: (apiId: string) => api.get(`/apis/${apiId}/reviews/my`),
    createReview: (apiId: string, data: { rating: number; title?: string; comment?: string }) => 
        api.post(`/apis/${apiId}/reviews`, data),
    updateReview: (apiId: string, reviewId: string, data: { rating: number; title?: string; comment?: string }) => 
        api.put(`/apis/${apiId}/reviews/${reviewId}`, data),
    deleteReview: (apiId: string, reviewId: string) => 
        api.delete(`/apis/${apiId}/reviews/${reviewId}`),
};

// ─── Subscriptions ─────────────────────────────────────────────────────────
export const subscriptionAPI = {
    checkSubscription: (apiId: string) => api.get(`/subscriptions/check/${apiId}`),
    // Note: subscription creation is triggered by payment verification, not directly
    create: (apiId: string) => api.post('/subscriptions', { api_id: apiId }),
    // Backend route is /subscriptions/my
    getUserSubscriptions: () => api.get('/subscriptions/my'),
    getById: (id: string) => api.get(`/subscriptions/${id}`),
    // Cancel is PUT /:id/cancel
    cancel: (id: string) => api.put(`/subscriptions/${id}/cancel`),
    validate: (apiKey: string) => api.post('/subscriptions/validate', { api_key: apiKey }),
};

// ─── Payments ──────────────────────────────────────────────────────────────
export const paymentAPI = {
    // Creates Razorpay order; returns { order_id, amount, currency, key_id }
    createOrder: (apiId: string) =>
        api.post('/payments/create-order', { api_id: apiId }),
    // Verifies payment and triggers subscription creation
    verify: (data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        api_id: string;
    }) => api.post('/payments/verify', data),
    // Consumer payment history
    getMyPayments: () => api.get('/payments/my'),
    getById: (id: string) => api.get(`/payments/${id}`),
    // Provider seller earnings analytics
    getSellerStats: () => api.get('/payments/seller-stats'),
    // Provider listing fee payment
    payListingFee: (apiId: string) => api.post(`/payments/listing-fee/${apiId}`),
    verifyListingFee: (apiId: string, data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }) => 
        api.post(`/payments/listing-fee-verify/${apiId}`, data),
};

export default api;
