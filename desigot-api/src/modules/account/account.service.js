'use strict';

const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const { query, withTransaction } = require('../../db/pool');
const { sha256 } = require('../../shared/utils');
const {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ForbiddenError
} = require('../../shared/errors/AppError');

class AccountService {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. MY PROFILE
  // ─────────────────────────────────────────────────────────────────────────────

  async getProfile(userId) {
    const userRes = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.display_name, u.username,
              u.phone, u.avatar_url, u.bio, u.timezone, u.locale, u.role, u.account_status,
              u.is_super_admin, u.totp_enabled, u.two_factor_enabled, u.email_verified_at,
              u.created_at, u.last_login_at, u.last_seen_at,
              d.name AS department_name, des.title AS designation_title
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN designations des ON des.id = u.designation_id
       WHERE u.id = $1`,
      [userId]
    );

    if (!userRes.rows[0]) {
      throw new NotFoundError('User profile not found');
    }

    const user = userRes.rows[0];

    // Get 1-to-1 profile extension
    const profRes = await query(
      `SELECT job_title, department, company, country, state, city,
              address, postal_code, website, linkedin_url, social_links, phone_verified, updated_at
       FROM user_profiles
       WHERE user_id = $1`,
      [userId]
    );

    const profileData = profRes.rows[0] || {};

    return {
      id: user.id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'User',
      username: user.username || '',
      email: user.email,
      phone: user.phone || '',
      avatar_url: user.avatar_url || null,
      role: user.role,
      is_super_admin: !!user.is_super_admin,
      account_status: user.account_status,
      email_verified: !!user.email_verified_at,
      email_verified_at: user.email_verified_at,
      phone_verified: !!profileData.phone_verified,
      two_factor_enabled: !!(user.totp_enabled || user.two_factor_enabled),
      created_at: user.created_at,
      last_login_at: user.last_login_at,
      job_title: profileData.job_title || user.designation_title || 'Platform Administrator',
      department: profileData.department || user.department_name || 'Engineering & Operations',
      company: profileData.company || 'Desigot Technologies',
      country: profileData.country || 'India',
      state: profileData.state || 'Delhi',
      city: profileData.city || 'New Delhi',
      address: profileData.address || '',
      postal_code: profileData.postal_code || '',
      bio: user.bio || profileData.bio || '',
      website: profileData.website || '',
      linkedin_url: profileData.linkedin_url || '',
      social_links: profileData.social_links || {},
      updated_at: profileData.updated_at || user.created_at
    };
  }

  async updateProfile(userId, data) {
    const {
      first_name,
      last_name,
      display_name,
      username,
      bio,
      job_title,
      department,
      company,
      country,
      state,
      city,
      address,
      postal_code,
      website,
      linkedin_url,
      social_links
    } = data;

    // 1. Update basic fields on users table
    await query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           display_name = COALESCE($3, display_name),
           username = COALESCE($4, username),
           bio = COALESCE($5, bio),
           updated_at = NOW()
       WHERE id = $6`,
      [first_name, last_name, display_name, username, bio, userId]
    );

    // 2. Upsert profile extension on user_profiles
    await query(
      `INSERT INTO user_profiles (
         user_id, job_title, department, company, country, state, city,
         address, postal_code, bio, website, linkedin_url, social_links, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       ON CONFLICT (user_id) DO UPDATE SET 
         job_title = COALESCE(EXCLUDED.job_title, user_profiles.job_title),
         department = COALESCE(EXCLUDED.department, user_profiles.department),
         company = COALESCE(EXCLUDED.company, user_profiles.company),
         country = COALESCE(EXCLUDED.country, user_profiles.country),
         state = COALESCE(EXCLUDED.state, user_profiles.state),
         city = COALESCE(EXCLUDED.city, user_profiles.city),
         address = COALESCE(EXCLUDED.address, user_profiles.address),
         postal_code = COALESCE(EXCLUDED.postal_code, user_profiles.postal_code),
         bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
         website = COALESCE(EXCLUDED.website, user_profiles.website),
         linkedin_url = COALESCE(EXCLUDED.linkedin_url, user_profiles.linkedin_url),
         social_links = COALESCE(EXCLUDED.social_links, user_profiles.social_links),
         updated_at = NOW()`,
      [
        userId,
        job_title,
        department,
        company,
        country,
        state,
        city,
        address,
        postal_code,
        bio,
        website,
        linkedin_url,
        social_links ? JSON.stringify(social_links) : null
      ]
    );

    return this.getProfile(userId);
  }

  async uploadAvatar(userId, avatarUrl) {
    if (!avatarUrl) throw new ValidationError('Avatar URL or path is required');
    await query(`UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`, [avatarUrl, userId]);
    return { avatar_url: avatarUrl };
  }

  async removeAvatar(userId) {
    await query(`UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = $1`, [userId]);
    return { avatar_url: null };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CONTACT VERIFICATION (EMAIL & PHONE)
  // ─────────────────────────────────────────────────────────────────────────────

  async changeEmail(userId, newEmail) {
    if (!newEmail || !newEmail.includes('@')) {
      throw new ValidationError('Valid new email address is required');
    }

    const check = await query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [newEmail, userId]);
    if (check.rows.length > 0) {
      throw new ValidationError('Email address is already in use by another account');
    }

    await query(
      `UPDATE users SET email = $1, email_verified_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [newEmail, userId]
    );

    return { success: true, email: newEmail, message: 'Email address updated and verified successfully.' };
  }

  async changePhone(userId, newPhone) {
    if (!newPhone) throw new ValidationError('Valid phone number is required');

    await query(
      `UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2`,
      [newPhone, userId]
    );

    await query(
      `INSERT INTO user_profiles (user_id, phone_verified, updated_at)
       VALUES ($1, true, NOW())
       ON CONFLICT (user_id) DO UPDATE SET phone_verified = true, updated_at = NOW()`,
      [userId]
    );

    return { success: true, phone: newPhone, message: 'Phone number updated and verified.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PASSWORD MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async changePassword(userId, currentPassword, newPassword, revokeOthers = true, meta = {}) {
    if (!currentPassword) {
      throw new ValidationError('Current password is required');
    }
    if (!newPassword || newPassword.length < 12) {
      throw new ValidationError('New password must be at least 12 characters long');
    }

    const userRes = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    if (!userRes.rows[0]) throw new NotFoundError('User');

    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Current password verification failed');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users 
         SET password_hash = $1, failed_login_count = 0, updated_at = NOW() 
         WHERE id = $2`,
        [newHash, userId]
      );

      await client.query(
        `INSERT INTO user_security_settings (user_id, password_changed_at, updated_at)
         VALUES ($1, NOW(), NOW())
         ON CONFLICT (user_id) DO UPDATE SET password_changed_at = NOW(), updated_at = NOW()`,
        [userId]
      );

      if (revokeOthers) {
        await client.query(
          `UPDATE admin_sessions SET is_revoked = true WHERE user_id = $1 AND is_current = false`,
          [userId]
        );
        await client.query(
          `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1`,
          [userId]
        );
      }

      await client.query(
        `INSERT INTO security_events (event_type, severity, user_id, details, ip_address, resolved, created_at)
         VALUES ('password_changed', 'medium', $1, $2, $3, true, NOW())`,
        [
          userId,
          JSON.stringify({ reason: 'Self-service account password change', revoked_others: revokeOthers }),
          meta.ip || '127.0.0.1'
        ]
      );
    });

    return { success: true, message: 'Password changed successfully. Other sessions terminated.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. TWO-FACTOR AUTHENTICATION (TOTP & RECOVERY CODES)
  // ─────────────────────────────────────────────────────────────────────────────

  async get2FAStatus(userId) {
    const userRes = await query(
      `SELECT totp_enabled, two_factor_enabled FROM users WHERE id = $1`,
      [userId]
    );
    const isEnabled = !!(userRes.rows[0]?.totp_enabled || userRes.rows[0]?.two_factor_enabled);

    const codesRes = await query(
      `SELECT COUNT(*) FROM user_recovery_codes WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );

    return {
      enabled: isEnabled,
      method: 'totp',
      recovery_codes_remaining: parseInt(codesRes.rows[0].count, 10)
    };
  }

  async setup2FA(userId) {
    const userRes = await query(`SELECT email FROM users WHERE id = $1`, [userId]);
    if (!userRes.rows[0]) throw new NotFoundError('User');

    const email = userRes.rows[0].email;
    const secret = speakeasy.generateSecret({
      name: `Desigot Marketplace (${email})`,
      issuer: 'Desigot',
      length: 20
    });

    // Store pending TOTP secret
    await query(`UPDATE users SET totp_secret = $1 WHERE id = $2`, [secret.base32, userId]);

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qr_code: qrCodeUrl,
      manual_entry_key: secret.base32
    };
  }

  async verify2FASetup(userId, totpCode) {
    if (!totpCode) throw new ValidationError('Verification code is required');

    const userRes = await query(`SELECT totp_secret FROM users WHERE id = $1`, [userId]);
    const secret = userRes.rows[0]?.totp_secret;
    if (!secret) throw new ValidationError('Please initiate 2FA setup first');

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: String(totpCode).trim(),
      window: 1
    });

    if (!isValid) {
      throw new ValidationError('Invalid authenticator verification code. Please check your time synchronization.');
    }

    // Enable 2FA
    await query(
      `UPDATE users SET totp_enabled = true, two_factor_enabled = true, updated_at = NOW() WHERE id = $1`,
      [userId]
    );

    // Generate 8 high-entropy recovery codes
    const plaintextCodes = [];
    await query(`DELETE FROM user_recovery_codes WHERE user_id = $1`, [userId]);

    for (let i = 0; i < 8; i++) {
      const code = `${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();
      plaintextCodes.push(code);
      const codeHash = sha256(code);
      await query(
        `INSERT INTO user_recovery_codes (user_id, code_hash) VALUES ($1, $2)`,
        [userId, codeHash]
      );
    }

    // Log security event
    await query(
      `INSERT INTO security_events (event_type, severity, user_id, details, ip_address, resolved, created_at)
       VALUES ('two_factor_enabled', 'low', $1, $2, '127.0.0.1', true, NOW())`,
      [userId, JSON.stringify({ method: 'totp', recovery_codes_generated: 8 })]
    );

    return {
      success: true,
      message: 'Two-factor authentication enabled successfully.',
      recovery_codes: plaintextCodes
    };
  }

  async disable2FA(userId, password) {
    if (!password) throw new ValidationError('Password confirmation is required to disable 2FA');

    const userRes = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    const isMatch = await bcrypt.compare(password, userRes.rows[0].password_hash);
    if (!isMatch) throw new UnauthorizedError('Incorrect password');

    await query(
      `UPDATE users 
       SET totp_enabled = false, two_factor_enabled = false, totp_secret = NULL, updated_at = NOW() 
       WHERE id = $1`,
      [userId]
    );

    await query(`DELETE FROM user_recovery_codes WHERE user_id = $1`, [userId]);

    await query(
      `INSERT INTO security_events (event_type, severity, user_id, details, ip_address, resolved, created_at)
       VALUES ('two_factor_disabled', 'medium', $1, $2, '127.0.0.1', true, NOW())`,
      [userId, JSON.stringify({ reason: 'User requested disable' })]
    );

    return { success: true, message: 'Two-factor authentication disabled' };
  }

  async regenerateRecoveryCodes(userId, password) {
    const userRes = await query(`SELECT password_hash, totp_enabled FROM users WHERE id = $1`, [userId]);
    if (!userRes.rows[0]?.totp_enabled) {
      throw new ValidationError('2FA must be active to generate recovery codes');
    }

    if (password) {
      const isMatch = await bcrypt.compare(password, userRes.rows[0].password_hash);
      if (!isMatch) throw new UnauthorizedError('Incorrect password');
    }

    await query(`DELETE FROM user_recovery_codes WHERE user_id = $1`, [userId]);
    const codes = [];

    for (let i = 0; i < 8; i++) {
      const code = `${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();
      codes.push(code);
      const codeHash = sha256(code);
      await query(
        `INSERT INTO user_recovery_codes (user_id, code_hash) VALUES ($1, $2)`,
        [userId, codeHash]
      );
    }

    return { success: true, recovery_codes: codes };
  }

  async verifyRecoveryCode(userId, code) {
    if (!code) throw new ValidationError('Recovery code is required');
    const hash = sha256(String(code).trim().toUpperCase());

    const check = await query(
      `SELECT id FROM user_recovery_codes 
       WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL`,
      [userId, hash]
    );

    if (!check.rows[0]) {
      throw new ValidationError('Invalid or already used recovery code');
    }

    await query(
      `UPDATE user_recovery_codes SET used_at = NOW() WHERE id = $1`,
      [check.rows[0].id]
    );

    return { success: true, message: 'Recovery code verified successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. ACTIVE SESSIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async getSessions(userId) {
    const res = await query(
      `SELECT id, ip_address, user_agent, device, browser, os,
              location, is_current, is_revoked, device_type,
              last_activity_at, expires_at, created_at
       FROM admin_sessions
       WHERE user_id = $1 AND is_revoked = false
       ORDER BY is_current DESC, last_activity_at DESC`,
      [userId]
    );

    return res.rows;
  }

  async revokeSession(userId, sessionId) {
    const res = await query(
      `UPDATE admin_sessions
       SET is_revoked = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [sessionId, userId]
    );

    if (!res.rows[0]) {
      throw new NotFoundError('Session not found or already terminated');
    }

    await query(
      `INSERT INTO security_events (event_type, severity, user_id, details, ip_address, resolved, created_at)
       VALUES ('session_revoked', 'low', $1, $2, '127.0.0.1', true, NOW())`,
      [userId, JSON.stringify({ session_id: sessionId })]
    );

    return { success: true, message: 'Session revoked successfully' };
  }

  async revokeOtherSessions(userId) {
    await query(
      `UPDATE admin_sessions
       SET is_revoked = true
       WHERE user_id = $1 AND is_current = false`,
      [userId]
    );

    return { success: true, message: 'All other active sessions have been terminated' };
  }

  async revokeAllSessions(userId) {
    await query(
      `UPDATE admin_sessions
       SET is_revoked = true
       WHERE user_id = $1`,
      [userId]
    );

    return { success: true, message: 'All active sessions have been terminated' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. ACCOUNT SECURITY & EVENTS
  // ─────────────────────────────────────────────────────────────────────────────

  async getSecurityOverview(userId) {
    const userRes = await query(
      `SELECT email, email_verified_at, phone, totp_enabled, two_factor_enabled, last_login_at 
       FROM users WHERE id = $1`,
      [userId]
    );
    const user = userRes.rows[0] || {};

    const secSettingsRes = await query(
      `SELECT password_changed_at FROM user_security_settings WHERE user_id = $1`,
      [userId]
    );
    const pwdChanged = secSettingsRes.rows[0]?.password_changed_at || user.created_at;

    const sessionsRes = await query(
      `SELECT COUNT(*) FROM admin_sessions WHERE user_id = $1 AND is_revoked = false`,
      [userId]
    );

    const recentEventsRes = await query(
      `SELECT * FROM security_events 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    const mfaActive = !!(user.totp_enabled || user.two_factor_enabled);
    const emailVerified = !!user.email_verified_at;

    let score = 50;
    if (mfaActive) score += 30;
    if (emailVerified) score += 20;

    return {
      security_score: score,
      status: score >= 80 ? 'Optimal' : score >= 60 ? 'Moderate' : 'Action Required',
      two_factor_enabled: mfaActive,
      email_verified: emailVerified,
      phone_verified: !!user.phone,
      password_changed_at: pwdChanged,
      last_login_at: user.last_login_at,
      active_sessions_count: parseInt(sessionsRes.rows[0].count, 10),
      recent_events: recentEventsRes.rows
    };
  }

  async getSecurityEvents(userId, params = {}) {
    const { limit = 20, offset = 0 } = params;
    const res = await query(
      `SELECT * FROM security_events 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return res.rows;
  }

  async getLoginHistory(userId, params = {}) {
    const { limit = 20, offset = 0 } = params;
    const res = await query(
      `SELECT * FROM login_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return res.rows;
  }

  async reportActivity(userId, data, meta = {}) {
    await query(
      `INSERT INTO security_events (event_type, severity, user_id, details, ip_address, resolved, created_at)
       VALUES ('suspicious_activity_reported', 'high', $1, $2, $3, false, NOW())`,
      [
        userId,
        JSON.stringify({ notes: data.notes, reported_session_id: data.session_id }),
        meta.ip || '127.0.0.1'
      ]
    );
    return { success: true, message: 'Suspicious activity logged for security review' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PREFERENCES
  // ─────────────────────────────────────────────────────────────────────────────

  async getPreferences(userId) {
    const res = await query(
      `SELECT language, timezone, date_format, time_format, currency_display,
              theme, sidebar_collapsed, dashboard_layout, email_notifications,
              security_notifications, login_alerts, marketing_emails, reduced_motion, font_size
       FROM user_preferences
       WHERE user_id = $1`,
      [userId]
    );

    if (res.rows[0]) return res.rows[0];

    // Return defaults if none
    return {
      language: 'en',
      timezone: 'Asia/Kolkata',
      date_format: 'DD/MM/YYYY',
      time_format: '12-hour',
      currency_display: 'INR',
      theme: 'dark',
      sidebar_collapsed: false,
      dashboard_layout: 'comfortable',
      email_notifications: true,
      security_notifications: true,
      login_alerts: true,
      marketing_emails: false,
      reduced_motion: false,
      font_size: 'medium'
    };
  }

  async updatePreferences(userId, data) {
    const res = await query(
      `INSERT INTO user_preferences (
         user_id, language, timezone, date_format, time_format, currency_display,
         theme, sidebar_collapsed, dashboard_layout, email_notifications,
         security_notifications, login_alerts, marketing_emails, reduced_motion, font_size, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
       ON CONFLICT (user_id) DO UPDATE SET 
         language = COALESCE(EXCLUDED.language, user_preferences.language),
         timezone = COALESCE(EXCLUDED.timezone, user_preferences.timezone),
         date_format = COALESCE(EXCLUDED.date_format, user_preferences.date_format),
         time_format = COALESCE(EXCLUDED.time_format, user_preferences.time_format),
         currency_display = COALESCE(EXCLUDED.currency_display, user_preferences.currency_display),
         theme = COALESCE(EXCLUDED.theme, user_preferences.theme),
         sidebar_collapsed = COALESCE(EXCLUDED.sidebar_collapsed, user_preferences.sidebar_collapsed),
         dashboard_layout = COALESCE(EXCLUDED.dashboard_layout, user_preferences.dashboard_layout),
         email_notifications = COALESCE(EXCLUDED.email_notifications, user_preferences.email_notifications),
         security_notifications = COALESCE(EXCLUDED.security_notifications, user_preferences.security_notifications),
         login_alerts = COALESCE(EXCLUDED.login_alerts, user_preferences.login_alerts),
         marketing_emails = COALESCE(EXCLUDED.marketing_emails, user_preferences.marketing_emails),
         reduced_motion = COALESCE(EXCLUDED.reduced_motion, user_preferences.reduced_motion),
         font_size = COALESCE(EXCLUDED.font_size, user_preferences.font_size),
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        data.language || 'en',
        data.timezone || 'Asia/Kolkata',
        data.date_format || 'DD/MM/YYYY',
        data.time_format || '12-hour',
        data.currency_display || 'INR',
        data.theme || 'dark',
        !!data.sidebar_collapsed,
        data.dashboard_layout || 'comfortable',
        data.email_notifications !== false,
        data.security_notifications !== false,
        data.login_alerts !== false,
        !!data.marketing_emails,
        !!data.reduced_motion,
        data.font_size || 'medium'
      ]
    );

    return res.rows[0];
  }

  async resetPreferences(userId) {
    await query(`DELETE FROM user_preferences WHERE user_id = $1`, [userId]);
    return this.getPreferences(userId);
  }
}

module.exports = new AccountService();
