'use strict';
require('express-async-errors');
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const compression  = require('compression');
const cookieParser = require('cookie-parser');

const config        = require('./config');
const logger        = require('./config/logger');
const errorHandler  = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

// ── Route modules ──────────────────────────────────────────────────────────────
const authRoutes          = require('./modules/auth/auth.routes');
const userRoutes          = require('./modules/users/users.routes');
const categoryRoutes      = require('./modules/categories/categories.routes');
const listingRoutes       = require('./modules/listings/listings.routes');
const orderRoutes         = require('./modules/orders/orders.routes');
const paymentRoutes       = require('./modules/payments/payments.routes');
const projectRoutes       = require('./modules/projects/projects.routes');
const reviewRoutes        = require('./modules/reviews/reviews.routes');
const disputeRoutes       = require('./modules/disputes/disputes.routes');
const notificationRoutes  = require('./modules/notifications/notifications.routes');
const searchRoutes        = require('./modules/search/search.routes');
const wishlistRoutes      = require('./modules/wishlists/wishlists.routes');
const adminRoutes         = require('./modules/admin/admin.routes');
const analyticsRoutes     = require('./modules/analytics/analytics.routes');

const createApp = () => {
  const app = express();

  // ── Trust proxy (for correct IP behind load balancer) ──────────────────────
  app.set('trust proxy', 1);

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Managed at CDN layer
  }));

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || config.frontend.allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Idempotency-Key'],
  }));

  // ── Compression ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ── Request logging ──────────────────────────────────────────────────────────
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));

  // ── Body parsing ─────────────────────────────────────────────────────────────
  // NOTE: Stripe webhook needs raw body — handled inside payments.routes.js
  app.use((req, res, next) => {
    if (req.originalUrl.includes('/webhook/stripe')) return next();
    express.json({ limit: '10mb' })(req, res, next);
  });
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── Global rate limiter ───────────────────────────────────────────────────────
  app.use(globalLimiter);

  // ── Health check (no auth, no rate limit override needed) ─────────────────────
  app.get('/health', (req, res) =>
    res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() })
  );

  app.get('/ready', async (req, res) => {
    try {
      const { query } = require('./db/pool');
      await query('SELECT 1');
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not ready' });
    }
  });

  // ── API routes ────────────────────────────────────────────────────────────────
  const v1 = `/api/${config.apiVersion}`;

  app.use(`${v1}/auth`,          authRoutes);
  app.use(`${v1}/users`,         userRoutes);
  app.use(`${v1}/categories`,    categoryRoutes);
  app.use(`${v1}/listings`,      listingRoutes);
  app.use(`${v1}/orders`,        orderRoutes);
  app.use(`${v1}/payments`,      paymentRoutes);
  app.use(`${v1}/projects`,      projectRoutes);
  app.use(`${v1}/reviews`,       reviewRoutes);
  app.use(`${v1}/disputes`,      disputeRoutes);
  app.use(`${v1}/notifications`, notificationRoutes);
  app.use(`${v1}/search`,        searchRoutes);
  app.use(`${v1}/wishlists`,     wishlistRoutes);
  app.use(`${v1}/admin`,         adminRoutes);
  app.use(`${v1}/analytics`,     analyticsRoutes);

  // ── API root ──────────────────────────────────────────────────────────────────
  app.get(`/api/${config.apiVersion}`, (req, res) =>
    res.json({
      name: 'Desigot API',
      version: config.apiVersion,
      status: 'running',
      docs: `https://docs.desigot.com/api/${config.apiVersion}`,
    })
  );

  // ── 404 handler ───────────────────────────────────────────────────────────────
  app.use((req, res) =>
    res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` })
  );

  // ── Global error handler ──────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
