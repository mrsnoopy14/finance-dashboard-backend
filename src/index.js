const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Global limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Auth limiter: stricter — 10 requests per 15 minutes (prevents brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use(globalLimiter);

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import JWT authentication middleware
const { authenticateUser } = require('./middleware/auth');

// ─── Public Routes (no auth required) ────────────────────────────────────────
const authRoutes = require('./routes/auth');
app.use('/api/auth', authLimiter, authRoutes);

// Health check — also public
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── Protected Routes (JWT required) ─────────────────────────────────────────
app.use(authenticateUser);

const userRoutes = require('./routes/users');
const recordRoutes = require('./routes/records');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Auth: JWT (Bearer token)`);
});

module.exports = app;
