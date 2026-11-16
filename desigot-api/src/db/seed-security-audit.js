'use strict';
require('dotenv').config();
const { Pool } = require('pg');
const config = require('../config');

async function seedSecurityAudit() {
  const pool = new Pool({ connectionString: config.db.primary });
  const client = await pool.connect();

  try {
    console.log('Seeding Comprehensive Security & Audit Management System Data...');
    await client.query('BEGIN');

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ENSURE 15 DEVELOPMENT ADMINISTRATORS
    // ─────────────────────────────────────────────────────────────────────────
    const adminProfiles = [
      { email: 'superadmin@desigot.com', first: 'Super', last: 'Admin', role: 'superadmin', title: 'Platform Owner' },
      { email: 'sec.admin1@desigot.com', first: 'Marcus', last: 'Vance', role: 'admin', title: 'Security Administrator' },
      { email: 'sec.admin2@desigot.com', first: 'Elena', last: 'Rostova', role: 'admin', title: 'Security Administrator' },
      { email: 'sys.admin1@desigot.com', first: 'David', last: 'Kim', role: 'admin', title: 'System Administrator' },
      { email: 'sys.admin2@desigot.com', first: 'Sarah', last: 'Connor', role: 'admin', title: 'System Administrator' },
      { email: 'sec.analyst1@desigot.com', first: 'Aiden', last: 'Pearce', role: 'admin', title: 'Security Analyst' },
      { email: 'sec.analyst2@desigot.com', first: 'Clara', last: 'Lille', role: 'admin', title: 'Security Analyst' },
      { email: 'compliance1@desigot.com', first: 'Rachel', last: 'Zane', role: 'admin', title: 'Compliance Officer' },
      { email: 'compliance2@desigot.com', first: 'Harvey', last: 'Specter', role: 'admin', title: 'Compliance Officer' },
      { email: 'support.mgr1@desigot.com', first: 'Donna', last: 'Paulsen', role: 'admin', title: 'Support Manager' },
      { email: 'support.mgr2@desigot.com', first: 'Louis', last: 'Litt', role: 'admin', title: 'Support Manager' },
      { email: 'finance.mgr1@desigot.com', first: 'Jessica', last: 'Pearson', role: 'admin', title: 'Finance Manager' },
      { email: 'finance.mgr2@desigot.com', first: 'Robert', last: 'Zane', role: 'admin', title: 'Finance Manager' },
      { email: 'auditor1@desigot.com', first: 'Katrina', last: 'Bennett', role: 'admin', title: 'Read-Only Auditor' },
      { email: 'auditor2@desigot.com', first: 'Alex', last: 'Williams', role: 'admin', title: 'Read-Only Auditor' },
    ];

    const adminUserIds = [];
    for (const adm of adminProfiles) {
      const res = await client.query(`
        INSERT INTO users (
          email, password_hash, role, first_name, last_name, display_name, account_status
        ) VALUES (
          $1, '$2a$10$wT2eXoYm8qZtT0gB7U7.9eQoI2M9wZ1y2b3c4d5e6f7g8h9i0jklm',
          $2, $3, $4, $5, 'active'
        )
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          account_status = 'active'
        RETURNING id;
      `, [adm.email, adm.role, adm.first, adm.last, `${adm.first} ${adm.last}`]);
      adminUserIds.push(res.rows[0].id);
    }
    console.log(`✓ 15 Development Administrators verified (Root: ${adminUserIds[0]})`);

    // Fetch pool of regular users for diverse security traffic
    const userRows = await client.query(`SELECT id, email, display_name, role FROM users LIMIT 100`);
    const allUsers = userRows.rows;

    const browsers = ['Chrome 122', 'Firefox 123', 'Safari 17.2', 'Edge 122', 'Brave 1.63'];
    const oss = ['Windows 11', 'macOS Sonoma', 'Ubuntu 24.04', 'iOS 17.4', 'Android 14'];
    const devices = ['Desktop', 'Desktop', 'Mobile', 'Laptop', 'Tablet'];
    const ips = [
      '192.0.2.45', '198.51.100.22', '203.0.113.89', '192.0.2.110', '198.51.100.77',
      '203.0.113.14', '192.0.2.205', '198.51.100.99', '203.0.113.180', '192.0.2.18'
    ];
    const locations = ['San Francisco, US', 'New York, US', 'London, UK', 'Berlin, DE', 'Toronto, CA', 'Singapore, SG'];

    // ─────────────────────────────────────────────────────────────────────────
    // 2. SEED 500+ LOGIN HISTORY RECORDS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 500+ Login History events...');
    await client.query(`DELETE FROM login_history WHERE created_at < NOW()`);

    for (let i = 1; i <= 520; i++) {
      const u = allUsers[i % allUsers.length];
      const isSuccess = i % 7 !== 0; // ~85% success rate
      const browser = browsers[i % browsers.length];
      const os = oss[i % oss.length];
      const device = devices[i % devices.length];
      const ip = ips[i % ips.length];
      const loc = locations[i % locations.length];
      const hoursAgo = Math.floor(Math.random() * (120 * 24)); // Spread over 120 days
      const status = isSuccess ? 'success' : 'failed';
      const reason = isSuccess ? null : (i % 3 === 0 ? 'invalid_password' : (i % 5 === 0 ? 'invalid_otp' : 'rate_limited'));
      const method = (u.role === 'admin' || u.role === 'superadmin') && (i % 2 === 0) ? 'totp_mfa' : 'password';

      await client.query(`
        INSERT INTO login_history (
          user_id, email, ip_address, user_agent, status, failure_reason,
          device_type, browser, operating_system, authentication_method, location, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          NOW() - ($12 || ' hours')::INTERVAL
        );
      `, [
        u.id, u.email, ip, `Mozilla/5.0 (${os}) AppleWebKit/537.36 (${browser})`,
        status, reason, device, browser, os, method, loc, hoursAgo
      ]);
    }
    console.log('✓ Seeded 520 realistic login history events');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SEED 20 ACTIVE SESSIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 20 active administrative & user sessions...');
    await client.query(`DELETE FROM admin_sessions WHERE created_at < NOW()`);

    for (let s = 0; s < 20; s++) {
      const u = s < 15 ? allUsers.find(x => x.id === adminUserIds[s]) || allUsers[s] : allUsers[s];
      const isCurrent = s === 0;
      const isRevoked = s >= 16;
      const browser = browsers[s % browsers.length];
      const os = oss[s % oss.length];
      const device = devices[s % devices.length];
      const ip = ips[s % ips.length];
      const loc = locations[s % locations.length];

      await client.query(`
        INSERT INTO admin_sessions (
          user_id, session_token, ip_address, user_agent, device, browser, os,
          location, is_current, is_revoked, last_activity_at, expires_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          NOW() - ($11 || ' minutes')::INTERVAL,
          NOW() + INTERVAL '24 hours',
          NOW() - ($12 || ' hours')::INTERVAL
        );
      `, [
        u.id, `sess_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
        ip, `Mozilla/5.0 (${os}) ${browser}`, device, browser, os, loc,
        isCurrent, isRevoked, s * 15, s * 2
      ]);
    }
    console.log('✓ Seeded 20 active, current, and revoked sessions');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SEED 150+ FAILED LOGIN ATTEMPTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 150+ Failed Login Attempts...');
    await client.query(`DELETE FROM security_failed_attempts WHERE created_at < NOW()`);

    const failureCategories = [
      'Invalid Credentials', 'Invalid Credentials', 'Invalid OTP',
      'Expired OTP', 'Suspicious Login', 'Rate Limit Triggered',
      'Unknown Account', 'Account Temporarily Locked'
    ];
    const riskLevels = ['low', 'medium', 'medium', 'high', 'critical'];

    for (let f = 1; f <= 160; f++) {
      const u = allUsers[f % allUsers.length];
      const cat = failureCategories[f % failureCategories.length];
      const risk = riskLevels[f % riskLevels.length];
      const browser = browsers[f % browsers.length];
      const os = oss[f % oss.length];
      const ip = ips[f % ips.length];
      const hoursAgo = Math.floor(Math.random() * (60 * 24)); // Last 60 days
      const attempts = cat === 'Rate Limit Triggered' ? 6 : (cat === 'Account Temporarily Locked' ? 5 : (1 + (f % 3)));

      await client.query(`
        INSERT INTO security_failed_attempts (
          account_identifier, user_id, ip_address, failure_category,
          attempt_count, risk_level, device_info, browser, operating_system, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          NOW() - ($10 || ' hours')::INTERVAL
        );
      `, [
        u.email, u.id, ip, cat, attempts, risk, `${os} - ${browser}`, browser, os, hoursAgo
      ]);
    }
    console.log('✓ Seeded 160 structured failed login attempts');

    // ─────────────────────────────────────────────────────────────────────────
    // 5. SEED 100+ SECURITY EVENTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 100+ Security Events...');
    await client.query(`DELETE FROM security_events WHERE created_at < NOW()`);

    const eventTypes = [
      { type: 'Suspicious Login', sev: 'medium', desc: 'Unusual IP address location detected for privileged user' },
      { type: 'Multiple Failed Logins', sev: 'high', desc: 'Exceeded 5 failed login threshold within 2 minutes' },
      { type: 'New Device Login', sev: 'low', desc: 'First time sign-in from unverified macOS Safari client' },
      { type: 'Account Lockout', sev: 'high', desc: 'Automatic 30-minute lockout enforced on account' },
      { type: 'Password Changed', sev: 'informational', desc: 'Account credentials rotated via verified session' },
      { type: 'Two-Factor Authentication Enabled', sev: 'informational', desc: 'TOTP authenticator app successfully enrolled' },
      { type: 'Session Revoked', sev: 'medium', desc: 'Session forcibly terminated by Security Administrator' },
      { type: 'Refresh Token Reuse', sev: 'critical', desc: 'Revoked refresh token presented; invalidating token family' },
      { type: 'Unauthorized API Access', sev: 'high', desc: '403 Forbidden on privileged route /api/v1/admin/security' },
      { type: 'IP Restriction Violation', sev: 'critical', desc: 'Blocked IP 198.51.100.77 attempted admin endpoint access' },
      { type: 'Admin Role Changed', sev: 'medium', desc: 'Role elevated to Security Analyst by Super Admin' },
      { type: 'Suspicious API Traffic', sev: 'high', desc: 'High frequency requests (>120 req/min) detected from client IP' }
    ];

    const invStatuses = ['unassigned', 'assigned', 'investigating', 'resolved', 'escalated'];

    for (let e = 1; e <= 110; e++) {
      const template = eventTypes[e % eventTypes.length];
      const u = allUsers[e % allUsers.length];
      const ip = ips[e % ips.length];
      const invStatus = invStatuses[e % invStatuses.length];
      const hoursAgo = Math.floor(Math.random() * (90 * 24));
      const isResolved = invStatus === 'resolved';

      await client.query(`
        INSERT INTO security_events (
          event_type, severity, user_id, ip_address, details,
          resolved, investigation_status, assigned_to, internal_notes,
          created_at, resolved_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          NOW() - ($10 || ' hours')::INTERVAL,
          CASE WHEN $6 = TRUE THEN NOW() - ($10 || ' hours')::INTERVAL + INTERVAL '45 minutes' ELSE NULL END
        );
      `, [
        template.type, template.sev, u.id, ip,
        JSON.stringify({ description: template.desc, target_user: u.email, flagged_ip: ip }),
        isResolved, invStatus, isResolved ? adminUserIds[1] : null,
        isResolved ? 'Resolved after verifying MFA challenge log.' : null,
        hoursAgo
      ]);
    }
    console.log('✓ Seeded 110 granular security events');

    // ─────────────────────────────────────────────────────────────────────────
    // 6. SEED 500+ AUDIT LOGS WITH HASH INTEGRITY CHAIN
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 500+ Audit Logs with Cryptographic Hash Chain...');
    await client.query(`DELETE FROM audit_logs WHERE created_at < NOW()`);

    const auditModules = ['auth', 'rbac', 'admin', 'services', 'products', 'orders', 'finance', 'cms', 'security'];
    const auditActions = [
      'admin.role_assigned', 'security.ip_rule_added', 'auth.mfa_enforced',
      'service.approved', 'product.published', 'finance.payout_approved',
      'user.suspended', 'security.policy_updated', 'role.permission_added'
    ];

    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    for (let a = 1; a <= 520; a++) {
      const actorId = adminUserIds[a % adminUserIds.length];
      const actorName = adminProfiles[a % adminProfiles.length].first + ' ' + adminProfiles[a % adminProfiles.length].last;
      const mod = auditModules[a % auditModules.length];
      const action = auditActions[a % auditActions.length];
      const targetUser = allUsers[a % allUsers.length];
      const hoursAgo = Math.floor(Math.random() * (120 * 24));
      const ip = ips[a % ips.length];
      const currentHash = require('crypto').createHash('sha256')
        .update(`${previousHash}|${action}|${actorId}|${a}|${hoursAgo}`)
        .digest('hex');

      await client.query(`
        INSERT INTO audit_logs (
          actor_id, actor_type, action, entity_type, entity_id,
          module, severity, change_summary, ip_address, user_agent,
          old_values, new_values, integrity_hash, previous_hash, created_at
        ) VALUES (
          $1, 'admin', $2, 'user', $3,
          $4, 'info', $5, $6::inet, 'Mozilla/5.0 Administrative Console',
          $7, $8, $9, $10,
          NOW() - ($11 || ' hours')::INTERVAL
        );
      `, [
        actorId, action, targetUser.id, mod,
        `Administrative operation '${action}' executed by ${actorName}`,
        ip,
        JSON.stringify({ status: 'previous_state' }),
        JSON.stringify({ status: 'updated_state', action, actor: actorName }),
        currentHash, previousHash, hoursAgo
      ]);
      previousHash = currentHash;
    }
    console.log('✓ Seeded 520 tamper-evident audit logs with chained SHA-256 integrity hashes');

    // ─────────────────────────────────────────────────────────────────────────
    // 7. SEED 150 ADMINISTRATIVE ACTIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 150 privileged administrative actions...');
    await client.query(`DELETE FROM administrative_actions WHERE created_at < NOW()`);

    const adminOpTypes = [
      'Role Assigned', 'Permission Added', 'Session Revoked',
      'IP Blocklist Created', 'Security Setting Updated', 'Account Lockout Released',
      'Admin User Created', 'Module Access Modified', 'Password Reset Enforced'
    ];

    for (let m = 1; m <= 150; m++) {
      const actorId = adminUserIds[m % adminUserIds.length];
      const profile = adminProfiles[m % adminProfiles.length];
      const targetUser = allUsers[m % allUsers.length];
      const op = adminOpTypes[m % adminOpTypes.length];
      const hoursAgo = Math.floor(Math.random() * (90 * 24));

      await client.query(`
        INSERT INTO administrative_actions (
          actor_id, actor_name, actor_role, action_type, target_user_id,
          target_resource, module, before_value, after_value, ip_address, result, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, 'security', $7, $8, $9, 'success',
          NOW() - ($10 || ' hours')::INTERVAL
        );
      `, [
        actorId, `${profile.first} ${profile.last}`, profile.title, op, targetUser.id,
        `user:${targetUser.id}`,
        JSON.stringify({ active: false, role: 'standard' }),
        JSON.stringify({ active: true, role: 'elevated', modified_by: profile.email }),
        ips[m % ips.length], hoursAgo
      ]);
    }
    console.log('✓ Seeded 150 administrative actions linked to real administrators');

    // ─────────────────────────────────────────────────────────────────────────
    // 8. SEED 1,000+ API ACCESS LOGS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 1,000+ API Access Logs...');
    await client.query(`DELETE FROM api_access_logs WHERE created_at < NOW()`);

    const endpoints = [
      { method: 'GET', path: '/api/v1/listings', status: 200, dur: 45 },
      { method: 'GET', path: '/api/v1/services', status: 200, dur: 38 },
      { method: 'POST', path: '/api/v1/auth/login', status: 200, dur: 120 },
      { method: 'POST', path: '/api/v1/auth/login', status: 401, dur: 95 },
      { method: 'GET', path: '/api/v1/admin/security/overview', status: 200, dur: 110 },
      { method: 'GET', path: '/api/v1/admin/security/audit-logs', status: 200, dur: 85 },
      { method: 'POST', path: '/api/v1/orders', status: 201, dur: 160 },
      { method: 'PATCH', path: '/api/v1/admin/security/ip-rules/1', status: 200, dur: 62 },
      { method: 'GET', path: '/api/v1/admin/super-admin/control-center', status: 403, dur: 25 },
      { method: 'GET', path: '/api/v1/search', status: 200, dur: 40 },
      { method: 'POST', path: '/api/v1/auth/register', status: 429, dur: 15 },
      { method: 'GET', path: '/api/v1/unknown-route', status: 404, dur: 12 }
    ];

    for (let api = 1; api <= 1020; api++) {
      const ep = endpoints[api % endpoints.length];
      const u = (api % 3 === 0) ? allUsers[api % allUsers.length] : null;
      const hoursAgo = Math.floor(Math.random() * (60 * 24)); // Last 60 days
      const ip = ips[api % ips.length];
      const isRateLimited = ep.status === 429;

      const reqSize = 256 + (api % 512);
      const resSize = 1024 + (api % 2048);
      const duration = ep.dur + (api % 25);

      await client.query(`
        INSERT INTO api_access_logs (
          method, endpoint, user_id, client_app, ip_address, user_agent,
          status_code, duration_ms, request_size, response_size, rate_limit_hit, created_at
        ) VALUES (
          $1, $2, $3, 'desigot-web-client', $4,
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          $5, $6, $7, $8, $9,
          NOW() - ($10 || ' hours')::INTERVAL
        );
      `, [
        ep.method, ep.path, u ? u.id : null, ip,
        ep.status, duration, reqSize, resSize, isRateLimited, hoursAgo
      ]);
    }
    console.log('✓ Seeded 1,020 realistic API access telemetry records');

    // ─────────────────────────────────────────────────────────────────────────
    // 9. SEED IP RESTRICTIONS (5 Allow, 10 Deny, 5 Expired)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding IP Access Restrictions (Allowlist & Blocklist)...');
    await client.query(`DELETE FROM ip_restrictions WHERE created_at < NOW()`);

    const allowRules = [
      { ip: '192.0.2.10', cidr: '192.0.2.0/24', reason: 'Primary Corporate Headquarters VPN', scope: 'admin_login' },
      { ip: '198.51.100.5', cidr: '198.51.100.0/24', reason: 'Engineering & DevOps Jump Host', scope: 'api_access' },
      { ip: '203.0.113.12', cidr: null, reason: 'Dedicated Lead Security Architect IP', scope: 'all' },
      { ip: '192.0.2.22', cidr: null, reason: 'Compliance Audit Partner Office', scope: 'admin_login' },
      { ip: '198.51.100.33', cidr: null, reason: 'Staging Infrastructure Test Agent', scope: 'all' }
    ];

    for (const r of allowRules) {
      await client.query(`
        INSERT INTO ip_restrictions (
          ip_pattern, cidr_range, restriction_type, scope, reason,
          is_active, created_by, created_at
        ) VALUES (
          $1, $2, 'allow', $3, $4, TRUE, $5, NOW() - INTERVAL '30 days'
        );
      `, [r.ip, r.cidr, r.scope, r.reason, adminUserIds[0]]);
    }

    const denyRules = [
      { ip: '198.51.100.77', cidr: null, reason: 'Automated Credential Stuffing Origin', scope: 'all' },
      { ip: '203.0.113.88', cidr: '203.0.113.80/28', reason: 'Malicious Botnet Subnet Range', scope: 'all' },
      { ip: '192.0.2.99', cidr: null, reason: 'Repeated API Rate Limit Bypass Attempts', scope: 'api_access' },
      { ip: '198.51.100.101', cidr: null, reason: 'Distributed Scraping & Content Mirroring', scope: 'all' },
      { ip: '203.0.113.144', cidr: null, reason: 'Flagged Proxy Exit Node with High Risk', scope: 'admin_login' },
      { ip: '192.0.2.155', cidr: null, reason: 'SQL Injection Probing on Listing Endpoints', scope: 'all' },
      { ip: '198.51.100.166', cidr: null, reason: 'Brute Force Dictionary Attack Target', scope: 'admin_login' },
      { ip: '203.0.113.177', cidr: null, reason: 'Stolen Token Presentation Source', scope: 'all' },
      { ip: '192.0.2.188', cidr: null, reason: 'Known Spammer IP Address', scope: 'all' },
      { ip: '198.51.100.199', cidr: null, reason: 'Repeated Invalid Payment Card Invocations', scope: 'all' }
    ];

    for (const r of denyRules) {
      await client.query(`
        INSERT INTO ip_restrictions (
          ip_pattern, cidr_range, restriction_type, scope, reason,
          is_active, created_by, created_at
        ) VALUES (
          $1, $2, 'deny', $3, $4, TRUE, $5, NOW() - INTERVAL '15 days'
        );
      `, [r.ip, r.cidr, r.scope, r.reason, adminUserIds[1]]);
    }

    // 5 Expired Rules
    for (let ex = 1; ex <= 5; ex++) {
      await client.query(`
        INSERT INTO ip_restrictions (
          ip_pattern, restriction_type, scope, reason,
          is_active, expires_at, created_by, created_at
        ) VALUES (
          $1, 'deny', 'admin_login', 'Temporary 24h Security Hold (Expired)',
          FALSE, NOW() - INTERVAL '5 days', $2, NOW() - INTERVAL '6 days'
        );
      `, [`192.0.2.${220 + ex}`, adminUserIds[1]]);
    }
    console.log('✓ Seeded 20 structured IP access rules (5 Allow, 10 Deny, 5 Expired)');

    // ─────────────────────────────────────────────────────────────────────────
    // 10. SEED AUTHENTICATION & SECURITY SETTINGS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding enterprise authentication settings...');
    const settings = [
      { key: 'session_timeout_minutes', val: 60, cat: 'session', desc: 'Inactivity duration before administrative session auto-invalidates' },
      { key: 'max_concurrent_sessions', val: 3, cat: 'session', desc: 'Maximum simultaneous active sessions per admin user' },
      { key: 'require_mfa_for_admins', val: true, cat: 'mfa', desc: 'Mandatory TOTP two-factor enrollment for all administrative roles' },
      { key: 'login_max_attempts', val: 5, cat: 'auth', desc: 'Threshold of consecutive failed attempts triggering temporary account lockout' },
      { key: 'lockout_duration_minutes', val: 30, cat: 'auth', desc: 'Duration of automatic progressive account lockout' },
      { key: 'password_min_length', val: 12, cat: 'password', desc: 'Enforced minimum character length for admin passwords' },
      { key: 'password_require_breach_check', val: true, cat: 'password', desc: 'Screen passwords against HaveIBeenPwned breached database' },
      { key: 'password_reset_expiry_minutes', val: 15, cat: 'password', desc: 'Single-use cryptographic reset token lifespan' },
      { key: 'new_device_verification_enabled', val: true, cat: 'auth', desc: 'Email verification challenge required upon sign-in from unknown device' },
      { key: 'api_rate_limit_per_minute', val: 120, cat: 'api', desc: 'Global API throughput limit per authenticated client' }
    ];

    for (const s of settings) {
      await client.query(`
        INSERT INTO security_settings (
          setting_key, setting_value, category, description, updated_by, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW()
        )
        ON CONFLICT (setting_key) DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          updated_at = NOW();
      `, [s.key, JSON.stringify(s.val), s.cat, s.desc, adminUserIds[0]]);
    }
    console.log('✓ Seeded 10 enterprise authentication and security policy settings');

    // ─────────────────────────────────────────────────────────────────────────
    // 11. SEED 10 ACCOUNT LOCKOUTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 10 development account lockouts...');
    await client.query(`DELETE FROM account_lockouts WHERE locked_at < NOW()`);

    for (let l = 0; l < 10; l++) {
      const u = allUsers[l + 10];
      const isUnlocked = l >= 7;
      const failedAttempts = 5 + (l % 3);

      await client.query(`
        INSERT INTO account_lockouts (
          user_id, email, lockout_reason, failed_attempt_count,
          locked_at, expires_at, is_unlocked, unlocked_by, unlocked_at
        ) VALUES (
          $1, $2, 'Exceeded 5 consecutive failed authentication attempts',
          $3, NOW() - ($4 || ' hours')::INTERVAL,
          NOW() + INTERVAL '30 minutes',
          $5, CASE WHEN $5 = TRUE THEN $6::uuid ELSE NULL END,
          CASE WHEN $5 = TRUE THEN NOW() - INTERVAL '1 hour' ELSE NULL END
        );
      `, [u.id, u.email, failedAttempts, l * 4, isUnlocked, isUnlocked ? adminUserIds[1] : null]);
    }
    console.log('✓ Seeded 10 account lockout records (7 active, 3 resolved)');

    // ─────────────────────────────────────────────────────────────────────────
    // 12. SEED 30 SECURITY ALERTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 30 Security Alerts...');
    await client.query(`DELETE FROM security_alerts WHERE created_at < NOW()`);

    const alertTemplates = [
      { type: 'Critical Privilege Escalation Attempt', sev: 'critical', title: 'Unauthorized Role Elevation', desc: 'Attempted injection of superadmin role attribute' },
      { type: 'Repeated Failed Logins', sev: 'high', title: 'Brute Force Attack Detected', desc: '10 failed attempts from IP 198.51.100.77 within 60s' },
      { type: 'Suspicious Admin Login', sev: 'medium', title: 'Anomalous Geolocation Sign-In', desc: 'Admin account accessed from unrecognized foreign ISP' },
      { type: 'New Admin Device', sev: 'low', title: 'New Hardware Device Registered', desc: 'macOS Safari enrolled for System Administrator' },
      { type: 'Refresh Token Reuse', sev: 'critical', title: 'Revoked Token Presented', desc: 'Token family replay attack detected; immediate session cutoff' },
      { type: 'IP Restriction Violation', sev: 'high', title: 'Access Attempt from Blocklisted IP', desc: 'Denied access attempt on administrative endpoint' }
    ];

    const alertStatuses = ['open', 'open', 'acknowledged', 'investigating', 'resolved'];

    for (let al = 0; al < 30; al++) {
      const tmpl = alertTemplates[al % alertTemplates.length];
      const u = allUsers[al % allUsers.length];
      const st = alertStatuses[al % alertStatuses.length];
      const isResolved = st === 'resolved';
      const isAck = st === 'acknowledged' || st === 'investigating' || isResolved;
      const createdAt = new Date(Date.now() - al * 6 * 3600 * 1000);

      await client.query(`
        INSERT INTO security_alerts (
          alert_type, severity, title, description, user_id, ip_address,
          status, assigned_to, acknowledged_at, resolved_at, internal_notes, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          CASE WHEN $9 = TRUE THEN NOW() - INTERVAL '2 hours' ELSE NULL END,
          CASE WHEN $10 = TRUE THEN NOW() - INTERVAL '30 minutes' ELSE NULL END,
          $11, $12
        );
      `, [
        tmpl.type, tmpl.sev, tmpl.title, tmpl.desc, u.id, ips[al % ips.length],
        st, adminUserIds[al % 3], isAck, isResolved,
        isResolved ? 'Verified with user via secondary channel; alert cleared.' : 'Triage underway.',
        createdAt
      ]);
    }
    console.log('✓ Seeded 30 actionable security alerts across all severities');

    // ─────────────────────────────────────────────────────────────────────────
    // 13. SEED 10 SECURITY INVESTIGATIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 10 formal security investigations...');
    await client.query(`DELETE FROM security_investigation_events WHERE created_at < NOW()`);
    await client.query(`DELETE FROM security_investigations WHERE created_at < NOW()`);

    const invTitles = [
      'Investigate Credential Stuffing Campaign on Seller Accounts',
      'Audit Privileged Access on Production Payout Gateways',
      'Suspicious Concurrent Sessions Detected from Tor Relays',
      'Review Automated Botnet Traffic on Public Search API',
      'Employee Offboarding Security & Session Revocation Audit',
      'DDoS Mitigation & Rate Limiting Threshold Calibration',
      'Verification of New Admin Device Authorization Flow',
      'Incident Post-Mortem on Refresh Token Replay Spike',
      'Compliance Data Access Audit for Customer PII',
      'Quarterly Firewall & IP Allowlist Rule Recertification'
    ];

    const invSevs = ['critical', 'high', 'high', 'medium', 'medium', 'medium', 'low', 'critical', 'high', 'low'];
    const invStats = ['open', 'assigned', 'investigating', 'investigating', 'resolved', 'closed', 'resolved', 'investigating', 'open', 'closed'];

    for (let inv = 0; inv < 10; inv++) {
      const title = invTitles[inv];
      const sev = invSevs[inv];
      const st = invStats[inv];
      const isClosed = st === 'closed' || st === 'resolved';
      const createdAt = new Date(Date.now() - inv * 24 * 3600 * 1000);

      const invRes = await client.query(`
        INSERT INTO security_investigations (
          title, description, severity, status, assigned_to, created_by,
          findings, resolution_notes, created_at, resolved_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9,
          CASE WHEN $10 = TRUE THEN NOW() - INTERVAL '2 hours' ELSE NULL END
        )
        RETURNING id;
      `, [
        title,
        `Comprehensive forensic investigation dossier into incident patterns and telemetry.`,
        sev, st, adminUserIds[inv % 4], adminUserIds[0],
        isClosed ? 'Forensic log inspection confirmed automated probe with zero credential compromise.' : 'Correlating IP logs and gateway telemetry.',
        isClosed ? 'Blocked offending subnet and confirmed session integrity.' : null,
        createdAt,
        isClosed
      ]);

      // Link 2 sample events to each investigation
      const invId = invRes.rows[0].id;
      await client.query(`
        INSERT INTO security_investigation_events (investigation_id, event_type, event_id, notes)
        VALUES ($1, 'security_event', gen_random_uuid(), 'Initial telemetry trigger event');
      `, [invId]);
    }
    console.log('✓ Seeded 10 formal security investigations with linked forensic events');

    // ─────────────────────────────────────────────────────────────────────────
    // 14. SEED 200 DATA ACCESS LOGS (Sensitive Resource Tracking)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 200 sensitive data access audit records...');
    await client.query(`DELETE FROM data_access_logs WHERE created_at < NOW()`);

    const resTypes = ['Customer PII', 'Seller Financials', 'Order Escrow', 'Payout Account', 'Tax Documentation'];
    const accessTypes = ['read', 'read', 'export', 'read', 'view_sensitive'];

    for (let d = 1; d <= 200; d++) {
      const actorId = adminUserIds[d % adminUserIds.length];
      const profile = adminProfiles[d % adminProfiles.length];
      const rt = resTypes[d % resTypes.length];
      const at = accessTypes[d % accessTypes.length];
      const hoursAgo = Math.floor(Math.random() * (90 * 24));

      await client.query(`
        INSERT INTO data_access_logs (
          actor_id, actor_role, resource_type, resource_id,
          access_type, ip_address, result, created_at
        ) VALUES (
          $1, $2, $3, gen_random_uuid(),
          $4, $5, 'success',
          NOW() - ($6 || ' hours')::INTERVAL
        );
      `, [
        actorId, profile.title, rt, at, ips[d % ips.length], hoursAgo
      ]);
    }
    console.log('✓ Seeded 200 structured sensitive data access logs');

    // ─────────────────────────────────────────────────────────────────────────
    // 15. SEED 30 TRUSTED DEVICES
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 30 registered user and administrator devices...');
    await client.query(`DELETE FROM trusted_devices WHERE first_seen_at < NOW()`);

    for (let dev = 0; dev < 30; dev++) {
      const u = allUsers[dev % allUsers.length];
      const isTrusted = dev % 7 !== 0; // Most devices trusted
      const lastSeen = new Date(Date.now() - dev * 4 * 3600 * 1000);

      await client.query(`
        INSERT INTO trusted_devices (
          user_id, device_id, device_type, browser, operating_system,
          ip_address, is_trusted, first_seen_at, last_seen_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          NOW() - INTERVAL '60 days', $8
        );
      `, [
        u.id, `dev_${Math.random().toString(36).substring(2)}${dev}`,
        devices[dev % devices.length], browsers[dev % browsers.length],
        oss[dev % oss.length], ips[dev % ips.length], isTrusted, lastSeen
      ]);
    }
    console.log('✓ Seeded 30 hardware and browser device profiles');

    // ─────────────────────────────────────────────────────────────────────────
    // 16. SEED 10 COMPLIANCE EXPORTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 10 Security & Compliance Export Records...');
    await client.query(`DELETE FROM security_compliance_exports WHERE created_at < NOW()`);

    const complianceReports = [
      { type: 'SOC2 Annual Authentication Activity Audit', fmt: 'csv', records: 1250 },
      { type: 'Privileged Administrative Access & Role Grants', fmt: 'pdf', records: 180 },
      { type: 'Failed Login & Account Lockout Summary', fmt: 'xlsx', records: 420 },
      { type: 'Quarterly Sensitive Data Access Logs', fmt: 'csv', records: 650 },
      { type: 'Firewall & IP Restriction Rule Recertification', fmt: 'csv', records: 25 },
      { type: 'MFA Adoption & Enforcement Compliance Report', fmt: 'pdf', records: 15 },
      { type: 'API Security & Rate Limiting Incident Summary', fmt: 'csv', records: 890 },
      { type: 'Security Events Severity Distribution Report', fmt: 'xlsx', records: 310 },
      { type: 'GDPR / CCPA Access Audit Trails', fmt: 'pdf', records: 450 },
      { type: 'Full Cryptographic Audit Hash Verification', fmt: 'csv', records: 520 }
    ];

    for (let cr = 0; cr < complianceReports.length; cr++) {
      const rep = complianceReports[cr];
      const createdAt = new Date(Date.now() - cr * 12 * 3600 * 1000);

      await client.query(`
        INSERT INTO security_compliance_exports (
          report_type, format, requested_by, record_count, file_path, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'completed', $6
        );
      `, [
        rep.type, rep.fmt, adminUserIds[0], rep.records,
        `compliance/${rep.type.replace(/[^a-zA-Z0-9_-]/g, '_')}.${rep.fmt}`,
        createdAt
      ]);
    }
    console.log('✓ Seeded 10 formal compliance audit exports');

    await client.query('COMMIT');
    console.log('\n======================================================');
    console.log('✓ MODULE 15: SECURITY & AUDIT SEED COMPLETED PERFECTLY!');
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Security & Audit seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSecurityAudit();
