'use strict';
require('dotenv').config();
const assert = require('assert');
const intSvc = require('../src/modules/integrations/integrations.service');

async function runIntegrationsApiTests() {
  console.log('===============================================================');
  console.log('RUNNING MODULE 16: INTEGRATIONS & API MANAGEMENT TESTS');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // 1. DATE FILTER PARSER
  test('parseDateFilter calculates preset and custom timeframes', () => {
    const d30 = intSvc.parseDateFilter({ period: '30d' });
    assert(d30.start instanceof Date, 'start is Date');
    assert(d30.end instanceof Date, 'end is Date');
    assert(d30.start < d30.end, 'start is before end');

    const dCustom = intSvc.parseDateFilter({ startDate: '2026-01-01', endDate: '2026-03-31' });
    assert.strictEqual(dCustom.start.toISOString().slice(0, 10), '2026-01-01');
    assert.strictEqual(dCustom.end.toISOString().slice(0, 10), '2026-03-31');
  });

  // 2. OVERVIEW & 15 KPIS
  await asyncTest('getIntegrationsOverview returns 15 KPI cards, health grid, and 8 charts', async () => {
    const data = await intSvc.getIntegrationsOverview({ period: '30d' });
    assert(data.kpis, 'kpis object exists');

    // Check numeric KPIs
    assert(typeof data.kpis.totalIntegrations.value === 'number', 'totalIntegrations is number');
    assert(typeof data.kpis.activeIntegrations.value === 'number', 'activeIntegrations is number');
    assert(typeof data.kpis.inactiveIntegrations.value === 'number', 'inactiveIntegrations is number');
    assert(typeof data.kpis.failedIntegrations.value === 'number', 'failedIntegrations is number');
    assert(typeof data.kpis.totalApiRequests.value === 'number', 'totalApiRequests is number');
    assert(typeof data.kpis.successfulApiRequests.value === 'number', 'successfulApiRequests is number');
    assert(typeof data.kpis.failedApiRequests.value === 'number', 'failedApiRequests is number');
    assert(typeof data.kpis.averageResponseTimeMs.value === 'number', 'averageResponseTimeMs is number');
    assert(typeof data.kpis.webhookDeliveries.value === 'number', 'webhookDeliveries is number');
    assert(typeof data.kpis.failedWebhooks.value === 'number', 'failedWebhooks is number');
    assert(typeof data.kpis.activeApiKeys.value === 'number', 'activeApiKeys is number');
    assert(typeof data.kpis.expiringApiKeys.value === 'number', 'expiringApiKeys is number');

    // Provider status cards
    assert(data.kpis.paymentGatewayStatus.value, 'paymentGatewayStatus has value');
    assert(data.kpis.emailProviderStatus.value, 'emailProviderStatus has value');
    assert(data.kpis.cloudStorageStatus.value, 'cloudStorageStatus has value');

    // Health Grid
    assert(Array.isArray(data.healthGrid), 'healthGrid is array');
    assert(data.healthGrid.length >= 6, 'healthGrid has all core services');

    // Analytics Charts
    assert(data.charts, 'charts object exists');
    assert(Array.isArray(data.charts.requestsOverTime), 'requestsOverTime is array');
    assert(Array.isArray(data.charts.requestsByIntegration), 'requestsByIntegration is array');
    assert(Array.isArray(data.charts.responseTimeTrends), 'responseTimeTrends is array');
    assert(Array.isArray(data.charts.webhookDeliveryTrends), 'webhookDeliveryTrends is array');
    assert(Array.isArray(data.charts.storageUsage), 'storageUsage is array');

    // Recent Activity Feed
    assert(Array.isArray(data.recentActivity), 'recentActivity is array');
  });

  // 3. CENTRAL INTEGRATIONS CRUD & LIFECYCLE
  let createdIntId = null;
  await asyncTest('createIntegration registers new external provider adapter', async () => {
    const adminUser = { id: null, display_name: 'Super Admin' };
    const created = await intSvc.createIntegration({
      name: 'Sandbox Test Payment Adapter',
      provider: 'custom_pay',
      integrationType: 'payment',
      environment: 'sandbox',
      status: 'active',
      configData: { test_mode: true, timeout: 3000 }
    }, adminUser);

    assert(created, 'created integration exists');
    assert(created.id, 'id exists');
    assert.strictEqual(created.provider, 'custom_pay');
    createdIntId = created.id;
  });

  await asyncTest('getIntegrations lists integrations with type & status filtering', async () => {
    const res = await intSvc.getIntegrations({ type: 'payment' });
    assert(Array.isArray(res.integrations), 'integrations is array');
    assert(res.integrations.length >= 2, 'payment integrations listed');
    assert(res.integrations.some(i => i.id === createdIntId), 'created integration found in list');
  });

  await asyncTest('getIntegrationById fetches single integration without leaking raw credentials', async () => {
    assert(createdIntId, 'createdIntId exists');
    const item = await intSvc.getIntegrationById(createdIntId);
    assert(item, 'item exists');
    assert.strictEqual(item.id, createdIntId);
    assert.strictEqual(item.credentials_encrypted, undefined, 'raw encrypted credentials must not be returned');
  });

  await asyncTest('testIntegrationConnection executes connection test and updates status', async () => {
    assert(createdIntId, 'createdIntId exists');
    const tested = await intSvc.testIntegrationConnection(createdIntId);
    assert(tested, 'test result exists');
    assert.strictEqual(tested.health_status, 'operational');
    assert(tested.last_tested_at, 'last_tested_at is populated');
  });

  await asyncTest('toggleIntegrationStatus toggles status between active and inactive', async () => {
    assert(createdIntId, 'createdIntId exists');
    const toggled = await intSvc.toggleIntegrationStatus(createdIntId);
    assert(toggled, 'toggled result exists');
    assert.strictEqual(toggled.status, 'inactive');
  });

  await asyncTest('deleteIntegration removes test integration record', async () => {
    assert(createdIntId, 'createdIntId exists');
    const deleted = await intSvc.deleteIntegration(createdIntId);
    assert(deleted, 'deleted result exists');
    assert.strictEqual(deleted.id, createdIntId);
  });

  // 4. API KEYS MANAGEMENT
  let testKeyId = null;
  let testRawSecret = null;
  await asyncTest('createApiKey generates cryptographically secure key and returns plaintext secret ONCE', async () => {
    const adminUser = { id: null, display_name: 'API Admin' };
    const res = await intSvc.createApiKey({
      name: 'Mobile SDK Client Key',
      environment: 'production',
      scopes: ['orders:read', 'products:read'],
      rateLimitRpm: 150,
      appName: 'Desigot iOS App',
      allowedIps: ['127.0.0.1'],
      allowedOrigins: ['https://app.desigot.com']
    }, adminUser);

    assert(res, 'api key response exists');
    assert(res.id, 'key ID exists');
    assert(res.plainTextSecret, 'plainTextSecret returned at creation');
    assert(res.plainTextSecret.startsWith('desigot_live_'), 'live prefix is present');
    testKeyId = res.id;
    testRawSecret = res.plainTextSecret;
  });

  await asyncTest('getApiKeys retrieves keys list without exposing plaintext secrets', async () => {
    const res = await intSvc.getApiKeys();
    assert(Array.isArray(res.keys), 'keys is array');
    assert(res.keys.length > 0, 'keys list is populated');
    const found = res.keys.find(k => k.id === testKeyId);
    assert(found, 'created key found in list');
    assert.strictEqual(found.plainTextSecret, undefined, 'no plaintext secret in list response');
  });

  await asyncTest('rotateApiKey generates new secret and updates key hash', async () => {
    assert(testKeyId, 'testKeyId exists');
    const rotated = await intSvc.rotateApiKey(testKeyId);
    assert(rotated, 'rotated object exists');
    assert(rotated.newPlainTextSecret, 'newPlainTextSecret returned');
    assert.notStrictEqual(rotated.newPlainTextSecret, testRawSecret, 'new secret is distinct');
  });

  await asyncTest('revokeApiKey terminates active status and records revoked_at', async () => {
    assert(testKeyId, 'testKeyId exists');
    const revoked = await intSvc.revokeApiKey(testKeyId);
    assert(revoked, 'revoked object exists');
    assert.strictEqual(revoked.is_active, false);
    assert(revoked.revoked_at, 'revoked_at is populated');
  });

  // 5. PAYMENT INTEGRATIONS
  await asyncTest('getPaymentIntegrations retrieves configured gateway adapters', async () => {
    const res = await intSvc.getPaymentIntegrations();
    assert(Array.isArray(res.gateways), 'gateways is array');
    assert(res.gateways.length > 0, 'gateways seeded');
    const stripe = res.gateways.find(g => g.provider === 'stripe') || res.gateways[0];
    assert(stripe.provider, 'provider exists');
  });

  await asyncTest('testPaymentConnection verifies gateway connectivity', async () => {
    const res = await intSvc.getPaymentIntegrations();
    const gatewayId = res.gateways[0].id;
    const tested = await intSvc.testPaymentConnection(gatewayId);
    assert(tested, 'tested gateway returned');
    assert.strictEqual(tested.health_status, 'operational');
  });

  // 6. EMAIL INTEGRATIONS
  let testEmailProvId = null;
  await asyncTest('getEmailIntegrations lists email providers with quotas and stats', async () => {
    const res = await intSvc.getEmailIntegrations();
    assert(Array.isArray(res.providers), 'providers is array');
    assert(res.providers.length >= 3, 'providers seeded');
    testEmailProvId = res.providers[0].id;
    assert(res.providers[0].sender_email, 'sender_email exists');
  });

  await asyncTest('testEmailIntegration tests SMTP/API handshake', async () => {
    assert(testEmailProvId, 'testEmailProvId exists');
    const tested = await intSvc.testEmailIntegration(testEmailProvId);
    assert(tested.success, 'handshake is successful');
  });

  await asyncTest('sendTestEmail dispatches verified test message', async () => {
    assert(testEmailProvId, 'testEmailProvId exists');
    const sent = await intSvc.sendTestEmail(testEmailProvId, 'qa@desigot.com');
    assert(sent.success, 'email dispatch succeeds');
    assert(sent.messageId, 'messageId generated');
  });

  // 7. CLOUD STORAGE INTEGRATIONS
  let testStorageId = null;
  await asyncTest('getStorageIntegrations lists cloud storage adapters and quotas', async () => {
    const res = await intSvc.getStorageIntegrations();
    assert(Array.isArray(res.storages), 'storages is array');
    assert(res.storages.length >= 2, 'storage providers seeded');
    testStorageId = res.storages[0].id;
    assert(res.storages[0].bucket_name, 'bucket_name exists');
  });

  await asyncTest('testStorageConnection checks bucket accessibility', async () => {
    assert(testStorageId, 'testStorageId exists');
    const tested = await intSvc.testStorageConnection(testStorageId);
    assert(tested.success, 'storage test succeeds');
  });

  // 8. WEBHOOKS MANAGEMENT
  let testWebhookId = null;
  await asyncTest('createWebhook registers new event subscription and signing secret', async () => {
    const created = await intSvc.createWebhook({
      name: 'Integration Test Relay',
      url: 'https://webhook.site/test-relay',
      events: ['order.created', 'order.completed'],
      environment: 'production'
    });
    assert(created, 'created webhook exists');
    assert(created.id, 'id exists');
    assert(created.signingSecret, 'signingSecret revealed at creation');
    testWebhookId = created.id;
  });

  await asyncTest('getWebhooks lists registered endpoints with total delivery counts', async () => {
    const res = await intSvc.getWebhooks();
    assert(Array.isArray(res.webhooks), 'webhooks is array');
    assert(res.webhooks.length > 0, 'webhooks list populated');
  });

  await asyncTest('testWebhookEndpoint dispatches ping event to endpoint', async () => {
    assert(testWebhookId, 'testWebhookId exists');
    const res = await intSvc.testWebhookEndpoint(testWebhookId);
    assert(res.success, 'webhook test succeeds');
    assert(res.delivery, 'delivery record created');
  });

  await asyncTest('rotateWebhookSecret generates new HMAC signing secret', async () => {
    assert(testWebhookId, 'testWebhookId exists');
    const rotated = await intSvc.rotateWebhookSecret(testWebhookId);
    assert(rotated.newSigningSecret, 'new signing secret generated');
  });

  await asyncTest('getWebhookDeliveries lists historical deliveries with pagination', async () => {
    const res = await intSvc.getWebhookDeliveries({ page: 1, limit: 10 });
    assert(Array.isArray(res.deliveries), 'deliveries is array');
    assert(res.deliveries.length > 0, 'deliveries populated');
    assert(res.pagination.total >= res.deliveries.length, 'pagination total matches');
  });

  await asyncTest('retryWebhookDelivery re-attempts failed webhook transmission', async () => {
    const delivs = await intSvc.getWebhookDeliveries({ limit: 5 });
    const sample = delivs.deliveries[0];
    const retried = await intSvc.retryWebhookDelivery(sample.id);
    assert(retried, 'retried delivery exists');
    assert.strictEqual(retried.status, 'delivered');
  });

  // 9. EXTERNAL SERVICES
  let testExtServiceId = null;
  await asyncTest('getExternalServices lists external platform adapters', async () => {
    const res = await intSvc.getExternalServices();
    assert(Array.isArray(res.services), 'services is array');
    assert(res.services.length >= 5, 'services seeded');
    testExtServiceId = res.services[0].id;
  });

  await asyncTest('testExternalService checks provider health and updates last_ping_at', async () => {
    assert(testExtServiceId, 'testExtServiceId exists');
    const tested = await intSvc.testExternalService(testExtServiceId);
    assert(tested, 'tested service exists');
    assert.strictEqual(tested.health_status, 'operational');
    assert(tested.last_ping_at, 'last_ping_at is populated');
  });

  // 10. INTEGRATION LOGS
  await asyncTest('getIntegrationLogs filters structured HTTP logs with duration and status', async () => {
    const res = await intSvc.getIntegrationLogs({ page: 1, limit: 10 });
    assert(Array.isArray(res.logs), 'logs is array');
    assert(res.logs.length > 0, 'integration logs populated');
    assert(typeof res.logs[0].duration_ms === 'number', 'duration_ms is number');
  });

  // 11. API DOCUMENTATION & OPENAPI SPEC
  test('getApiDocumentation exports OpenAPI 3.0 specification and endpoint directory', () => {
    const doc = intSvc.getApiDocumentation();
    assert(doc.openApiSpec, 'openApiSpec exists');
    assert.strictEqual(doc.openApiSpec.openapi, '3.0.3');
    assert(Array.isArray(doc.endpointDirectory), 'endpointDirectory is array');
    assert(doc.endpointDirectory.length >= 5, 'contains directory entries');
  });

  // 12. INTEGRATION SETTINGS
  await asyncTest('getIntegrationSettings retrieves global threshold policies', async () => {
    const settings = await intSvc.getIntegrationSettings();
    assert(settings, 'settings exists');
    assert(typeof settings.default_api_timeout_ms === 'number', 'default_api_timeout_ms is number');
    assert(typeof settings.default_retry_attempts === 'number', 'default_retry_attempts is number');
  });

  await asyncTest('updateIntegrationSettings saves modified configuration', async () => {
    const updated = await intSvc.updateIntegrationSettings({
      default_api_timeout_ms: 20000,
      default_retry_attempts: 4
    });
    assert(updated, 'updated settings exists');
    assert.strictEqual(updated.default_api_timeout_ms, 20000);
    assert.strictEqual(updated.default_retry_attempts, 4);
  });

  console.log('\n===============================================================');
  console.log(`ALL MODULE 16 INTEGRATION TESTS PASSED: ${passed}/${total}`);
  console.log('===============================================================\n');
}

runIntegrationsApiTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('TEST SUITE CRASHED:', err);
    process.exit(1);
  });
