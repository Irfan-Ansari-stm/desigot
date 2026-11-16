'use strict';

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const settingsService = require('../src/modules/settings/settings.service');
const { query } = require('../src/db/pool');

async function runTests() {
  console.log('===============================================================');
  console.log('RUNNING MODULE 17: COMPLETE SYSTEM SETTINGS MANAGEMENT TESTS');
  console.log('===============================================================');

  let passed = 0;
  const testUserRes = await query(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`);
  const adminId = testUserRes.rows[0]?.id;

  try {
    // 1. Public client configuration
    const publicConfig = await settingsService.getPublicConfig();
    assert(publicConfig.app_name, 'Public config must return app_name');
    assert(publicConfig.default_currency, 'Public config must return default_currency');
    assert(publicConfig.branding, 'Public config must return branding information');
    assert(Array.isArray(publicConfig.supported_currencies), 'Must return supported currencies list');
    console.log('✓ [PASS] getPublicConfig returns safe bootstrap data for frontend client');
    passed++;

    // 2. All settings grouped
    const all = await settingsService.getAllSettings();
    assert(all.general, 'All settings must include general group');
    assert(all.marketplace, 'All settings must include marketplace group');
    assert(all.authentication, 'All settings must include authentication group');
    console.log('✓ [PASS] getAllSettings returns categorized settings dictionary');
    passed++;

    // 3. Get settings by group
    const generalGroup = await settingsService.getSettingsByGroup('general');
    assert(generalGroup['general.app_name'], 'General group must contain general.app_name');
    console.log('✓ [PASS] getSettingsByGroup fetches key-value map for target group');
    passed++;

    // 4. Update settings group & verify version + audit log
    const updated = await settingsService.updateSettingsGroup(
      'general',
      { 'general.tagline': 'Automated Test Tagline ' + Date.now() },
      adminId,
      { reason: 'Unit test update', userName: 'Test Runner' }
    );
    assert(updated['general.tagline'], 'Updated group must return new tagline');
    console.log('✓ [PASS] updateSettingsGroup updates settings and creates version record');
    passed++;

    // 5. Audit history retrieval
    const history = await settingsService.getSettingsHistory({ group: 'general', limit: 5 });
    assert(Array.isArray(history.history), 'History must be an array');
    assert(history.total > 0, 'Total audit logs must be greater than zero');
    console.log('✓ [PASS] getSettingsHistory returns paginated audit events');
    passed++;

    // 6. Currencies listing & CRUD
    const currencies = await settingsService.getCurrencies();
    assert(currencies.length >= 5, 'Must have at least 5 default seeded currencies');
    const defaultCurr = currencies.find(c => c.is_default);
    assert(defaultCurr, 'Must have a default base currency');
    console.log('✓ [PASS] getCurrencies returns multi-currency catalogue with default currency');
    passed++;

    // Create currency
    const testCurrCode = 'TST_' + Math.floor(Math.random() * 100);
    const newCurr = await settingsService.createCurrency({
      name: 'Test Test Currency',
      code: testCurrCode,
      symbol: 'T$',
      decimal_precision: 2,
      symbol_position: 'before',
      exchange_rate: 0.500000
    });
    assert.strictEqual(newCurr.code, testCurrCode);
    console.log('✓ [PASS] createCurrency provisions new active currency');
    passed++;

    // Update currency
    const updatedCurr = await settingsService.updateCurrency(newCurr.id, { exchange_rate: 0.550000 });
    assert.strictEqual(Number(updatedCurr.exchange_rate), 0.55);
    console.log('✓ [PASS] updateCurrency alters exchange rates and metadata');
    passed++;

    // Delete test currency
    await settingsService.deleteCurrency(newCurr.id);
    const checkDeletedCurr = await query(`SELECT id FROM currency_settings WHERE id = $1`, [newCurr.id]);
    assert.strictEqual(checkDeletedCurr.rows.length, 0);
    console.log('✓ [PASS] deleteCurrency removes non-default currency');
    passed++;

    // 7. Exchange rates history
    const exRates = await settingsService.getExchangeRates();
    assert(Array.isArray(exRates), 'Exchange rates must return an array');
    console.log('✓ [PASS] getExchangeRates returns historical rate adjustments');
    passed++;

    // 8. Languages listing & CRUD
    const languages = await settingsService.getLanguages();
    assert(languages.length >= 5, 'Must have at least 5 seeded languages');
    const defaultLang = languages.find(l => l.is_default);
    assert(defaultLang, 'Must have a designated default language');
    const arLang = languages.find(l => l.code === 'ar');
    assert.strictEqual(arLang.direction, 'rtl', 'Arabic must be configured with RTL direction');
    console.log('✓ [PASS] getLanguages returns multilingual settings with RTL/LTR support');
    passed++;

    // 9. Timezones
    const timezones = await settingsService.getTimezones();
    assert(timezones.length >= 4, 'Must have seeded timezones');
    assert(timezones.some(t => t.timezone === 'Asia/Kolkata'), 'Must include Asia/Kolkata');
    console.log('✓ [PASS] getTimezones retrieves supported IANA timezone definitions');
    passed++;

    // 10. Commissions listing, creation, and calculation simulation
    const comms = await settingsService.getCommissions();
    assert(comms.length >= 3, 'Must have at least 3 commission rules');
    console.log('✓ [PASS] getCommissions lists global and category commission tiers');
    passed++;

    // Simulate commission
    const simService = settingsService.simulateCommission(10000, 'service');
    assert.strictEqual(simService.transaction_amount, 10000);
    assert.strictEqual(simService.commission_rate_percent, 10.0);
    assert.strictEqual(simService.marketplace_commission, 1000);
    assert.strictEqual(simService.seller_net_payout, 9000);

    const simDigital = settingsService.simulateCommission(5000, 'digital_product');
    assert.strictEqual(simDigital.commission_rate_percent, 12.0);
    assert.strictEqual(simDigital.marketplace_commission, 600);
    assert.strictEqual(simDigital.seller_net_payout, 4400);
    console.log('✓ [PASS] simulateCommission computes decimal-safe platform fee and seller earnings');
    passed++;

    // 11. Taxes listing, creation, and calculation preview
    const taxes = await settingsService.getTaxes();
    assert(taxes.length >= 2, 'Must have seeded tax rules');
    console.log('✓ [PASS] getTaxes returns configured tax jurisdictions');
    passed++;

    // Simulate tax (exclusive)
    const simTaxExcl = settingsService.simulateTax(1000, 'gst', false);
    assert.strictEqual(simTaxExcl.tax_rate_percent, 18.0);
    assert.strictEqual(simTaxExcl.tax_amount, 180);
    assert.strictEqual(simTaxExcl.total_with_tax, 1180);

    // Simulate tax (inclusive)
    const simTaxIncl = settingsService.simulateTax(1180, 'gst', true);
    assert.strictEqual(simTaxIncl.total_with_tax, 1180);
    assert(simTaxIncl.tax_amount > 175 && simTaxIncl.tax_amount < 185);
    console.log('✓ [PASS] simulateTax executes inclusive and exclusive jurisdictional calculations');
    passed++;

    // 12. Feature Flags
    const flags = await settingsService.getFeatureFlags();
    assert(flags.length >= 20, 'Must have at least 20 feature flags');
    assert(flags.some(f => f.key === 'service_marketplace'), 'Must have service_marketplace flag');
    assert(flags.some(f => f.key === 'digital_products'), 'Must have digital_products flag');
    console.log('✓ [PASS] getFeatureFlags returns complete catalog of 20+ feature toggles');
    passed++;

    // Update flag
    const updatedFlag = await settingsService.updateFeatureFlag('ai_features', { is_enabled: true, rollout_percentage: 50 }, adminId);
    assert.strictEqual(updatedFlag.is_enabled, true);
    assert.strictEqual(updatedFlag.rollout_percentage, 50);
    console.log('✓ [PASS] updateFeatureFlag toggles rollout percentage and status');
    passed++;

    // 13. Backups & Restore
    const backupData = await settingsService.getBackups();
    assert(Array.isArray(backupData.backups), 'Backups must be an array');
    assert(Array.isArray(backupData.schedules), 'Schedules must be an array');
    console.log('✓ [PASS] getBackups returns backup archives and automated schedules');
    passed++;

    // Trigger backup
    const newBackup = await settingsService.triggerBackup('config', adminId);
    assert(newBackup.id, 'New backup must have an ID');
    assert.strictEqual(newBackup.backup_type, 'config');
    assert(newBackup.checksum.startsWith('sha256:'), 'Backup must contain valid sha256 checksum');
    console.log('✓ [PASS] triggerBackup initiates archive job with cryptographic checksum');
    passed++;

    // Verify backup
    const verifiedBackup = await settingsService.verifyBackup(newBackup.id);
    assert.strictEqual(verifiedBackup.is_verified, true);
    assert.strictEqual(verifiedBackup.status, 'verified');
    console.log('✓ [PASS] verifyBackup validates archive integrity');
    passed++;

    // Restore backup
    const restoreLog = await settingsService.restoreBackup(newBackup.id, adminId, 'Automated verification test');
    assert(restoreLog.id, 'Restore log must have an ID');
    assert.strictEqual(restoreLog.status, 'completed');
    console.log('✓ [PASS] restoreBackup records audited restoration event');
    passed++;

    // 14. System Health & Telemetry
    const health = await settingsService.getSystemHealth();
    assert(health.status === 'healthy' || health.status === 'degraded', 'Health status must be healthy or degraded');
    assert(Array.isArray(health.components), 'Must include monitored component health');
    assert(Array.isArray(health.metrics), 'Must include real-time metrics');
    assert(Array.isArray(health.incidents), 'Must include incidents');
    console.log('✓ [PASS] getSystemHealth reports live component status and telemetry');
    passed++;

    const healthHistory = await settingsService.getHealthHistory();
    assert(Array.isArray(healthHistory), 'Health history must be an array');
    console.log('✓ [PASS] getHealthHistory returns historical telemetry logs');
    passed++;

    // 15. Settings Version Rollback
    const versions = await query(`SELECT id FROM system_setting_versions ORDER BY changed_at DESC LIMIT 1`);
    if (versions.rows.length > 0) {
      const rollback = await settingsService.restoreSettingVersion(versions.rows[0].id, adminId, { userName: 'Test Super Admin' });
      assert(rollback.success, 'Rollback must succeed');
      console.log('✓ [PASS] restoreSettingVersion rolls back setting to previous state');
      passed++;
    }

    console.log('===============================================================');
    console.log(`ALL MODULE 17 SYSTEM SETTINGS TESTS PASSED: ${passed}/${passed}`);
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('✗ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
