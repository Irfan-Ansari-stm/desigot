'use strict';

const router = require('express').Router();
const svc = require('./integrations.service');
const { authenticate } = require('../../middleware/auth');
const { requireAnyPermission } = require('../../middleware/authorize');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// All integration endpoints require authentication
router.use(authenticate);

// =============================================================================
// 1. OVERVIEW & METRICS
// =============================================================================
router.get(
  '/overview',
  requireAnyPermission('integrations.overview.view', 'integrations.view', 'api.read'),
  async (req, res) => {
    const data = await svc.getIntegrationsOverview(req.query);
    successResponse(res, data, 200, { message: 'Integrations overview retrieved.' });
  }
);

router.get(
  '/metrics',
  requireAnyPermission('integrations.overview.view', 'integrations.view', 'api.read'),
  async (req, res) => {
    const data = await svc.getIntegrationsOverview(req.query);
    successResponse(res, data, 200, { message: 'Integration metrics retrieved.' });
  }
);

// =============================================================================
// 2. API KEYS MANAGEMENT
// =============================================================================
router.get(
  '/api-keys',
  requireAnyPermission('integrations.api_keys.view', 'integrations.view', 'api.read'),
  async (req, res) => {
    const data = await svc.getApiKeys(req.query);
    successResponse(res, data);
  }
);

router.post(
  '/api-keys',
  requireAnyPermission('integrations.api_keys.create', 'api.create'),
  async (req, res) => {
    const key = await svc.createApiKey(req.body, req.user);
    successResponse(res, key, 201, { message: 'API key created successfully.' });
  }
);

router.get(
  '/api-keys/:id',
  requireAnyPermission('integrations.api_keys.view', 'api.read'),
  async (req, res) => {
    const key = await svc.getApiKeyById(req.params.id);
    if (!key) return res.status(404).json({ success: false, message: 'API key not found' });
    successResponse(res, key);
  }
);

router.post(
  '/api-keys/:id/rotate',
  requireAnyPermission('integrations.api_keys.rotate', 'api.update'),
  async (req, res) => {
    const rotated = await svc.rotateApiKey(req.params.id, req.user);
    if (!rotated) return res.status(404).json({ success: false, message: 'API key not found' });
    successResponse(res, rotated, 200, { message: 'API key rotated successfully.' });
  }
);

router.post(
  '/api-keys/:id/revoke',
  requireAnyPermission('integrations.api_keys.revoke', 'api.delete'),
  async (req, res) => {
    const revoked = await svc.revokeApiKey(req.params.id, req.user);
    if (!revoked) return res.status(404).json({ success: false, message: 'API key not found' });
    successResponse(res, revoked, 200, { message: 'API key revoked.' });
  }
);

router.patch(
  '/api-keys/:id',
  requireAnyPermission('integrations.api_keys.update', 'api.update'),
  async (req, res) => {
    const updated = await svc.updateApiKey(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: 'API key not found' });
    successResponse(res, updated, 200, { message: 'API key updated.' });
  }
);

// =============================================================================
// 3. PAYMENT INTEGRATIONS
// =============================================================================
router.get(
  '/payments',
  requireAnyPermission('integrations.payments.view', 'integrations.view'),
  async (req, res) => {
    const data = await svc.getPaymentIntegrations();
    successResponse(res, data);
  }
);

router.patch(
  '/payments/:id',
  requireAnyPermission('integrations.payments.manage'),
  async (req, res) => {
    const updated = await svc.updatePaymentIntegration(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: 'Payment gateway not found' });
    successResponse(res, updated, 200, { message: 'Payment configuration saved.' });
  }
);

router.post(
  '/payments/:id/test',
  requireAnyPermission('integrations.payments.manage', 'integrations.test'),
  async (req, res) => {
    const tested = await svc.testPaymentConnection(req.params.id, req.user);
    if (!tested) return res.status(404).json({ success: false, message: 'Payment gateway not found' });
    successResponse(res, tested, 200, { message: 'Payment gateway connection verified.' });
  }
);

// =============================================================================
// 4. EMAIL INTEGRATIONS
// =============================================================================
router.get(
  '/email',
  requireAnyPermission('integrations.email.view', 'integrations.view'),
  async (req, res) => {
    const data = await svc.getEmailIntegrations();
    successResponse(res, data);
  }
);

router.patch(
  '/email/:id',
  requireAnyPermission('integrations.email.manage'),
  async (req, res) => {
    const updated = await svc.updateEmailIntegration(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: 'Email provider not found' });
    successResponse(res, updated, 200, { message: 'Email configuration saved.' });
  }
);

router.post(
  '/email/:id/test',
  requireAnyPermission('integrations.email.manage', 'integrations.test'),
  async (req, res) => {
    const tested = await svc.testEmailIntegration(req.params.id, req.user);
    if (!tested) return res.status(404).json({ success: false, message: 'Email provider not found' });
    successResponse(res, tested, 200, { message: 'Email provider connection tested.' });
  }
);

router.post(
  '/email/:id/send-test',
  requireAnyPermission('integrations.email.manage'),
  async (req, res) => {
    const sent = await svc.sendTestEmail(req.params.id, req.body.toEmail, req.user);
    if (!sent) return res.status(404).json({ success: false, message: 'Email provider not found' });
    successResponse(res, sent, 200, { message: 'Test email dispatched.' });
  }
);

// =============================================================================
// 5. CLOUD STORAGE INTEGRATIONS
// =============================================================================
router.get(
  '/storage',
  requireAnyPermission('integrations.storage.view', 'integrations.view'),
  async (req, res) => {
    const data = await svc.getStorageIntegrations();
    successResponse(res, data);
  }
);

router.patch(
  '/storage/:id',
  requireAnyPermission('integrations.storage.manage'),
  async (req, res) => {
    const updated = await svc.updateStorageIntegration(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: 'Storage provider not found' });
    successResponse(res, updated, 200, { message: 'Storage configuration saved.' });
  }
);

router.post(
  '/storage/:id/test',
  requireAnyPermission('integrations.storage.manage', 'integrations.test'),
  async (req, res) => {
    const tested = await svc.testStorageConnection(req.params.id, req.user);
    if (!tested) return res.status(404).json({ success: false, message: 'Storage provider not found' });
    successResponse(res, tested, 200, { message: 'Storage bucket connectivity tested.' });
  }
);

// =============================================================================
// 6. WEBHOOKS MANAGEMENT
// =============================================================================
router.get(
  '/webhooks/deliveries',
  requireAnyPermission('integrations.webhooks.view', 'integrations.view'),
  async (req, res) => {
    const data = await svc.getWebhookDeliveries(req.query);
    paginatedResponse(res, data.deliveries, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

router.post(
  '/webhooks/deliveries/:deliveryId/retry',
  requireAnyPermission('integrations.webhooks.retry'),
  async (req, res) => {
    const retried = await svc.retryWebhookDelivery(req.params.deliveryId, req.user);
    if (!retried) return res.status(404).json({ success: false, message: 'Webhook delivery not found' });
    successResponse(res, retried, 200, { message: 'Webhook delivery re-attempt queued.' });
  }
);

router.get(
  '/webhooks',
  requireAnyPermission('integrations.webhooks.view', 'integrations.view'),
  async (req, res) => {
    const data = await svc.getWebhooks(req.query);
    successResponse(res, data);
  }
);

router.post(
  '/webhooks',
  requireAnyPermission('integrations.webhooks.create'),
  async (req, res) => {
    const created = await svc.createWebhook(req.body, req.user);
    successResponse(res, created, 201, { message: 'Webhook endpoint registered.' });
  }
);

router.get(
  '/webhooks/:id',
  requireAnyPermission('integrations.webhooks.view'),
  async (req, res) => {
    const wh = await svc.getWebhookById(req.params.id);
    if (!wh) return res.status(404).json({ success: false, message: 'Webhook endpoint not found' });
    successResponse(res, wh);
  }
);

router.patch(
  '/webhooks/:id',
  requireAnyPermission('integrations.webhooks.update'),
  async (req, res) => {
    const updated = await svc.updateWebhook(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: 'Webhook endpoint not found' });
    successResponse(res, updated, 200, { message: 'Webhook endpoint updated.' });
  }
);

router.delete(
  '/webhooks/:id',
  requireAnyPermission('integrations.webhooks.delete'),
  async (req, res) => {
    const deleted = await svc.deleteWebhook(req.params.id, req.user);
    if (!deleted) return res.status(404).json({ success: false, message: 'Webhook endpoint not found' });
    successResponse(res, deleted, 200, { message: 'Webhook endpoint removed.' });
  }
);

router.post(
  '/webhooks/:id/rotate-secret',
  requireAnyPermission('integrations.webhooks.manage_secrets'),
  async (req, res) => {
    const rotated = await svc.rotateWebhookSecret(req.params.id, req.user);
    if (!rotated) return res.status(404).json({ success: false, message: 'Webhook endpoint not found' });
    successResponse(res, rotated, 200, { message: 'Signing secret rotated.' });
  }
);

router.post(
  '/webhooks/:id/test',
  requireAnyPermission('integrations.webhooks.view', 'integrations.test'),
  async (req, res) => {
    const tested = await svc.testWebhookEndpoint(req.params.id, req.user);
    if (!tested) return res.status(404).json({ success: false, message: 'Webhook endpoint not found' });
    successResponse(res, tested, 200, { message: 'Test ping delivered to webhook endpoint.' });
  }
);

// =============================================================================
// 7. EXTERNAL SERVICES
// =============================================================================
router.get(
  '/external-services',
  requireAnyPermission('integrations.external_services.view', 'integrations.view'),
  async (req, res) => {
    const data = await svc.getExternalServices();
    successResponse(res, data);
  }
);

router.patch(
  '/external-services/:id',
  requireAnyPermission('integrations.external_services.manage'),
  async (req, res) => {
    const updated = await svc.updateExternalService(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: 'External service not found' });
    successResponse(res, updated, 200, { message: 'External service updated.' });
  }
);

router.post(
  '/external-services/:id/test',
  requireAnyPermission('integrations.external_services.manage', 'integrations.test'),
  async (req, res) => {
    const tested = await svc.testExternalService(req.params.id, req.user);
    if (!tested) return res.status(404).json({ success: false, message: 'External service not found' });
    successResponse(res, tested, 200, { message: 'External service health verified.' });
  }
);

// =============================================================================
// 8. INTEGRATION LOGS
// =============================================================================
router.get(
  '/logs',
  requireAnyPermission('integrations.logs.view', 'integrations.view'),
  async (req, res) => {
    const data = await svc.getIntegrationLogs(req.query);
    paginatedResponse(res, data.logs, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

// =============================================================================
// 9. API DOCUMENTATION
// =============================================================================
router.get(
  '/documentation',
  requireAnyPermission('integrations.documentation.view', 'api.read'),
  (req, res) => {
    const data = svc.getApiDocumentation();
    successResponse(res, data);
  }
);

router.get(
  '/documentation/openapi.json',
  requireAnyPermission('integrations.documentation.view', 'api.read'),
  (req, res) => {
    const data = svc.getApiDocumentation();
    res.json(data.openApiSpec);
  }
);

// =============================================================================
// 10. INTEGRATION SETTINGS
// =============================================================================
router.get(
  '/settings',
  requireAnyPermission('integrations.settings.view', 'settings.read'),
  async (req, res) => {
    const data = await svc.getIntegrationSettings();
    successResponse(res, data);
  }
);

router.patch(
  '/settings',
  requireAnyPermission('integrations.settings.manage', 'settings.integrations'),
  async (req, res) => {
    const updated = await svc.updateIntegrationSettings(req.body, req.user);
    successResponse(res, updated, 200, { message: 'Integration settings saved.' });
  }
);

// =============================================================================
// 11. CENTRAL INTEGRATIONS REGISTRY
// =============================================================================
router.get(
  '/',
  requireAnyPermission('integrations.view', 'api.read'),
  async (req, res) => {
    const data = await svc.getIntegrations(req.query);
    successResponse(res, data);
  }
);

router.post(
  '/',
  requireAnyPermission('integrations.create'),
  async (req, res) => {
    const created = await svc.createIntegration(req.body, req.user);
    successResponse(res, created, 201, { message: 'Integration added.' });
  }
);

router.get(
  '/:id',
  requireAnyPermission('integrations.view'),
  async (req, res) => {
    const item = await svc.getIntegrationById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Integration not found' });
    successResponse(res, item);
  }
);

router.patch(
  '/:id',
  requireAnyPermission('integrations.update'),
  async (req, res) => {
    const updated = await svc.updateIntegration(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: 'Integration not found' });
    successResponse(res, updated, 200, { message: 'Integration updated.' });
  }
);

router.delete(
  '/:id',
  requireAnyPermission('integrations.delete'),
  async (req, res) => {
    const deleted = await svc.deleteIntegration(req.params.id, req.user);
    if (!deleted) return res.status(404).json({ success: false, message: 'Integration not found' });
    successResponse(res, deleted, 200, { message: 'Integration deleted.' });
  }
);

router.post(
  '/:id/test',
  requireAnyPermission('integrations.test'),
  async (req, res) => {
    const tested = await svc.testIntegrationConnection(req.params.id, req.user);
    if (!tested) return res.status(404).json({ success: false, message: 'Integration not found' });
    successResponse(res, tested, 200, { message: 'Integration connection tested.' });
  }
);

router.post(
  '/:id/toggle-status',
  requireAnyPermission('integrations.enable', 'integrations.disable'),
  async (req, res) => {
    const toggled = await svc.toggleIntegrationStatus(req.params.id, req.user);
    if (!toggled) return res.status(404).json({ success: false, message: 'Integration not found' });
    successResponse(res, toggled, 200, { message: `Integration is now ${toggled.status}.` });
  }
);

module.exports = router;
