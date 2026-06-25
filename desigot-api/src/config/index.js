'use strict';
require('dotenv').config();

const buildPostgresUrl = () => {
  const hasDiscreteDbConfig = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    .some((key) => process.env[key]);

  if (!hasDiscreteDbConfig && process.env.DATABASE_PRIMARY_URL) return process.env.DATABASE_PRIMARY_URL;

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'desigot';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';

  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);

  return `postgresql://${auth}@${host}:${port}/${name}`;
};

const primaryDbUrl = buildPostgresUrl();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  apiVersion: process.env.API_VERSION || 'v1',

  db: {
    primary: primaryDbUrl,
    replica: process.env.DATABASE_REPLICA_URL || primaryDbUrl,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10) || 5000,
    },
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_in_prod',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_prod',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'desigot-assets',
    cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cdn.desigot.com',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@desigot.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Desigot',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  },

  oauth: {
    google:   { clientId: process.env.GOOGLE_CLIENT_ID || '',   clientSecret: process.env.GOOGLE_CLIENT_SECRET || '' },
    github:   { clientId: process.env.GITHUB_CLIENT_ID || '',   clientSecret: process.env.GITHUB_CLIENT_SECRET || '' },
    linkedin: { clientId: process.env.LINKEDIN_CLIENT_ID || '', clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '' },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  bcrypt: { rounds: 12 },
  escrow: { inspectionDays: 7 },
  payout: { minimumCents: 5000 },
  upload: { maxFileSizeMb: 10, maxImages: 20 },
};

module.exports = config;
