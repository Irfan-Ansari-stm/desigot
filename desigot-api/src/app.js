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
const dashboardAnalyticsRoutes = require('./modules/dashboard-analytics/dashboard-analytics.routes');
const rbacRoutes          = require('./modules/rbac/rbac.routes');
const rolesRoutes         = require('./modules/rbac/roles.routes');
const permissionsRoutes   = require('./modules/rbac/permissions.routes');
const accessControlRoutes = require('./modules/rbac/access-control.routes');
const auditRoutes         = require('./modules/rbac/audit.routes');
const systemRoutes        = require('./modules/rbac/system.routes');
const serviceManagementRoutes = require('./modules/service-management/service-management.routes');
const publicServicesRoutes    = require('./modules/service-management/public-services.routes');
const digitalProductsRoutes   = require('./modules/digital-products/digital-products.routes');
const customerManagementRoutes = require('./modules/customer-management/customer-management.routes');
const ordersBookingsRoutes     = require('./modules/orders-bookings/orders-bookings.routes');
const categoriesTaxonomyRoutes = require('./modules/categories/categories-taxonomy.routes');
const paymentsFinanceRoutes    = require('./modules/payments/payments-finance.routes');
const communicationRoutes      = require('./modules/communication/communication.routes');
const reviewsModerationRoutes  = require('./modules/reviews/reviews-moderation.routes');
const marketingPromotionsRoutes = require('./modules/marketing/marketing-promotions.routes');
const marketplaceMarketingRoutes = require('./modules/marketing/marketplace-marketing.routes');
const cmsRoutes                  = require('./modules/cms/cms.routes');
const publicCmsRoutes            = require('./modules/cms/public-cms.routes');
const publicMarketplaceRoutes    = require('./modules/public/public.routes');
const sellerRoutes               = require('./modules/seller/seller.routes');
const securityRoutes             = require('./modules/security/security.routes');
const integrationRoutes          = require('./modules/integrations/integrations.routes');
const settingsRoutes             = require('./modules/settings/settings.routes');
const accountRoutes              = require('./modules/account/account.routes');
const path                     = require('path');

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
  app.use(`${v1}/admin/services`,           serviceManagementRoutes);
  app.use(`${v1}/admin/service-management`, serviceManagementRoutes);
  app.use(`${v1}/public/services`,          publicServicesRoutes);
  app.use(`${v1}/admin/digital-products`,   digitalProductsRoutes);
  app.use(`${v1}/admin/products`,           digitalProductsRoutes);
  app.use(`${v1}/admin/customers`,          customerManagementRoutes);
  app.use(`${v1}/admin/customer-management`,customerManagementRoutes);
  app.use(`${v1}/admin/orders-bookings`,    ordersBookingsRoutes);
  app.use(`${v1}/admin/orders`,             ordersBookingsRoutes);
  app.use(`${v1}/admin/bookings`,           ordersBookingsRoutes);
  app.use(`${v1}/admin/categories-taxonomy`,categoriesTaxonomyRoutes);
  app.use(`${v1}/admin/categories`,         categoriesTaxonomyRoutes);
  app.use(`${v1}/admin/finance`,             paymentsFinanceRoutes);
  app.use(`${v1}/admin/payments-finance`,     paymentsFinanceRoutes);
  app.use(`${v1}/admin/communication`,       communicationRoutes);
  app.use(`${v1}/communication`,             communicationRoutes);
  app.use(`${v1}/admin/reviews`,             reviewsModerationRoutes);
  app.use(`${v1}/admin/reviews-moderation`,  reviewsModerationRoutes);
  app.use(`${v1}/admin/marketing`,           marketingPromotionsRoutes);
  app.use(`${v1}/admin/marketing-promotions`,marketingPromotionsRoutes);
  app.use(`${v1}/marketplace/marketing`,     marketplaceMarketingRoutes);
  app.use(`${v1}/admin/cms`,                 cmsRoutes);
  app.use(`${v1}/public/cms`,                publicCmsRoutes);
  app.use(`${v1}/public`,                    publicMarketplaceRoutes);
  app.use(`${v1}/seller`,                    sellerRoutes);
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
  app.use(`${v1}/admin/dashboard`, dashboardAnalyticsRoutes);
  app.use(`${v1}/admin/analytics`, dashboardAnalyticsRoutes);
  app.use(`${v1}/admin`,         dashboardAnalyticsRoutes);
  app.use(`${v1}/admin`,         adminRoutes);
  app.use(`${v1}/analytics`,     dashboardAnalyticsRoutes);
  app.use(`${v1}/analytics`,     analyticsRoutes);
  app.use(`${v1}/admin/security`,            securityRoutes);
  app.use(`${v1}/security`,                  securityRoutes);
  app.use(`${v1}/admin/integrations`,        integrationRoutes);
  app.use(`${v1}/integrations`,              integrationRoutes);
  app.use(`${v1}/admin/api-management`,      integrationRoutes);
  app.use(`${v1}/rbac`,          rbacRoutes);
  app.use(`${v1}/roles`,         rolesRoutes);
  app.use(`${v1}/permissions`,   permissionsRoutes);
  app.use(`${v1}/access-control`,accessControlRoutes);
  app.use(`${v1}/audit-logs`,    auditRoutes);
  app.use(`${v1}/admin/settings`, settingsRoutes);
  app.use(`${v1}/settings`,       settingsRoutes);
  app.use(`${v1}/account`,        accountRoutes);
  app.use(`${v1}/profile`,        accountRoutes);
  app.use(`${v1}/system`,        systemRoutes);

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
