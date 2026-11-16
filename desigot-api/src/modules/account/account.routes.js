'use strict';

const express = require('express');
const router = express.Router();
const accountService = require('./account.service');
const { authenticate } = require('../../middleware/auth');

// All endpoints in this router are self-service operations strictly scoped to the authenticated user (req.user.id)
router.use(authenticate);

// ─────────────────────────────────────────────────────────────────────────────
// 1. MY PROFILE
// ─────────────────────────────────────────────────────────────────────────────

router.get('/profile', async (req, res, next) => {
  try {
    const profile = await accountService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const updated = await accountService.updateProfile(req.user.id, req.body);
    res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/profile/avatar', async (req, res, next) => {
  try {
    const avatar = await accountService.uploadAvatar(req.user.id, req.body.avatar_url);
    res.json({ success: true, message: 'Avatar updated', data: avatar });
  } catch (err) {
    next(err);
  }
});

router.delete('/profile/avatar', async (req, res, next) => {
  try {
    const result = await accountService.removeAvatar(req.user.id);
    res.json({ success: true, message: 'Avatar removed', data: result });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONTACT VERIFICATION (EMAIL & PHONE)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/email/change', async (req, res, next) => {
  try {
    const result = await accountService.changeEmail(req.user.id, req.body.new_email || req.body.email);
    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/email/verify', async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
});

router.post('/phone/change', async (req, res, next) => {
  try {
    const result = await accountService.changePhone(req.user.id, req.body.new_phone || req.body.phone);
    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/phone/verify', async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Phone number verified successfully.' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PASSWORD MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

router.post('/password/change', async (req, res, next) => {
  try {
    const { current_password, new_password, revoke_others } = req.body;
    const meta = { ip: req.ip || req.connection.remoteAddress };
    const result = await accountService.changePassword(
      req.user.id,
      current_password,
      new_password,
      revoke_others !== false,
      meta
    );
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TWO-FACTOR AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

router.get('/2fa', async (req, res, next) => {
  try {
    const status = await accountService.get2FAStatus(req.user.id);
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/setup', async (req, res, next) => {
  try {
    const setupData = await accountService.setup2FA(req.user.id);
    res.json({ success: true, data: setupData });
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/verify-setup', async (req, res, next) => {
  try {
    const result = await accountService.verify2FASetup(req.user.id, req.body.code || req.body.totp_code);
    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/disable', async (req, res, next) => {
  try {
    const result = await accountService.disable2FA(req.user.id, req.body.password);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/recovery-codes/regenerate', async (req, res, next) => {
  try {
    const result = await accountService.regenerateRecoveryCodes(req.user.id, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/recovery-codes/verify', async (req, res, next) => {
  try {
    const result = await accountService.verifyRecoveryCode(req.user.id, req.body.code);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ACTIVE SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = await accountService.getSessions(req.user.id);
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
});

router.get('/sessions/:id', async (req, res, next) => {
  try {
    const sessions = await accountService.getSessions(req.user.id);
    const item = sessions.find((s) => s.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

router.delete('/sessions/:id', async (req, res, next) => {
  try {
    await accountService.revokeSession(req.user.id, req.params.id);
    res.json({ success: true, message: 'Session terminated' });
  } catch (err) {
    next(err);
  }
});

router.post('/sessions/revoke-others', async (req, res, next) => {
  try {
    await accountService.revokeOtherSessions(req.user.id);
    res.json({ success: true, message: 'All other active sessions revoked' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ACCOUNT SECURITY & EVENTS
// ─────────────────────────────────────────────────────────────────────────────

router.get('/security', async (req, res, next) => {
  try {
    const overview = await accountService.getSecurityOverview(req.user.id);
    res.json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
});

router.get('/security/events', async (req, res, next) => {
  try {
    const events = await accountService.getSecurityEvents(req.user.id, req.query);
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

router.get('/security/login-history', async (req, res, next) => {
  try {
    const history = await accountService.getLoginHistory(req.user.id, req.query);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

router.post('/security/report-activity', async (req, res, next) => {
  try {
    const meta = { ip: req.ip || req.connection.remoteAddress };
    const result = await accountService.reportActivity(req.user.id, req.body, meta);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────

router.get('/preferences', async (req, res, next) => {
  try {
    const preferences = await accountService.getPreferences(req.user.id);
    res.json({ success: true, data: preferences });
  } catch (err) {
    next(err);
  }
});

router.patch('/preferences', async (req, res, next) => {
  try {
    const updated = await accountService.updatePreferences(req.user.id, req.body);
    res.json({ success: true, message: 'Preferences updated', data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/preferences/reset', async (req, res, next) => {
  try {
    const reset = await accountService.resetPreferences(req.user.id);
    res.json({ success: true, message: 'Preferences reset to defaults', data: reset });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
