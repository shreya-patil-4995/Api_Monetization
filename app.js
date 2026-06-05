require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

// Routes
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const earningRoutes = require('./routes/earningRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
// Middleware
const apiKeyMiddleware = require('./middleware/apiKeyMiddleware');
const rateLimiter = require('./middleware/rateLimitMiddleware');

const app = express();

// Trust proxy — required when deployed behind Railway/Render/Nginx load balancer
// Ensures req.ip reflects the real client IP, not the proxy's IP
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({
    origin: function (origin, callback) {
        // Strip trailing slash if present
        const cleanOrigin = origin ? origin.replace(/\/$/, '') : '';
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            process.env.CORS_ORIGIN
        ].filter(Boolean);

        if (!cleanOrigin || allowedOrigins.includes(cleanOrigin) || cleanOrigin.startsWith('http://localhost') || cleanOrigin.startsWith('http://127.0.0.1')) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true
}));

// Global IP rate limit
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// add this with your other routes
app.use('/api/admin', adminRoutes);
// ─── Platform Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/apis/:apiId/reviews', reviewRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/earnings', earningRoutes);

// ─── Proxy Route ─────────────────────────────────────────────────────────────
// ANY /api/proxy/:apiId  →  apiKeyMiddleware → rateLimiter → forward to seller
app.all('/api/proxy/:apiId', apiKeyMiddleware, rateLimiter, async (req, res) => {
    try {
        const targetUrl = req.apiDoc.endpoint_url;

        const response = await axios({
            method: req.method,
            url: targetUrl,
            params: req.query,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        res.status(response.status).json(response.data);

    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: 'Upstream API error',
                upstream_error: error.response.data
            });
        }
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ success: false, message: 'Upstream API timed out' });
        }
        console.error('Proxy error:', error.message);
        res.status(502).json({ success: false, message: 'Failed to reach upstream API' });
    }
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API Marketplace is running',
        timestamp: new Date().toISOString()
    });
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to API Marketplace Platform',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            apis: '/api/apis',
            subscriptions: '/api/subscriptions',
            payments: '/api/payments',
            earnings: '/api/earnings',
            proxy: '/api/proxy/:apiId',
            health: '/health'
        }
    });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation Error', message: err.message });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Authentication Error', message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Authentication Error', message: 'Token expired' });
    }
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

module.exports = app;
