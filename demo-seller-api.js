/**
 * Demo Seller API — runs on port 4000
 * Simulates a real company enrichment API.
 *
 * Usage: node demo-seller-api.js
 * Endpoint: GET http://localhost:4000/enrich?domain=tcs.com
 */

const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.json());

// ─── Static Company Data (25 companies — Indian + Global) ────────────────────
const companies = {
    // Indian Companies
    'tcs.com':         { company: 'Tata Consultancy Services', industry: 'IT Services', size: '600,000+', country: 'India', founded: 1968, hq: 'Mumbai' },
    'infosys.com':     { company: 'Infosys Limited', industry: 'IT Services', size: '300,000+', country: 'India', founded: 1981, hq: 'Bengaluru' },
    'wipro.com':       { company: 'Wipro Limited', industry: 'IT Services', size: '250,000+', country: 'India', founded: 1945, hq: 'Bengaluru' },
    'hcltech.com':     { company: 'HCL Technologies', industry: 'IT Services', size: '220,000+', country: 'India', founded: 1976, hq: 'Noida' },
    'reliance.com':    { company: 'Reliance Industries', industry: 'Conglomerate', size: '236,000+', country: 'India', founded: 1966, hq: 'Mumbai' },
    'hdfc.com':        { company: 'HDFC Bank', industry: 'Banking', size: '170,000+', country: 'India', founded: 1994, hq: 'Mumbai' },
    'bajajfinserv.in': { company: 'Bajaj Finserv', industry: 'Financial Services', size: '50,000+', country: 'India', founded: 2007, hq: 'Pune' },
    'zomato.com':      { company: 'Zomato', industry: 'Food Delivery', size: '5,000+', country: 'India', founded: 2008, hq: 'Gurugram' },
    'flipkart.com':    { company: 'Flipkart', industry: 'E-Commerce', size: '50,000+', country: 'India', founded: 2007, hq: 'Bengaluru' },
    'paytm.com':       { company: 'Paytm (One97 Communications)', industry: 'Fintech', size: '12,000+', country: 'India', founded: 2010, hq: 'Noida' },
    'ola.com':         { company: 'Ola Cabs', industry: 'Ride Hailing', size: '10,000+', country: 'India', founded: 2010, hq: 'Bengaluru' },
    'byju.com':        { company: "BYJU'S", industry: 'EdTech', size: '50,000+', country: 'India', founded: 2011, hq: 'Bengaluru' },
    'zerodha.com':     { company: 'Zerodha', industry: 'Stock Broking', size: '3,000+', country: 'India', founded: 2010, hq: 'Bengaluru' },
    'freshworks.com':  { company: 'Freshworks', industry: 'SaaS / CRM', size: '6,000+', country: 'India', founded: 2010, hq: 'Chennai' },
    'razorpay.com':    { company: 'Razorpay', industry: 'Payments', size: '3,000+', country: 'India', founded: 2014, hq: 'Bengaluru' },

    // Global Companies
    'google.com':      { company: 'Google LLC (Alphabet)', industry: 'Technology', size: '180,000+', country: 'USA', founded: 1998, hq: 'Mountain View, CA' },
    'microsoft.com':   { company: 'Microsoft Corporation', industry: 'Technology', size: '220,000+', country: 'USA', founded: 1975, hq: 'Redmond, WA' },
    'apple.com':       { company: 'Apple Inc.', industry: 'Consumer Electronics', size: '160,000+', country: 'USA', founded: 1976, hq: 'Cupertino, CA' },
    'amazon.com':      { company: 'Amazon.com Inc.', industry: 'E-Commerce / Cloud', size: '1,500,000+', country: 'USA', founded: 1994, hq: 'Seattle, WA' },
    'meta.com':        { company: 'Meta Platforms Inc.', industry: 'Social Media', size: '86,000+', country: 'USA', founded: 2004, hq: 'Menlo Park, CA' },
    'netflix.com':     { company: 'Netflix Inc.', industry: 'Streaming', size: '13,000+', country: 'USA', founded: 1997, hq: 'Los Gatos, CA' },
    'tesla.com':       { company: 'Tesla Inc.', industry: 'Electric Vehicles', size: '130,000+', country: 'USA', founded: 2003, hq: 'Austin, TX' },
    'samsung.com':     { company: 'Samsung Electronics', industry: 'Electronics', size: '270,000+', country: 'South Korea', founded: 1969, hq: 'Suwon' },
    'alibaba.com':     { company: 'Alibaba Group', industry: 'E-Commerce / Cloud', size: '230,000+', country: 'China', founded: 1999, hq: 'Hangzhou' },
    'spotify.com':     { company: 'Spotify Technology', industry: 'Music Streaming', size: '9,000+', country: 'Sweden', founded: 2006, hq: 'Stockholm' },
    'uber.com':        { company: 'Uber Technologies', industry: 'Ride Hailing', size: '32,000+', country: 'USA', founded: 2009, hq: 'San Francisco, CA' },
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Company Enrichment API', port: PORT });
});

// Main enrichment endpoint
app.get('/enrich', (req, res) => {
    const { domain } = req.query;

    if (!domain) {
        return res.status(400).json({
            success: false,
            message: 'Query parameter "domain" is required. Example: /enrich?domain=google.com'
        });
    }

    const normalized = domain.toLowerCase().trim();
    const data = companies[normalized];

    if (!data) {
        return res.status(404).json({
            success: false,
            message: `No data found for domain: ${domain}`,
            hint: 'Try domains like google.com, tcs.com, infosys.com, zomato.com'
        });
    }

    res.json({
        success: true,
        domain: normalized,
        data: {
            ...data,
            enriched_at: new Date().toISOString()
        }
    });
});

// List available domains (for discovery)
app.get('/domains', (req, res) => {
    res.json({
        success: true,
        total: Object.keys(companies).length,
        domains: Object.keys(companies)
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n✅ Demo Seller API running on http://localhost:${PORT}`);
    console.log(`   Try: GET http://localhost:${PORT}/enrich?domain=tcs.com`);
    console.log(`   Docs: GET http://localhost:${PORT}/domains\n`);
});
