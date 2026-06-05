# API Marketplace Platform

A full production-ready API marketplace platform (like RapidAPI) where users can publish, discover, subscribe to, and pay for APIs. Built on Node.js + Express + MongoDB + Razorpay.

## Features

- **User Authentication**: Signup, login with JWT tokens
- **API Management**: Publish, update, delete APIs (providers only)
- **API Discovery**: Search and browse all available APIs
- **Subscription System**: Subscribe to APIs with API key generation
- **Payment Processing**: Integrated with Razorpay for secure payments
- **Usage Tracking**: Monitor API usage and implement rate limiting
- **Role-based Access**: Consumer and Provider roles

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Razorpay
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/api_marketplace
   JWT_SECRET=your_jwt_secret_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### APIs
- `GET /api/apis` - Get all APIs
- `GET /api/apis/:id` - Get API by ID
- `GET /api/apis/search/:query` - Search APIs
- `POST /api/apis` - Create new API (protected)
- `PUT /api/apis/:id` - Update API (protected)
- `DELETE /api/apis/:id` - Delete API (protected)
- `GET /api/apis/user/my-apis` - Get user's APIs (protected)

### Subscriptions
- `POST /api/subscriptions` - Create subscription (protected)
- `GET /api/subscriptions/user` - Get user subscriptions (protected)
- `GET /api/subscriptions/:id` - Get subscription by ID (protected)
- `DELETE /api/subscriptions/:id` - Cancel subscription (protected)
- `POST /api/subscriptions/validate` - Validate API key

### Payments
- `POST /api/payments/create-order` - Create payment order (protected)
- `POST /api/payments/verify` - Verify payment (protected)
- `GET /api/payments/user` - Get user payments (protected)
- `GET /api/payments/:id` - Get payment by ID (protected)

### General
- `GET /` - Root endpoint with API info
- `GET /health` - Health check endpoint

## Database Schema

### User
- name: String
- email: String (unique)
- password: String (hashed)
- role: Enum ['consumer', 'provider']

### API
- name: String
- description: String
- endpoint_url: String
- pricing: Number
- owner_id: ObjectId (ref: User)

### Subscription
- user_id: ObjectId (ref: User)
- api_id: ObjectId (ref: API)
- api_key: String
- start_date: Date
- end_date: Date
- status: Enum ['active', 'expired', 'cancelled']

### Payment
- user_id: ObjectId (ref: User)
- api_id: ObjectId (ref: API)
- amount: Number
- payment_id: String
- status: Enum ['pending', 'completed', 'failed']

### Usage
- api_key: String
- request_count: Number
- last_used: Date

## Usage Examples

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "provider"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create API (with auth token)
```bash
curl -X POST http://localhost:5000/api/apis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Weather API",
    "description": "Get current weather data",
    "endpoint_url": "https://api.weather.com/v1/current",
    "pricing": 9.99
  }'
```

## Development

### Project Structure
```
├── config/
│   ├── db.js          # MongoDB connection
│   └── razorpay.js    # Razorpay configuration
├── controllers/
│   ├── authController.js
│   ├── apiController.js
│   ├── subscriptionController.js
│   └── paymentController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── apiKeyMiddleware.js
│   └── rateLimitMiddleware.js
├── models/
│   ├── User.js
│   ├── API.js
│   ├── Subscription.js
│   ├── Payment.js
│   └── Usage.js
├── routes/
│   ├── authRoutes.js
│   ├── apiRoutes.js
│   ├── subscriptionRoutes.js
│   └── paymentRoutes.js
├── services/
│   ├── authService.js
│   ├── apiService.js
│   ├── subscriptionService.js
│   └── paymentService.js
├── utils/
│   ├── generateApiKey.js
│   └── dateUtils.js
├── app.js              # Express app setup
├── server.js           # Server startup
└── package.json
```

## License

ISC
