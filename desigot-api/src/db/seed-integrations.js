'use strict';
require('dotenv').config();
const crypto = require('crypto');
const { query } = require('./pool');

async function seedIntegrations() {
  console.log('--- STARTING MODULE 16: INTEGRATIONS & API MANAGEMENT SEED ---');

  // 1. Fetch Super Admin User for created_by reference
  const userRes = await query("SELECT id FROM users WHERE role IN ('superadmin', 'admin') ORDER BY role DESC LIMIT 1");
  const adminId = userRes.rows[0]?.id || null;

  // 2. Ensure Permissions exist for Integrations
  console.log('[1/11] Seeding RBAC Permissions for Integrations...');
  const permissionsList = [
    { slug: 'integrations.overview.view', name: 'View Integrations Overview', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.view', name: 'View All Integrations', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.create', name: 'Create Integration', resource: 'integrations', action: 'CREATE' },
    { slug: 'integrations.update', name: 'Update Integration', resource: 'integrations', action: 'UPDATE' },
    { slug: 'integrations.delete', name: 'Delete Integration', resource: 'integrations', action: 'DELETE' },
    { slug: 'integrations.test', name: 'Test Integration Connection', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.enable', name: 'Enable Integration', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.disable', name: 'Disable Integration', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.api_keys.view', name: 'View API Keys', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.api_keys.create', name: 'Create API Key', resource: 'integrations', action: 'CREATE' },
    { slug: 'integrations.api_keys.update', name: 'Update API Key', resource: 'integrations', action: 'UPDATE' },
    { slug: 'integrations.api_keys.rotate', name: 'Rotate API Key Secret', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.api_keys.revoke', name: 'Revoke API Key', resource: 'integrations', action: 'DELETE' },
    { slug: 'integrations.payments.view', name: 'View Payment Integrations', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.payments.manage', name: 'Manage Payment Integrations', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.email.view', name: 'View Email Integrations', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.email.manage', name: 'Manage Email Integrations', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.storage.view', name: 'View Storage Integrations', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.storage.manage', name: 'Manage Storage Integrations', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.webhooks.view', name: 'View Webhooks', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.webhooks.create', name: 'Create Webhook', resource: 'integrations', action: 'CREATE' },
    { slug: 'integrations.webhooks.update', name: 'Update Webhook', resource: 'integrations', action: 'UPDATE' },
    { slug: 'integrations.webhooks.delete', name: 'Delete Webhook', resource: 'integrations', action: 'DELETE' },
    { slug: 'integrations.webhooks.retry', name: 'Retry Webhook Delivery', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.webhooks.manage_secrets', name: 'Manage Webhook Signing Secrets', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.external_services.view', name: 'View External Services', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.external_services.manage', name: 'Manage External Services', resource: 'integrations', action: 'MANAGE' },
    { slug: 'integrations.logs.view', name: 'View Integration Logs', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.logs.export', name: 'Export Integration Logs', resource: 'integrations', action: 'EXPORT' },
    { slug: 'integrations.documentation.view', name: 'View API Documentation', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.settings.view', name: 'View Integration Settings', resource: 'integrations', action: 'VIEW' },
    { slug: 'integrations.settings.manage', name: 'Manage Integration Settings', resource: 'integrations', action: 'MANAGE' }
  ];

  for (const perm of permissionsList) {
    await query(`
      INSERT INTO permissions (name, slug, resource, action, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `, [perm.name, perm.slug, perm.resource, perm.action, perm.name]);
  }

  // 3. Clear existing development fixtures in Module 16 tables
  console.log('[2/11] Cleaning previous seed fixtures...');
  await query('DELETE FROM integration_logs');
  await query('DELETE FROM external_service_integrations');
  await query('DELETE FROM storage_integrations');
  await query('DELETE FROM email_integrations');
  await query('DELETE FROM webhook_deliveries');
  await query('DELETE FROM webhook_endpoints');
  await query('DELETE FROM integrations');
  await query('DELETE FROM api_usage_metrics');
  await query('DELETE FROM integration_settings');

  // 4. Seed Central Integrations (15 Records)
  console.log('[3/11] Seeding Central Integration Registry (15 records)...');
  const integrationsData = [
    // Payments
    { name: 'Stripe Gateway (Global)', provider: 'stripe', type: 'payment', env: 'production', status: 'active', health: 'operational', isDefault: true, config: { webhook_enabled: true, statement_descriptor: 'DESIGOT MKT' } },
    { name: 'Razorpay UPI & Cards', provider: 'razorpay', type: 'payment', env: 'production', status: 'active', health: 'operational', isDefault: false, config: { auto_capture: true, currency: 'INR' } },
    { name: 'PayPal Commerce Platform', provider: 'paypal', type: 'payment', env: 'sandbox', status: 'inactive', health: 'operational', isDefault: false, config: { mode: 'sandbox' } },
    // Email
    { name: 'Amazon SES Transactional', provider: 'ses', type: 'email', env: 'production', status: 'active', health: 'operational', isDefault: true, config: { region: 'us-east-1', dedicated_ip: true } },
    { name: 'SendGrid Marketing & Broadcasts', provider: 'sendgrid', type: 'email', env: 'production', status: 'active', health: 'operational', isDefault: false, config: { subuser: 'desigot_mkt' } },
    { name: 'Corporate SMTP Relay', provider: 'smtp', type: 'email', env: 'sandbox', status: 'degraded', health: 'degraded', isDefault: false, config: { host: 'mail.desigot.internal', port: 587 } },
    // Cloud Storage
    { name: 'AWS S3 Primary Bucket', provider: 's3', type: 'storage', env: 'production', status: 'active', health: 'operational', isDefault: true, config: { bucket: 'desigot-primary-assets', region: 'us-east-1' } },
    { name: 'Cloudflare R2 CDN Storage', provider: 'r2', type: 'storage', env: 'production', status: 'active', health: 'operational', isDefault: false, config: { bucket: 'desigot-fast-cdn', jurisdiction: 'global' } },
    // External Services
    { name: 'Twilio SMS Gateway', provider: 'twilio', type: 'external_service', env: 'production', status: 'active', health: 'operational', isDefault: false, config: { alpha_sender_id: 'DESIGOT' } },
    { name: 'Google Maps Places & Geocoding', provider: 'google_maps', type: 'external_service', env: 'production', status: 'active', health: 'operational', isDefault: false, config: { libraries: ['places', 'geometry'] } },
    { name: 'Google Analytics 4 Telemetry', provider: 'google_analytics', type: 'external_service', env: 'production', status: 'active', health: 'operational', isDefault: false, config: { measurement_id: 'G-DESIGOT2026' } },
    { name: 'Sentry Real-time Error Monitoring', provider: 'sentry', type: 'external_service', env: 'production', status: 'active', health: 'operational', isDefault: false, config: { traces_sample_rate: 0.25 } },
    // Internal API & Webhook Services
    { name: 'Core Marketplace REST Gateway', provider: 'desigot_api', type: 'internal_api', env: 'production', status: 'active', health: 'operational', isDefault: true, config: { version: 'v1', rate_limit: 5000 } },
    { name: 'Webhook Event Dispatcher Bus', provider: 'webhook_bus', type: 'webhook', env: 'production', status: 'active', health: 'operational', isDefault: true, config: { concurrency: 20, max_retries: 5 } },
    { name: 'Mobile App Push Notification Gateway', provider: 'firebase_fcm', type: 'external_service', env: 'sandbox', status: 'pending_configuration', health: 'unknown', isDefault: false, config: { project_id: 'desigot-mobile' } }
  ];

  const integrationMap = {};
  for (const item of integrationsData) {
    const res = await query(`
      INSERT INTO integrations (
        name, provider, integration_type, environment, status, health_status,
        is_default, config_data, credentials_encrypted, last_tested_at, last_success_at,
        created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '15 minutes',
        $10, NOW() - INTERVAL '30 days', NOW()
      )
      RETURNING id, provider
    `, [
      item.name, item.provider, item.type, item.env, item.status, item.health,
      item.isDefault, JSON.stringify(item.config),
      JSON.stringify({ masked_key: 'sk_live_****' + crypto.randomBytes(4).toString('hex') }),
      adminId
    ]);
    integrationMap[item.provider] = res.rows[0].id;
  }

  // 5. Seed Email Integrations Table
  console.log('[4/11] Seeding Email Provider Adapters (4 fixtures)...');
  const emailFixtures = [
    { provider: 'ses', name: 'Desigot System', email: 'no-reply@desigot.com', reply: 'support@desigot.com', isDefault: true, daily: 50000, sent: 12450, bounces: 12, complaints: 1 },
    { provider: 'sendgrid', name: 'Desigot Marketplace', email: 'updates@mail.desigot.com', reply: 'hello@desigot.com', isDefault: false, daily: 25000, sent: 8200, bounces: 8, complaints: 0 },
    { provider: 'smtp', name: 'Desigot Internal Relay', email: 'internal@desigot.com', reply: 'devops@desigot.com', isDefault: false, daily: 5000, sent: 450, bounces: 2, complaints: 0 },
    { provider: 'resend', name: 'Desigot Dev Alerts', email: 'dev-alerts@desigot.com', reply: 'eng@desigot.com', isDefault: false, daily: 10000, sent: 0, bounces: 0, complaints: 0 }
  ];

  for (const ef of emailFixtures) {
    await query(`
      INSERT INTO email_integrations (
        integration_id, provider, sender_name, sender_email, reply_to,
        smtp_host, smtp_port, encryption, daily_limit, sent_today,
        bounces_count, complaints_count, is_default, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 587, 'tls', $7, $8, $9, $10, $11, NOW(), NOW()
      )
    `, [
      integrationMap[ef.provider] || null, ef.provider, ef.name, ef.email, ef.reply,
      `smtp.${ef.provider}.desigot.com`, ef.daily, ef.sent, ef.bounces, ef.complaints, ef.isDefault
    ]);
  }

  // 6. Seed Cloud Storage Integrations Table
  console.log('[5/11] Seeding Storage Adapters (3 fixtures)...');
  const storageFixtures = [
    { provider: 's3', bucket: 'desigot-production-assets', region: 'us-east-1', isDefault: true, quota: 1000, used: 142857000000, files: 45200 },
    { provider: 'r2', bucket: 'desigot-cdn-media', region: 'auto', isDefault: false, quota: 500, used: 84200000000, files: 28400 },
    { provider: 'local', bucket: 'local-uploads', region: 'localhost', isDefault: false, quota: 50, used: 2500000000, files: 1200 }
  ];

  for (const sf of storageFixtures) {
    await query(`
      INSERT INTO storage_integrations (
        integration_id, provider, bucket_name, region, endpoint_url, cdn_url,
        is_default, is_public, max_file_size_mb, storage_quota_gb, used_bytes,
        total_files, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, TRUE, 100, $8, $9, $10, NOW(), NOW()
      )
    `, [
      integrationMap[sf.provider] || null, sf.provider, sf.bucket, sf.region,
      `https://${sf.bucket}.${sf.provider}.amazonaws.com`, `https://cdn.desigot.com`,
      sf.isDefault, sf.quota, sf.used, sf.files
    ]);
  }

  // 7. Seed External Service Integrations Table
  console.log('[6/11] Seeding External Services (7 fixtures)...');
  const extFixtures = [
    { category: 'communication', name: 'Twilio Programmable SMS', provider: 'twilio', status: 'operational' },
    { category: 'maps', name: 'Google Maps Platform', provider: 'google_maps', status: 'operational' },
    { category: 'analytics', name: 'Google Analytics 4', provider: 'google_analytics', status: 'operational' },
    { category: 'monitoring', name: 'Sentry Crash Reporting', provider: 'sentry', status: 'operational' },
    { category: 'search', name: 'Elasticsearch Cluster', provider: 'elasticsearch', status: 'operational' },
    { category: 'identity', name: 'Google Sign-In OAuth', provider: 'google_oauth', status: 'operational' },
    { category: 'ai', name: 'OpenAI Content Moderation', provider: 'openai', status: 'operational' }
  ];

  for (const ext of extFixtures) {
    await query(`
      INSERT INTO external_service_integrations (
        integration_id, category, service_name, provider, is_enabled,
        environment, config_data, health_status, last_ping_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, TRUE, 'production', $5, $6, NOW() - INTERVAL '5 minutes', NOW(), NOW()
      )
    `, [
      integrationMap[ext.provider] || null, ext.category, ext.name, ext.provider,
      JSON.stringify({ timeout_ms: 5000, retry_policy: 'exponential' }), ext.status
    ]);
  }

  // 8. Seed API Keys (20 Keys)
  console.log('[7/11] Seeding API Keys (20 records)...');
  const keyTypes = ['internal', 'public', 'private', 'server_to_server', 'partner', 'webhook_signing'];
  const scopesList = [
    ['orders:read', 'orders:write', 'payments:process'],
    ['services:read', 'products:read'],
    ['webhooks:manage', 'events:subscribe'],
    ['*'],
    ['users:read', 'analytics:read']
  ];

  for (let i = 1; i <= 20; i++) {
    const isLive = i % 2 === 0;
    const prefix = isLive ? 'desigot_live_' : 'desigot_test_';
    const rawSecret = prefix + crypto.randomBytes(16).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    const isRevoked = i === 18 || i === 19;
    const isExpired = i === 20;
    const scopes = scopesList[i % scopesList.length];
    const keyType = keyTypes[i % keyTypes.length];
    const lastUsedAt = new Date(Date.now() - i * 3 * 3600000);
    const createdAt = new Date(Date.now() - i * 6 * 3600000);
    const expiresAt = isExpired ? new Date(Date.now() - 2 * 86400000) : new Date(Date.now() + 180 * 86400000);
    const revokedAt = isRevoked ? new Date(Date.now() - 86400000) : null;

    await query(`
      INSERT INTO api_keys (
        user_id, name, key_hash, key_prefix, environment, scopes,
        rate_limit_rpm, last_used_at, expires_at, is_active, revoked_at,
        key_type, allowed_ips, allowed_origins, app_name, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        ARRAY['192.168.1.0/24', '10.0.0.1'], ARRAY['https://partner.desigot.com', 'https://app.desigot.com'],
        $13, $14
      )
    `, [
      adminId, `Production Client Key #${i}`, keyHash, rawSecret.slice(0, 16) + '...',
      isLive ? 'production' : 'sandbox', scopes, 120 + (i * 20),
      lastUsedAt, expiresAt, (!isRevoked && !isExpired), revokedAt,
      keyType, `Partner App ${i}`, createdAt
    ]);
  }

  // 9. Seed Webhooks (20 Endpoints)
  console.log('[8/11] Seeding Webhook Endpoints (20 fixtures)...');
  const webhookEvents = [
    ['order.created', 'order.completed', 'payment.succeeded'],
    ['user.created', 'user.updated'],
    ['product.published', 'product.downloaded'],
    ['service.created', 'service.published'],
    ['security.event.created', 'integration.status.changed']
  ];

  const webhookIds = [];
  for (let i = 1; i <= 20; i++) {
    const isLive = i % 3 !== 0;
    const secret = 'whsec_' + crypto.randomBytes(16).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
    const evs = webhookEvents[i % webhookEvents.length];

    const whRes = await query(`
      INSERT INTO webhook_endpoints (
        name, url, secret_hash, events, is_active, failure_count,
        environment, timeout_seconds, retry_limit, signing_secret_masked,
        last_success_at, last_failure_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 15, 5, $8,
        NOW() - INTERVAL '30 minutes', NULL, NOW() - INTERVAL '60 days', NOW()
      )
      RETURNING id
    `, [
      `Partner Webhook Relay #${i}`,
      `https://api.partner${i}.example.com/webhooks/desigot`,
      secretHash, evs, (i !== 15 && i !== 16), (i === 15 ? 4 : 0),
      isLive ? 'production' : 'sandbox', secret.slice(0, 10) + '...'
    ]);
    webhookIds.push(whRes.rows[0].id);
  }

  // 10. Seed Webhook Deliveries (120 Records)
  console.log('[9/11] Seeding Webhook Deliveries (120 records)...');
  for (let i = 1; i <= 120; i++) {
    const whId = webhookIds[i % webhookIds.length];
    const isSuccess = i % 8 !== 0;
    const eventType = ['order.created', 'payment.succeeded', 'user.created', 'product.published'][i % 4];
    const delivCreated = new Date(Date.now() - i * 2 * 3600000);

    await query(`
      INSERT INTO webhook_deliveries (
        webhook_id, event_type, payload, attempt_number, response_status,
        response_body, duration_ms, is_successful, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
    `, [
      whId, eventType,
      JSON.stringify({ event_id: `evt_${crypto.randomBytes(6).toString('hex')}`, timestamp: new Date().toISOString(), data: { id: i, amount: 2500 } }),
      isSuccess ? 1 : 3,
      isSuccess ? 200 : 504,
      isSuccess ? '{"status":"received"}' : '{"error":"Gateway Timeout"}',
      45 + (i % 80),
      isSuccess,
      isSuccess ? 'delivered' : (i % 16 === 0 ? 'dead_letter' : 'retrying'),
      delivCreated
    ]);
  }

  // 11. Seed Integration Logs (1,000 Records)
  console.log('[10/11] Seeding Structured Integration Logs (1,000 records)...');
  const serviceTypes = ['payment', 'email', 'storage', 'webhook', 'external_api', 'api_key'];
  const providers = ['stripe', 'razorpay', 'ses', 'sendgrid', 's3', 'twilio', 'sentry'];
  const methods = ['GET', 'POST', 'POST', 'POST', 'PATCH', 'DELETE'];

  for (let i = 1; i <= 1000; i++) {
    const sType = serviceTypes[i % serviceTypes.length];
    const prov = providers[i % providers.length];
    const method = methods[i % methods.length];
    const isErr = i % 14 === 0;
    const status = isErr ? [400, 401, 403, 404, 429, 500, 502, 504][i % 8] : (method === 'POST' ? 201 : 200);
    const logOccurred = new Date(Date.now() - i * 35 * 60000);

    await query(`
      INSERT INTO integration_logs (
        service_type, provider, request_id, endpoint, http_method,
        response_status, duration_ms, retry_count, error_category,
        error_message, environment, occurred_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
    `, [
      sType, prov, `req_${crypto.randomBytes(8).toString('hex')}`,
      `https://api.${prov}.com/v1/${sType}/action_${i % 10}`,
      method, status, 30 + (i % 120),
      isErr ? 2 : 0,
      isErr ? (status === 429 ? 'RateLimitExceeded' : 'ProviderTimeout') : null,
      isErr ? `Provider API returned status ${status}` : null,
      i % 5 === 0 ? 'sandbox' : 'production',
      logOccurred
    ]);
  }

  // 12. Seed API Usage Metrics (30 Days)
  console.log('[11/11] Seeding Daily API Usage Metrics (30 days)...');
  for (let d = 30; d >= 0; d--) {
    const metricDate = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    for (const st of ['payments', 'emails', 'storage', 'webhooks', 'external_api']) {
      const baseReqs = 850 + (d * 20);
      const errCount = Math.round(baseReqs * 0.04);
      await query(`
        INSERT INTO api_usage_metrics (
          date, service_type, total_requests, successful_requests, failed_requests,
          avg_response_time_ms, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW()
        )
        ON CONFLICT (date, service_type) DO NOTHING
      `, [metricDate, st, baseReqs, baseReqs - errCount, errCount, 65.5 + (d % 15)]);
    }
  }

  // 13. Seed Integration Settings
  const defaultSettings = [
    { key: 'default_api_timeout_ms', value: 15000, cat: 'general', desc: 'Default timeout for external HTTP API calls in milliseconds' },
    { key: 'default_retry_attempts', value: 3, cat: 'general', desc: 'Number of automatic retries on network or 5xx provider failures' },
    { key: 'retry_backoff_type', value: 'exponential', cat: 'general', desc: 'Retry backoff algorithm (exponential, linear, fixed)' },
    { key: 'webhook_timeout_seconds', value: 15, cat: 'webhooks', desc: 'Max delivery wait before timeout on webhook consumers' },
    { key: 'webhook_max_retry_limit', value: 5, cat: 'webhooks', desc: 'Maximum retry cycles before moving webhook to dead-letter queue' },
    { key: 'webhook_enforce_signatures', value: true, cat: 'webhooks', desc: 'Mandatory HMAC-SHA256 signature header verification' },
    { key: 'default_payment_provider', value: 'stripe', cat: 'payments', desc: 'Primary default checkout payment processor' },
    { key: 'default_email_provider', value: 'ses', cat: 'email', desc: 'Primary transactional email dispatcher' },
    { key: 'default_storage_provider', value: 's3', cat: 'storage', desc: 'Primary cloud object storage repository' },
    { key: 'integration_logs_retention_days', value: 90, cat: 'logging', desc: 'Days to retain detailed HTTP payload logs before purge' }
  ];

  for (const set of defaultSettings) {
    await query(`
      INSERT INTO integration_settings (setting_key, setting_value, category, description, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = NOW()
    `, [set.key, JSON.stringify(set.value), set.cat, set.desc, adminId]);
  }

  console.log('\n✓ MODULE 16 SEED COMPLETED SUCCESSFULLY.');
  process.exit(0);
}

seedIntegrations().catch(err => {
  console.error('✗ Seed failed:', err);
  process.exit(1);
});
