'use strict';
require('dotenv').config();
const { query } = require('./pool');
const crypto = require('crypto');

async function seedAccount() {
  console.log('--- STARTING MODULE 18: PROFILE & ACCOUNT MANAGEMENT SEEDING ---');

  try {
    // 0. Fetch primary admin user
    const userRes = await query(`SELECT id, email, display_name FROM users ORDER BY created_at ASC LIMIT 1`);
    if (!userRes.rows[0]) {
      console.log('No user found in database to attach profile to. Skipping.');
      process.exit(0);
    }
    const adminUser = userRes.rows[0];
    const adminId = adminUser.id;
    console.log(`Attaching profile & preferences to Admin User: ${adminUser.display_name} (${adminUser.email}) [${adminId}]`);

    // 1. Seed RBAC Permissions for Personal Account Management
    console.log('Seeding Personal Account Permissions...');
    const permissions = [
      { name: 'View Own Account Profile', slug: 'account.profile.view', desc: 'Allows viewing personal profile details' },
      { name: 'Update Own Account Profile', slug: 'account.profile.update', desc: 'Allows updating personal contact & bio information' },
      { name: 'Manage Profile Avatar', slug: 'account.profile.avatar.manage', desc: 'Upload or delete personal profile avatar' },
      { name: 'Change Account Password', slug: 'account.password.change', desc: 'Change personal password with verification' },
      { name: 'View Two-Factor Auth', slug: 'account.2fa.view', desc: 'Inspect personal 2FA status' },
      { name: 'Manage Two-Factor Auth', slug: 'account.2fa.manage', desc: 'Configure, enable, or disable personal 2FA & recovery codes' },
      { name: 'View Active Sessions', slug: 'account.sessions.view', desc: 'Inspect personal active login sessions' },
      { name: 'Revoke Personal Sessions', slug: 'account.sessions.revoke', desc: 'Terminate personal active sessions' },
      { name: 'View Account Security', slug: 'account.security.view', desc: 'Inspect account security posture' },
      { name: 'View Security Activity', slug: 'account.security.activity.view', desc: 'Review login history and security events' },
      { name: 'View Preferences', slug: 'account.preferences.view', desc: 'Inspect personal display & notification preferences' },
      { name: 'Update Preferences', slug: 'account.preferences.update', desc: 'Update theme, language, and notification toggles' }
    ];

    const modRes = await query(`SELECT id FROM modules WHERE slug = 'users' OR slug = 'settings' LIMIT 1`);
    const moduleId = modRes.rows[0]?.id || null;

    const roleRes = await query(`SELECT id FROM roles WHERE slug = 'superadmin' OR slug = 'admin'`);
    const superAdminRole = roleRes.rows.find(r => r.slug === 'superadmin') || roleRes.rows[0];
    const adminRole = roleRes.rows.find(r => r.slug === 'admin') || superAdminRole;

    for (const p of permissions) {
      const pRes = await query(
        `INSERT INTO permissions (name, slug, resource, action, description, module_id, created_at, updated_at)
         VALUES ($1, $2, 'account', 'MANAGE', $3, $4, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, module_id = EXCLUDED.module_id
         RETURNING id`,
        [p.name, p.slug, p.desc, moduleId]
      );
      const permId = pRes.rows[0].id;

      if (superAdminRole) {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [superAdminRole.id, permId]
        );
      }
      if (adminRole && adminRole.id !== superAdminRole?.id) {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [adminRole.id, permId]
        );
      }
    }
    console.log(`✓ Seeded ${permissions.length} account permissions.`);

    // 2. Seed User Profile
    console.log('Seeding User Profile details...');
    await query(
      `INSERT INTO user_profiles (
         user_id, job_title, department, company, country, state, city,
         address, postal_code, bio, website, linkedin_url, social_links, phone_verified, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       ON CONFLICT (user_id) DO UPDATE SET 
         job_title = EXCLUDED.job_title,
         department = EXCLUDED.department,
         company = EXCLUDED.company,
         country = EXCLUDED.country,
         state = EXCLUDED.state,
         city = EXCLUDED.city,
         address = EXCLUDED.address,
         postal_code = EXCLUDED.postal_code,
         bio = EXCLUDED.bio,
         website = EXCLUDED.website,
         linkedin_url = EXCLUDED.linkedin_url,
         social_links = EXCLUDED.social_links,
         phone_verified = EXCLUDED.phone_verified,
         updated_at = NOW()`,
      [
        adminId,
        'Chief Platform Architect',
        'Platform Engineering & Administration',
        'Desigot Technologies Private Limited',
        'India',
        'Delhi',
        'New Delhi',
        'Block C, Connaught Place, Central Business District',
        '110001',
        'Principal systems architect overseeing the Desigot global digital marketplace platform infrastructure, zero-trust security, and commerce engines.',
        'https://example.com',
        'https://linkedin.com/company/desigot',
        JSON.stringify({
          twitter: 'https://twitter.com/desigot',
          github: 'https://github.com/desigot'
        }),
        true
      ]
    );

    // Update users basic fields if empty
    await query(
      `UPDATE users 
       SET first_name = COALESCE(first_name, 'Desigot'),
           last_name = COALESCE(last_name, 'Admin'),
           display_name = COALESCE(display_name, 'Desigot Administrator'),
           phone = COALESCE(phone, '+91 98765 43210'),
           avatar_url = COALESCE(avatar_url, '/avatars/admin-default.png')
       WHERE id = $1`,
      [adminId]
    );
    console.log('✓ Seeded user_profiles record.');

    // 3. Seed User Preferences
    console.log('Seeding User Preferences...');
    await query(
      `INSERT INTO user_preferences (
         user_id, language, timezone, date_format, time_format, currency_display,
         theme, sidebar_collapsed, dashboard_layout, email_notifications,
         security_notifications, login_alerts, marketing_emails, reduced_motion, font_size, updated_at
       )
       VALUES ($1, 'en', 'Asia/Kolkata', 'DD/MM/YYYY', '12-hour', 'INR', 'dark', false, 'comfortable', true, true, true, false, false, 'medium', NOW())
       ON CONFLICT (user_id) DO UPDATE SET 
         theme = EXCLUDED.theme,
         language = EXCLUDED.language,
         timezone = EXCLUDED.timezone,
         date_format = EXCLUDED.date_format,
         time_format = EXCLUDED.time_format,
         updated_at = NOW()`,
      [adminId]
    );
    console.log('✓ Seeded user_preferences record.');

    // 4. Seed User Security Settings
    console.log('Seeding User Security Settings...');
    await query(
      `INSERT INTO user_security_settings (
         user_id, password_changed_at, two_factor_method, email_security_notifications,
         login_alerts, revoke_sessions_on_password_change, updated_at
       )
       VALUES ($1, NOW() - INTERVAL '14 days', 'totp', true, true, true, NOW())
       ON CONFLICT (user_id) DO UPDATE SET 
         two_factor_method = EXCLUDED.two_factor_method,
         email_security_notifications = EXCLUDED.email_security_notifications,
         updated_at = NOW()`,
      [adminId]
    );
    console.log('✓ Seeded user_security_settings record.');

    // 5. Seed Sample Active Sessions
    console.log('Seeding Sample Active Sessions in admin_sessions...');
    // Clear old sample sessions for clean idempotent state
    await query(`DELETE FROM admin_sessions WHERE user_id = $1`, [adminId]);

    const sessions = [
      {
        token: `sess_${crypto.randomBytes(16).toString('hex')}`,
        ip: '103.21.244.12',
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        device: 'MacBook Pro 16"',
        browser: 'Google Chrome 128.0',
        os: 'macOS Sonoma',
        location: 'New Delhi, India',
        is_current: true,
        device_type: 'desktop',
        last_active: '2 minutes ago',
        hoursAgo: 0
      },
      {
        token: `sess_${crypto.randomBytes(16).toString('hex')}`,
        ip: '49.36.120.45',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
        device: 'Dell XPS Desktop',
        browser: 'Mozilla Firefox 130.0',
        os: 'Windows 11 Enterprise',
        location: 'Bengaluru, India',
        is_current: false,
        device_type: 'desktop',
        last_active: '5 hours ago',
        hoursAgo: 5
      },
      {
        token: `sess_${crypto.randomBytes(16).toString('hex')}`,
        ip: '157.34.198.88',
        ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
        device: 'Google Pixel 8 Pro',
        browser: 'Chrome Mobile 128.0',
        os: 'Android 14',
        location: 'Mumbai, India',
        is_current: false,
        device_type: 'mobile',
        last_active: '1 day ago',
        hoursAgo: 24
      }
    ];

    for (const s of sessions) {
      await query(
        `INSERT INTO admin_sessions (
           user_id, session_token, ip_address, user_agent, device, browser, os,
           location, is_current, is_revoked, device_type, last_activity_at, expires_at, created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, NOW() - ($11 || ' hours')::INTERVAL, NOW() + INTERVAL '7 days', NOW() - ($11 || ' hours')::INTERVAL)`,
        [adminId, s.token, s.ip, s.ua, s.device, s.browser, s.os, s.location, s.is_current, s.device_type, s.hoursAgo]
      );
    }
    console.log(`✓ Seeded ${sessions.length} admin sessions.`);

    // 6. Seed Sample Login History
    console.log('Seeding Sample Login History for user...');
    const logins = [
      { status: 'success', ip: '103.21.244.12', ua: 'Chrome 128 / macOS', device: 'desktop', method: 'password_mfa', location: 'New Delhi, India', hoursAgo: 0 },
      { status: 'success', ip: '49.36.120.45', ua: 'Firefox 130 / Windows 11', device: 'desktop', method: 'password_mfa', location: 'Bengaluru, India', hoursAgo: 5 },
      { status: 'failed', ip: '198.51.100.23', ua: 'Unknown Client / Linux', device: 'unknown', method: 'password', location: 'Frankfurt, Germany', reason: 'Invalid password credentials', hoursAgo: 12 },
      { status: 'success', ip: '157.34.198.88', ua: 'Chrome Mobile / Android', device: 'mobile', method: 'refresh_token', location: 'Mumbai, India', hoursAgo: 24 }
    ];

    for (const l of logins) {
      await query(
        `INSERT INTO login_history (
           user_id, email, ip_address, user_agent, status, failure_reason,
           device_type, authentication_method, location, created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - ($10 || ' hours')::INTERVAL)`,
        [adminId, adminUser.email, l.ip, l.ua, l.status, l.reason || null, l.device, l.method, l.location, l.hoursAgo]
      );
    }
    console.log(`✓ Seeded ${logins.length} login history records.`);

    // 7. Seed Sample Personal Security Events
    console.log('Seeding Sample Security Events...');
    const secEvents = [
      { type: 'session_authenticated', severity: 'low', details: { ip: '103.21.244.12', method: 'TOTP Verified' }, daysAgo: 0 },
      { type: 'password_changed', severity: 'medium', details: { reason: 'Periodic security rotation', revoked_sessions: 2 }, daysAgo: 14 },
      { type: 'two_factor_verified', severity: 'low', details: { method: 'authenticator_app' }, daysAgo: 30 }
    ];

    for (const se of secEvents) {
      await query(
        `INSERT INTO security_events (event_type, severity, user_id, details, ip_address, resolved, created_at)
         VALUES ($1, $2, $3, $4, '103.21.244.12', true, NOW() - ($5 || ' days')::INTERVAL)`,
        [se.type, se.severity, adminId, JSON.stringify(se.details), se.daysAgo]
      );
    }
    console.log(`✓ Seeded ${secEvents.length} security events.`);

    console.log('==============================================================================');
    console.log('ALL MODULE 18 PROFILE & ACCOUNT SEED DATA GENERATED SUCCESSFULLY!');
    console.log('==============================================================================');
    process.exit(0);
  } catch (err) {
    console.error('✗ Seeding failed with error:', err);
    process.exit(1);
  }
}

seedAccount();
