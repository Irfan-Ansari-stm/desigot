# DESIGOT Enterprise Role-Based Access Control (RBAC) Administration Platform

An enterprise-grade, production-ready, full-stack Role-Based Access Control (RBAC) Management System engineered for mission-critical multi-tenant governance. Built with Next.js (App Router, Tailwind CSS, Lucide icons), Express.js backend microservice architecture, and a persistent PostgreSQL database engine with immutable audit trails.

---

## 1. System Architecture & Hierarchy

The system establishes a 5-tier role hierarchy with strict privilege boundaries:

```
Level 1: Super Admin (Application Owner)  <-- Unrestricted access, immutable system rule, non-demotable
Level 2: Admin (Platform Administrator)   <-- Tenant administration, user & policy control
Level 3: Manager                          <-- Team supervision, reports, module oversight
Level 4: Custom Roles (e.g. Security)     <-- Custom dynamic roles tailored to granular scopes
Level 5: Standard Users                   <-- End users with baseline self-service permissions
```

### Protected Super Admin Guarantees:
- **Application Owner Status:** Super Admin privileges are enforced as a **hard-coded system-level authorization rule** in middleware and database layers (`is_super_admin = true`), bypassing normal permission table lookups.
- **Immunity from Lockout:** Cannot be locked out or demoted by ordinary administrators or altered role permissions.
- **Privilege Escalation Prevention:** Ordinary administrators receive HTTP 403 Forbidden when attempting to grant `is_super_admin`, modify a Super Admin profile, or alter protected roles.
- **Last Active Super Admin Protection:** System-level validation guarantees there is always at least one active Super Admin account; deleting or suspending the last active Super Admin is rejected with HTTP 403.
- **Super Admin Exclusive Sections:** Control Center, global recovery tools, maintenance mode switches, and configuration override mechanisms are strictly inaccessible to all non-owner roles.

---

## 2. Seeded Personas & Credentials

All default seeded accounts are protected with password `Password123!`:

| Role | Email | Super Admin? | Hierarchy Level | Key Permissions / Scopes |
| :--- | :--- | :---: | :---: | :--- |
| **Super Admin** | `superadmin@desigot.com` | **Yes** | Level 1 | All permissions (`*`), Control Center, Owner Overrides |
| **Platform Admin** | `admin@desigot.com` | No | Level 2 | User management, roles, policies, audit viewing, API keys |
| **Manager** | `manager@desigot.com` | No | Level 3 | Department teams, reports read/export, module access |
| **Security Officer** | `security@desigot.com` | No | Level 4 | Active sessions revoke, login history audit, IP rules |
| **Standard User** | `user@desigot.com` | No | Level 5 | Profile self-service, password change, view directory |

> **Live Persona Switcher:** The top navigation bar in the admin dashboard contains an instant **Persona Switcher** dropdown. You can switch between Super Admin, Admin, Manager, and Standard User in one click to verify real-time permission enforcement across UI and APIs.

---

## 3. Database Schema & Persistence

The RBAC database schema is deployed on PostgreSQL 18+ and comprises 21 interconnected relational tables:

1. `users` – Enhanced with `is_super_admin`, `department_id`, `designation_id`, `suspension_reason`, and `last_login_at`.
2. `roles` – Hierarchical roles with `is_system`, `hierarchy_level`, `status`, and category.
3. `permissions` – Granular permissions (`module.action`) categorized by scope.
4. `role_permissions` – Atomic mapping of roles to permissions with creation audits.
5. `user_roles` – Multi-role assignment per user.
6. `modules` – Application modules and resources with activation flags.
7. `permission_groups` – Logical grouping of permissions for administrative management.
8. `departments`, `teams`, `designations` – Organizational structure management.
9. `user_invitations` – Onboarding invitations with cryptographic tokens and expiration.
10. `access_policies` – Attribute-Based Access Control (ABAC) rules and JSON conditions.
11. `login_history` – Comprehensive login audits with IP, user agent, and failure reasons.
12. `active_sessions` – Live user sessions with immediate force-revocation capability.
13. `audit_logs` – **Immutable audit records** protected by PostgreSQL rules (`audit_logs_no_update`, `audit_logs_no_delete`).
14. `system_settings` – Dynamic key-value configuration and feature flags.
15. `api_keys` – SHA-256 hashed keys with per-key rate limiting and scope validation.
16. `email_templates` – HTML/plain text transactional templates with Handlebars placeholders.
17. `user_mfa_settings`, `password_reset_tokens`, `security_events`, `ip_restrictions` – Hardened security configuration.

---

## 4. Complete 14-Section Admin Sidebar

The administrative dashboard provides a collapsible, permission-aware sidebar organizing all functional areas:

1. **Dashboard:** Overview metrics, Analytics, System Health, and Activity Feeds.
2. **User Management:** Users roster, Create User modal, Suspended Users filter, Bulk Deletion, Password Resets.
3. **Role Management:** Role CRUD, Hierarchy visualizer, Duplicate Role engine, Permission Assignment.
4. **Permission Management:** Granular permissions list, Create Permission, Module classification.
5. **Permission Matrix:** Interactive visual matrix (Modules × Actions) with batch atomic DB persistence.
6. **Access Control:** Access Policies editor, Module restrictions, and ABAC rule engine.
7. **Organization Management:** Departments, Teams, and Designations manager.
8. **Security Management:** Login History, Active Sessions with force-revoke, IP Whitelist/Blacklist.
9. **Audit & Activity Logs:** Immutable audit trail with old/new value JSON diff inspection.
10. **API Management:** API Keys generator with secret disclosure, scopes, and revocation.
11. **Notifications:** System-wide broadcast dispatcher, Email Templates editor, SMTP config.
12. **Reports:** Compliance reports, user rosters, permission summaries, and JSON exports.
13. **System Configuration:** General parameters, Feature Flags toggles, Database metadata.
14. **Super Admin Only:** Super Admin Control Center, Administrator Governance, System Maintenance Mode toggle, and Disaster Recovery triggers.

---

## 5. Visual Permission Matrix

Located at `/dashboard/permissions/matrix`:
- **Module Rows × Action Columns:** Visualizes permissions across `users`, `roles`, `permissions`, `audit`, `settings`, `reports`, `api`, `organization`, and `security`.
- **Granular Actions:** `CREATE`, `READ`, `UPDATE`, `DELETE`, `VIEW`, `EXPORT`, `IMPORT`, `APPROVE`, `REJECT`, `ASSIGN`, `MANAGE`, `CONFIGURE`.
- **Batch Atomic Persistence:** Select all, clear all, toggle module-wide permissions, review unsaved changes indicator, and persist changes atomically via `/api/v1/rbac/roles/:id/permissions/batch`.
- **Real-Time Effect:** Permission modifications update the user's active token privileges immediately upon reload or next session refresh.

---

## 6. Automated Test Suite (32 Scenarios)

The test suite thoroughly validates every security constraint, API endpoint, and authorization safeguard.

### Running the Test Suite:
```bash
cd desigot-api
npm run test:rbac
```

### Test Coverage Highlights:
- **Authentication & Wildcards:** Super Admin receives wildcard permissions; standard users receive scoped access.
- **Control Center Access:** Super Admin receives HTTP 200; platform admins and users receive HTTP 403.
- **Privilege Escalation Prevention:** Non-super-admins cannot elevate themselves or edit Super Admin accounts.
- **Last Active Super Admin Defense:** Deletion or suspension of the last Super Admin is rejected with HTTP 403.
- **Role & Permission CRUD:** Full lifecycle verification for roles and permissions.
- **Interactive Matrix Updates:** Atomic assignment and revocation verified against database state.
- **Audit Immutability:** Audit log creation verified; update/delete operations prevented by DB rules.
- **Account Suspension Enforcement:** Suspended user accounts are immediately blocked from logging in.

```
========================================
RESULTS: 32 Passed, 0 Failed (RBAC Suite)
RESULTS: 59 Passed, 0 Failed (Dashboard Suite)
TOTAL:   91 Passed, 0 Failed
========================================
```

---

## 7. Starting the Application

### 1. Database Setup & Seeding:
Ensure PostgreSQL is running locally on port 5432 with database `desigot`.
```bash
cd desigot-api
npm run db:migrate:rbac
npm run db:seed:rbac
npm run db:migrate:dashboard
npm run db:seed:marketplace
```

### 2. Run Test Suites:
```bash
cd desigot-api
npm run test:rbac
npm run test:dashboard
```

### 3. Start Backend API Server:
```bash
cd desigot-api
npm start
# API listens on http://localhost:4000/api/v1
```

### 4. Start Frontend Dashboard:
```bash
cd desigot-frontend
npm run dev
# Dashboard available at http://localhost:3000/dashboard (and /admin redirects to /dashboard)
```

Sign in with `superadmin@desigot.com` / `Password123!` to experience the complete administrative system.

---

## 8. Complete Dashboard & Analytics Architecture (9 Functional Sections)

1. **Overview (`/dashboard`):** Real-time administrative summary, 12 dynamic KPI cards (GMV, commissions, orders, customers, sellers, published items), interactive revenue area chart with interval toggles, pending actions queue, live recent orders table with customer and seller relationships, top services and top sellers leaderboards.
2. **Revenue Analytics (`/dashboard/revenue`):** Financial visibility, canonical ledger reconciliation, gross order value, discounts, refunds, payment processing fees (Stripe), seller payable balances, net platform margins, and revenue breakdown by category and payment method.
3. **Marketplace Analytics (`/dashboard/marketplace`):** Catalog metrics, listings inventory, AOV, conversion rate, dispute and refund rates, category performance table, seller and buyer growth curves, and search intent keyword analytics.
4. **Sales Analytics (`/dashboard/sales`):** Business model separation (Digital Downloadable Assets vs Professional Custom Services), 5-step conversion funnel, and filterable paginated orders table.
5. **Service Analytics (`/dashboard/services`):** Custom design offerings performance, review ratings, delivery times, status distribution, and top performing services.
6. **Seller Analytics (`/dashboard/sellers`):** Seller verification cohorts, onboarding trends, seller segmentation (Top Performers, High-Revenue, Active, Onboarding), and top seller leaderboard with balances and ratings.
7. **Customer Analytics (`/dashboard/customers`):** Buyer cohort retention, acquisition trends, lifetime value (LTV), average order value (AOV), and customer spending tiers.
8. **Recent Activities (`/dashboard/recent-activities`):** Centralized immutable activity feed combining events from all marketplace modules (auth, orders, payments, refunds, payouts, listings, RBAC, system) with search, module filtering, live auto-refresh polling, and full JSON metadata inspection.
9. **System Health (`/dashboard/system-health`):** Host telemetry (uptime, CPU cores, memory utilization), PostgreSQL connection pool latency and size, live third-party integration probes (Stripe, SendGrid, Redis, AWS S3/Cloudflare CDN), system health alerts history, and background job worker queues.
