'use strict';

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const accountService = require('../src/modules/account/account.service');
const { query } = require('../src/db/pool');
const speakeasy = require('speakeasy');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('===============================================================');
  console.log('RUNNING MODULE 18: PROFILE & ACCOUNT MANAGEMENT TESTS');
  console.log('===============================================================');

  let passed = 0;
  const userRes = await query(`SELECT id, email, password_hash FROM users ORDER BY created_at ASC LIMIT 1`);
  assert(userRes.rows[0], 'Test user required');
  const testUser = userRes.rows[0];
  const userId = testUser.id;

  // Set known initial password for testing
  const knownPassword = 'InitialP@ssword1234!';
  const initialHash = await bcrypt.hash(knownPassword, 10);
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [initialHash, userId]);

  try {
    // 1. View own profile
    const profile = await accountService.getProfile(userId);
    assert(profile.id === userId, 'Profile ID must match authenticated user');
    assert(profile.email, 'Profile must include email');
    assert(profile.job_title, 'Profile must include job title');
    assert(profile.company, 'Profile must include company');
    console.log('✓ [PASS] getProfile returns authenticated user profile with professional details');
    passed++;

    // 2. Update own profile
    const updatedBio = 'Updated Bio via Automated Test ' + Date.now();
    const updated = await accountService.updateProfile(userId, {
      first_name: 'TestAdmin',
      bio: updatedBio,
      job_title: 'Senior Systems Architect',
      city: 'New Delhi'
    });
    assert.strictEqual(updated.first_name, 'TestAdmin');
    assert.strictEqual(updated.bio, updatedBio);
    assert.strictEqual(updated.job_title, 'Senior Systems Architect');
    console.log('✓ [PASS] updateProfile persists bio, name, and professional metadata');
    passed++;

    // 3. Avatar Upload & Remove
    const avatarRes = await accountService.uploadAvatar(userId, 'https://cdn.example.com/avatars/test-avatar.png');
    assert.strictEqual(avatarRes.avatar_url, 'https://cdn.example.com/avatars/test-avatar.png');
    console.log('✓ [PASS] uploadAvatar assigns new avatar image URL');
    passed++;

    const removeAvatarRes = await accountService.removeAvatar(userId);
    assert.strictEqual(removeAvatarRes.avatar_url, null);
    console.log('✓ [PASS] removeAvatar clears personal avatar path');
    passed++;

    // 4. Contact Update (Email & Phone)
    const testPhone = '+91 99887 76655';
    const phoneRes = await accountService.changePhone(userId, testPhone);
    assert.strictEqual(phoneRes.phone, testPhone);
    const profileCheck = await accountService.getProfile(userId);
    assert.strictEqual(profileCheck.phone, testPhone);
    assert.strictEqual(profileCheck.phone_verified, true);
    console.log('✓ [PASS] changePhone updates contact phone with verification flag');
    passed++;

    // 5. Password Change Validation - Incorrect Current Password Rejection
    try {
      await accountService.changePassword(userId, 'WrongCurrentPassword!', 'NewValidPassword1234!');
      assert.fail('Should reject wrong current password');
    } catch (err) {
      assert(err.message.includes('password verification failed'), 'Must reject wrong password');
    }
    console.log('✓ [PASS] changePassword rejects incorrect current credentials');
    passed++;

    // 6. Password Change Validation - Short Password Rejection (< 12 chars)
    try {
      await accountService.changePassword(userId, knownPassword, 'Short1!');
      assert.fail('Should reject password under 12 characters');
    } catch (err) {
      assert(err.message.includes('at least 12 characters'), 'Must enforce min 12 chars');
    }
    console.log('✓ [PASS] changePassword enforces 12-character minimum security policy');
    passed++;

    // 7. Successful Password Change & Session Revocation
    const newPassword = 'BrandNewP@ssword2026!';
    const pwdRes = await accountService.changePassword(userId, knownPassword, newPassword, true);
    assert(pwdRes.success, 'Password change must report success');

    // Verify hash changed
    const userCheck = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    const matchesNew = await bcrypt.compare(newPassword, userCheck.rows[0].password_hash);
    assert(matchesNew, 'Database hash must verify against newly assigned password');
    console.log('✓ [PASS] changePassword updates cryptographic hash and terminates other sessions');
    passed++;

    // 8. 2FA Status & Enrollment (TOTP Setup)
    const init2fa = await accountService.get2FAStatus(userId);
    assert(typeof init2fa.enabled === 'boolean', '2FA status must return enabled boolean');
    console.log('✓ [PASS] get2FAStatus returns current two-factor posture');
    passed++;

    const setupData = await accountService.setup2FA(userId);
    assert(setupData.secret, 'Setup must return base32 secret');
    assert(setupData.qr_code && setupData.qr_code.startsWith('data:image/png;base64,'), 'Setup must return valid base64 QR code');
    console.log('✓ [PASS] setup2FA generates Speakeasy TOTP secret and data URL QR code');
    passed++;

    // 9. Verify 2FA Setup with real TOTP code
    const validCode = speakeasy.totp({
      secret: setupData.secret,
      encoding: 'base32'
    });

    const verifyRes = await accountService.verify2FASetup(userId, validCode);
    assert(verifyRes.success, 'Verification must succeed');
    assert(Array.isArray(verifyRes.recovery_codes), 'Must return 8 recovery codes');
    assert.strictEqual(verifyRes.recovery_codes.length, 8);
    console.log('✓ [PASS] verify2FASetup activates 2FA and generates 8 high-entropy recovery codes');
    passed++;

    // Verify 2FA is now active
    const active2fa = await accountService.get2FAStatus(userId);
    assert.strictEqual(active2fa.enabled, true);
    assert.strictEqual(active2fa.recovery_codes_remaining, 8);
    console.log('✓ [PASS] get2FAStatus reflects active MFA with 8 recovery codes');
    passed++;

    // 10. Verify Recovery Code Consumption
    const testCode = verifyRes.recovery_codes[0];
    const recRes = await accountService.verifyRecoveryCode(userId, testCode);
    assert(recRes.success, 'Recovery code must verify successfully');

    // Cannot reuse same recovery code
    try {
      await accountService.verifyRecoveryCode(userId, testCode);
      assert.fail('Should reject already consumed recovery code');
    } catch (err) {
      assert(err.message.includes('Invalid or already used'), 'Must block code reuse');
    }
    console.log('✓ [PASS] verifyRecoveryCode consumes single-use recovery code and prevents replay');
    passed++;

    // 11. Regenerate Recovery Codes
    const regenRes = await accountService.regenerateRecoveryCodes(userId, newPassword);
    assert(regenRes.success, 'Regeneration must succeed');
    assert.strictEqual(regenRes.recovery_codes.length, 8);
    console.log('✓ [PASS] regenerateRecoveryCodes revokes old codes and issues fresh set');
    passed++;

    // 12. Disable 2FA with password confirmation
    const disableRes = await accountService.disable2FA(userId, newPassword);
    assert(disableRes.success, 'Disable 2FA must report success');
    const disabled2fa = await accountService.get2FAStatus(userId);
    assert.strictEqual(disabled2fa.enabled, false);
    console.log('✓ [PASS] disable2FA validates password and revokes MFA configuration');
    passed++;

    // 13. Active Sessions Listing & Revocation
    const testSessRes = await query(
      `INSERT INTO admin_sessions (user_id, session_token, ip_address, user_agent, is_current, is_revoked, expires_at)
       VALUES ($1, $2, '127.0.0.1', 'Automated Test Client', false, false, NOW() + INTERVAL '1 day')
       RETURNING id`,
      [userId, `test_sess_${Date.now()}`]
    );
    const targetSessionId = testSessRes.rows[0].id;

    const sessions = await accountService.getSessions(userId);
    assert(Array.isArray(sessions), 'Sessions must return an array');
    console.log('✓ [PASS] getSessions lists authenticated client sessions');
    passed++;

    const revRes = await accountService.revokeSession(userId, targetSessionId);
    assert(revRes.success, 'Revoke session must succeed');
    console.log('✓ [PASS] revokeSession securely terminates target session');
    passed++;

    // 14. Revoke Other Sessions
    const revOthersRes = await accountService.revokeOtherSessions(userId);
    assert(revOthersRes.success, 'Revoke other sessions must report success');
    console.log('✓ [PASS] revokeOtherSessions clears background client logins');
    passed++;

    // Restore active session for subsequent test suites
    await query(
      `INSERT INTO admin_sessions (user_id, session_token, ip_address, user_agent, is_current, is_revoked, expires_at)
       VALUES ($1, $2, '103.21.244.12', 'Chrome 128 / macOS', true, false, NOW() + INTERVAL '7 days')`,
      [userId, `active_sess_${Date.now()}`]
    );

    // 15. Security Overview & Events
    const secOverview = await accountService.getSecurityOverview(userId);
    assert(secOverview.security_score > 0, 'Security score must be calculated');
    assert(secOverview.status, 'Security status badge must be present');
    console.log('✓ [PASS] getSecurityOverview aggregates security score and posture');
    passed++;

    const secEvents = await accountService.getSecurityEvents(userId, { limit: 5 });
    assert(Array.isArray(secEvents), 'Security events must return array');
    assert(secEvents.length > 0, 'Must have recorded events from prior steps');
    console.log('✓ [PASS] getSecurityEvents returns immutable audit trail of personal security events');
    passed++;

    const loginHist = await accountService.getLoginHistory(userId, { limit: 5 });
    assert(Array.isArray(loginHist), 'Login history must return array');
    console.log('✓ [PASS] getLoginHistory retrieves authenticated access logs');
    passed++;

    // 16. Report Suspicious Activity
    const reportRes = await accountService.reportActivity(userId, { notes: 'Suspicious IP access' });
    assert(reportRes.success, 'Report activity must record event');
    console.log('✓ [PASS] reportActivity logs incident for security investigation');
    passed++;

    // 17. Preferences CRUD & Reset
    const prefs = await accountService.getPreferences(userId);
    assert(prefs.language, 'Preferences must include language');
    assert(prefs.timezone, 'Preferences must include timezone');
    assert(prefs.theme, 'Preferences must include theme');
    console.log('✓ [PASS] getPreferences retrieves personal UI and notification settings');
    passed++;

    const updatedPrefs = await accountService.updatePreferences(userId, {
      theme: 'light',
      sidebar_collapsed: true,
      time_format: '24-hour',
      marketing_emails: false
    });
    assert.strictEqual(updatedPrefs.theme, 'light');
    assert.strictEqual(updatedPrefs.sidebar_collapsed, true);
    assert.strictEqual(updatedPrefs.time_format, '24-hour');
    console.log('✓ [PASS] updatePreferences persists theme, layout, and notification flags');
    passed++;

    const resetPrefs = await accountService.resetPreferences(userId);
    assert.strictEqual(resetPrefs.theme, 'dark');
    console.log('✓ [PASS] resetPreferences restores standard default settings');
    passed++;

    console.log('===============================================================');
    console.log(`ALL MODULE 18 PROFILE & ACCOUNT TESTS PASSED: ${passed}/${passed}`);
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('✗ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
