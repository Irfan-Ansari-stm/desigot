'use strict';

const pool = require('./pool');
const crypto = require('crypto');

// Helpers
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

async function seedReviews() {
  console.log('🌱 Starting Comprehensive Reviews & Moderation Seeding...');
  const client = await pool.getClient();

  try {
    // 1. Fetch available users, moderators, products, services, listings, orders
    const buyersRes = await client.query(`SELECT id, first_name, last_name, email FROM users WHERE role = 'buyer' OR role IS NULL LIMIT 50`);
    const sellersRes = await client.query(`SELECT id, first_name, last_name, email FROM users WHERE role = 'seller' OR seller_verified = true LIMIT 30`);
    const moderatorsRes = await client.query(`SELECT id, first_name, last_name, email FROM users WHERE is_super_admin = true OR role = 'admin' OR role = 'superadmin' LIMIT 10`);

    if (buyersRes.rows.length === 0 || sellersRes.rows.length === 0) {
      throw new Error('Not enough buyers or sellers found to seed reviews.');
    }

    const buyers = buyersRes.rows;
    const sellers = sellersRes.rows;
    const moderators = moderatorsRes.rows.length > 0 ? moderatorsRes.rows : buyers.slice(0, 3);
    const superAdmin = moderators[0];

    const productsRes = await client.query(`SELECT id, title, seller_id FROM digital_products LIMIT 25`);
    const servicesRes = await client.query(`SELECT id, title, seller_id FROM services LIMIT 25`);
    const listingsRes = await client.query(`SELECT id, title, listing_type, seller_id FROM listings LIMIT 35`);
    const ordersRes = await client.query(`SELECT id, buyer_id, seller_id, listing_id FROM orders LIMIT 60`);
    const bookingsRes = await client.query(`SELECT id, customer_id, seller_id, service_id FROM customer_bookings LIMIT 30`);

    const products = productsRes.rows;
    const services = servicesRes.rows;
    const listings = listingsRes.rows;
    const orders = ordersRes.rows;
    const bookings = bookingsRes.rows;

    console.log(`Found ${buyers.length} buyers, ${sellers.length} sellers, ${products.length} products, ${services.length} services.`);

    // 2. Adjust and Ensure Review Status & Rating Targets
    // Ensure we have at least:
    // 80x 5-star, 55x 4-star, 30x 3-star, 20x 2-star, 15x 1-star
    // Statuses: 25+ pending_moderation, 150+ approved, 15+ rejected, 10+ hidden, 15+ under_investigation, 10+ removed

    const sampleReviewTitlesAndTexts = {
      5: [
        { title: 'Exceeded all expectations! Absolute masterclass', text: 'The attention to typography, spacing tokens, and component variants in this kit is world-class. Our team shipped 2 weeks faster than scheduled.' },
        { title: 'Flawless design tokens and auto-layout', text: 'Everything is organized meticulously according to industry atomic design principles. The seller was responsive and accommodating to our tech stack.' },
        { title: 'Best Figma UI Kit on the marketplace', text: 'I have tested dozens of kits across Gumroad and UI8. Desigot has the highest standard of execution. High-res vector components throughout.' },
        { title: 'Fast turnaround and unmatched professionalism', text: 'Delivered an entire interactive micro-interaction prototype within 4 days. Zero back-and-forth revisions needed.' },
        { title: 'Saved our startup thousands in agency costs', text: 'The design assets are production-ready. Our React Native engineers had zero issues translating the Figma component properties directly into Tailwind CSS.' }
      ],
      4: [
        { title: 'Very solid design, minor documentation gap', text: 'Great components and clean layers. Would have loved a dedicated Figma Variables token migration guide, but overall highly recommended.' },
        { title: 'Smooth communication and good delivery', text: 'The seller understood our wireframes quickly and provided modern layout alternatives. Took one minor revision to get the mobile viewport perfect.' },
        { title: 'Well worth the investment', text: 'High quality assets. The dark mode palette is particularly well calibrated with proper WCAG AAA contrast ratios.' },
        { title: 'High quality deliverables with minor delay', text: 'Seller was a day late due to personal emergency, but communicated upfront and included bonus 3D illustration assets to make up for it.' }
      ],
      3: [
        { title: 'Good visuals, but layer naming needs work', text: 'Visually appealing and modern look, but several frame hierarchies were left as Frame 1423. Took some cleanup before we could hand off to engineering.' },
        { title: 'Decent service, expected more depth', text: 'Delivered what was promised in the basic tier, but lacked custom iconography. Had to purchase external icons to complement the screens.' },
        { title: 'Average turnaround, satisfactory outcome', text: 'Communication was a bit slow on weekends, but the end result met our core client requirements.' }
      ],
      2: [
        { title: 'Disappointing delivery, required multiple revisions', text: 'The typography didn’t match modern standards and responsive variants were incomplete. Seller did attempt revisions, but we ended up redesigning in-house.' },
        { title: 'Not production ready out of the box', text: 'Missing hover states and interactive component properties. The preview was slick, but the actual file contains lots of flattened vectors.' },
        { title: 'Communication was difficult throughout', text: 'Had to explain basic requirements 3 times. Timeline slipped by almost a week.' }
      ],
      1: [
        { title: 'Completely unusable files and terrible attitude', text: 'Files were broken, missing font links, and contained copied assets from free templates online. When questioned, seller was dismissive.' },
        { title: 'Avoid this seller – missed deadlines repeatedly', text: 'Promised 48-hour delivery, took 12 days, and submitted unfinished mockups. Requested refund through support.' },
        { title: 'Terrible quality, total waste of budget', text: 'Looks nothing like the demo screenshots. The resolution is pixelated and components are ungrouped shapes.' }
      ]
    };

    // Check existing reviews in database
    const existingReviewsCountRes = await client.query(`SELECT count(*) FROM reviews`);
    const totalExisting = parseInt(existingReviewsCountRes.rows[0].count, 10);
    console.log(`Current existing reviews in DB: ${totalExisting}`);

    // If existing reviews are present, let's categorize some into required statuses:
    // Let's set up explicit statuses:
    // Update some to pending_moderation
    await client.query(`
      UPDATE reviews
      SET status = 'pending_moderation', approved_at = NULL, rejected_at = NULL
      WHERE id IN (SELECT id FROM reviews ORDER BY id LIMIT 30);
    `);

    // Update some to rejected
    await client.query(`
      UPDATE reviews
      SET status = 'rejected',
          rejected_at = NOW() - INTERVAL '3 days',
          rejection_reason = 'Violates Marketplace Quality Guidelines: submitted review contains unsubstantiated claims and inappropriate tone.',
          moderator_notes = 'Reviewed by senior moderator. Contains flagged defamatory terms against seller.'
      WHERE id IN (SELECT id FROM reviews WHERE status != 'pending_moderation' ORDER BY id LIMIT 20);
    `);

    // Update some to hidden
    await client.query(`
      UPDATE reviews
      SET status = 'hidden',
          visibility_status = 'hidden',
          moderator_notes = 'Temporarily hidden pending resolution of customer order dispute #DISP-9021.'
      WHERE id IN (SELECT id FROM reviews WHERE status = 'approved' ORDER BY id LIMIT 15);
    `);

    // Update some to under_investigation
    await client.query(`
      UPDATE reviews
      SET status = 'under_investigation',
          risk_score = 0.85,
          moderator_notes = 'Flagged for multiple user reports regarding inauthentic review activity / competitor sabotage.'
      WHERE id IN (SELECT id FROM reviews WHERE status = 'approved' ORDER BY id LIMIT 18);
    `);

    // Update some to removed
    await client.query(`
      UPDATE reviews
      SET status = 'removed',
          visibility_status = 'hidden',
          rejection_reason = 'Confirmed fraudulent review pattern detected by anti-fraud heuristics.',
          moderator_notes = 'Permanently removed from platform ratings calculation.'
      WHERE id IN (SELECT id FROM reviews WHERE status = 'approved' ORDER BY id LIMIT 12);
    `);

    // Make sure we have 1, 2, 3, 4, 5 star distribution
    await client.query(`
      UPDATE reviews SET rating_overall = 5 WHERE id IN (SELECT id FROM reviews ORDER BY id LIMIT 85);
      UPDATE reviews SET rating_overall = 4 WHERE id IN (SELECT id FROM reviews OFFSET 85 LIMIT 65);
      UPDATE reviews SET rating_overall = 3 WHERE id IN (SELECT id FROM reviews OFFSET 150 LIMIT 40);
      UPDATE reviews SET rating_overall = 2 WHERE id IN (SELECT id FROM reviews OFFSET 190 LIMIT 25);
      UPDATE reviews SET rating_overall = 1 WHERE id IN (SELECT id FROM reviews OFFSET 215 LIMIT 20);
    `);

    // Update titles and dimensional ratings for existing reviews
    const allReviewsRes = await client.query(`SELECT id, rating_overall, review_text, title FROM reviews`);
    for (const r of allReviewsRes.rows) {
      const star = r.rating_overall || 5;
      const tSamples = sampleReviewTitlesAndTexts[star] || sampleReviewTitlesAndTexts[5];
      const picked = randomItem(tSamples);
      const title = r.title || picked.title;
      const quality = Math.max(1, Math.min(5, star + randomInt(-1, 0)));
      const comms = Math.max(1, Math.min(5, star + randomInt(0, 1)));
      const val = Math.max(1, Math.min(5, star + randomInt(-1, 0)));
      const delivery = Math.max(1, Math.min(5, star + randomInt(-1, 0)));
      const sentiment = star >= 4 ? randomFloat(0.65, 0.99) : star === 3 ? randomFloat(-0.15, 0.35) : randomFloat(-0.95, -0.45);
      const risk = star <= 2 ? randomFloat(0.40, 0.85) : randomFloat(0.02, 0.20);
      const helpful = star >= 4 ? randomInt(4, 38) : randomInt(0, 8);
      const unhelpful = star <= 2 ? randomInt(2, 12) : randomInt(0, 3);

      await client.query(`
        UPDATE reviews
        SET title = COALESCE(title, $1),
            rating_quality = COALESCE(rating_quality, $2),
            rating_communication = COALESCE(rating_communication, $3),
            rating_value = COALESCE(rating_value, $4),
            rating_delivery = COALESCE(rating_delivery, $5),
            sentiment_score = COALESCE(sentiment_score, $6),
            risk_score = COALESCE(risk_score, $7),
            helpful_count = COALESCE(helpful_count, $8),
            unhelpful_count = COALESCE(unhelpful_count, $9)
        WHERE id = $10
      `, [title, quality, comms, val, delivery, sentiment, risk, helpful, unhelpful, r.id]);
    }
    console.log(`✅ Reviews rating distribution and metadata standardized.`);

    // 3. Seed Review Attachments (at least 40)
    console.log('📎 Seeding Review Attachments...');
    await client.query(`DELETE FROM review_attachments`);
    const mockImageUrls = [
      { name: 'dashboard-final-export.png', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80', type: 'image/png', size: 1420500 },
      { name: 'figma-tokens-variables.png', url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80', type: 'image/png', size: 894000 },
      { name: 'mobile-app-wireframes.jpg', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80', type: 'image/jpeg', size: 1650300 },
      { name: 'dark-mode-palette-proof.png', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80', type: 'image/png', size: 1104200 },
      { name: 'component-grid-hierarchy.png', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80', type: 'image/png', size: 2048000 },
      { name: '3d-isometric-render-test.png', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80', type: 'image/png', size: 3140500 },
      { name: 'interactive-prototype-recording.mp4', url: 'https://assets.desigot.com/media/samples/prototype-recording-h264.mp4', type: 'video/mp4', size: 9450000 },
      { name: 'client-audit-handover.pdf', url: 'https://assets.desigot.com/media/samples/design-audit-handover.pdf', type: 'application/pdf', size: 4500000 }
    ];

    const eligibleReviews = await client.query(`SELECT id FROM reviews ORDER BY rating_overall DESC LIMIT 35`);
    let attachmentCount = 0;
    for (let i = 0; i < eligibleReviews.rows.length; i++) {
      const reviewId = eligibleReviews.rows[i].id;
      // add 1 or 2 attachments per review
      const numAttachments = (i % 3 === 0) ? 2 : 1;
      for (let j = 0; j < numAttachments; j++) {
        const item = mockImageUrls[(attachmentCount + j) % mockImageUrls.length];
        await client.query(`
          INSERT INTO review_attachments (review_id, file_name, file_url, file_type, file_size_bytes, thumbnail_url, moderation_status)
          VALUES ($1, $2, $3, $4, $5, $6, 'approved');
        `, [reviewId, item.name, item.url, item.type, item.size, item.url]);
        attachmentCount++;
      }
    }
    console.log(`✅ Seeded ${attachmentCount} review attachments.`);

    // 4. Seed Review Reports (Flags) (at least 40)
    console.log('🚨 Seeding Review Reports / Flags...');
    await client.query(`DELETE FROM review_reports`);
    const reportReasons = [
      { reason: 'Spam or Promotional', desc: 'Contains repetitive marketing links pointing to an external website.' },
      { reason: 'Fake / Inauthentic Review', desc: 'User never engaged with the product; account created 2 hours ago.' },
      { reason: 'Harassment or Hate Speech', desc: 'Contains aggressive personal insults towards the seller.' },
      { reason: 'Offensive Language', desc: 'Vulgar and inappropriate words used in review body.' },
      { reason: 'Irrelevant Content', desc: 'Comment discusses an unrelated shipping carrier issue, not the digital product.' },
      { reason: 'Competitor Sabotage', desc: 'Reviewer works for a direct competitor and posted 1-star reviews on 3 separate items.' },
      { reason: 'Privacy Violation', desc: 'Contains phone number and email address in review text.' }
    ];

    const reportStatuses = ['pending', 'investigating', 'resolved_dismissed', 'resolved_removed', 'escalated'];
    const reviewsForReporting = await client.query(`SELECT id FROM reviews ORDER BY RANDOM() LIMIT 45`);

    let reportSeq = 1;
    for (const rev of reviewsForReporting.rows) {
      const reasonObj = randomItem(reportReasons);
      const reporter = randomItem(buyers);
      const status = randomItem(reportStatuses);
      const ref = `REP-2026-${String(reportSeq).padStart(4, '0')}`;
      const mod = status !== 'pending' ? randomItem(moderators) : null;
      const resAction = status === 'resolved_dismissed' ? 'dismissed' : status === 'resolved_removed' ? 'review_removed' : 'none';
      const resNotes = status.startsWith('resolved') ? `Investigation completed. Action taken: ${resAction}. Reference policy #4.2.` : null;
      const resolvedAt = status.startsWith('resolved') ? new Date() : null;

      await client.query(`
        INSERT INTO review_reports (
          report_reference, review_id, reporter_id, reason, description, status,
          assigned_moderator_id, investigation_notes, resolution_action, resolved_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `, [ref, rev.id, reporter.id, reasonObj.reason, reasonObj.desc, status, mod ? mod.id : null, resNotes, resAction, resolvedAt]);

      // Also update review reported_count
      await client.query(`UPDATE reviews SET reported_count = reported_count + 1 WHERE id = $1`, [rev.id]);
      reportSeq++;
    }
    console.log(`✅ Seeded ${reportSeq - 1} review reports across reviews.`);

    // 5. Seed Seller Responses (at least 50)
    console.log('💬 Seeding Seller Review Responses...');
    await client.query(`DELETE FROM review_responses`);
    const sellerResponseTemplates = {
      positive: [
        'Thank you so much for the glowing review! We are thrilled our design system sped up your development cycle. Version 2.0 with full dark-mode tokens is launching next week!',
        'We truly appreciate your kind feedback. If you ever need assistance customizing the responsive grid or nested variants, please reach out via direct message anytime.',
        'Thanks for choosing our UI Kit! We designed this with engineers in mind, so hearing that it translated seamlessly to React Native makes our day.',
        'Honored to support your product launch! Best of luck with the fundraise, and let us know if you need additional bespoke screens.'
      ],
      neutral: [
        'Thank you for your constructive comments. We have noted the feedback regarding frame naming and will release an updated release bundle addressing layer organization tomorrow.',
        'We appreciate your review. The basic package includes standard components, but we offer dedicated icon add-on packs. Reach out and we will grant you a courtesy 20% discount!',
        'Thank you for highlighting this. We will improve our documentation in the next update to clarify the token variable bindings.'
      ],
      critical: [
        'We apologize for the friction experienced. We strive for top-tier quality and have sent you an updated delivery via DM with the missing variants and full vector assets.',
        'We regret that this order did not meet your expectations. We take this very seriously and our team has initiated a full audit to prevent similar delays.',
        'Thank you for your feedback. We have reached out to resolve the font dependency links. Please check your inbox so we can make this right.'
      ]
    };

    const reviewsForResponses = await client.query(`
      SELECT r.id, r.seller_id, r.rating_overall
      FROM reviews r
      WHERE r.seller_id IS NOT NULL
      ORDER BY r.created_at DESC
      LIMIT 55
    `);

    let respSeq = 1;
    for (const r of reviewsForResponses.rows) {
      let tList = sellerResponseTemplates.positive;
      if (r.rating_overall <= 2) tList = sellerResponseTemplates.critical;
      else if (r.rating_overall === 3) tList = sellerResponseTemplates.neutral;

      const text = randomItem(tList);
      const ref = `RSP-2026-${String(respSeq).padStart(4, '0')}`;
      
      // Statuses: 38 approved, 10 pending_approval, 5 rejected
      let status = 'approved';
      let isVisible = true;
      let rejReason = null;
      let approvedAt = new Date();
      let approvedBy = superAdmin ? superAdmin.id : null;

      if (respSeq > 48) {
        status = 'rejected';
        isVisible = false;
        approvedAt = null;
        rejReason = 'Response violates seller communication guidelines: defensive tone and inappropriate language.';
      } else if (respSeq > 38) {
        status = 'pending_approval';
        isVisible = false;
        approvedAt = null;
        approvedBy = null;
      }

      await client.query(`
        INSERT INTO review_responses (
          review_id, responder_id, response_text, is_visible, response_reference,
          status, rejection_reason, approved_by_id, approved_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `, [r.id, r.seller_id, text, isVisible, ref, status, rejReason, approvedBy, approvedAt]);
      respSeq++;
    }
    console.log(`✅ Seeded ${respSeq - 1} seller responses.`);

    // 6. Seed Review Moderation Rules (at least 15)
    console.log('⚖️ Seeding Review Moderation Rules...');
    await client.query(`DELETE FROM review_moderation_rules`);
    const moderationRules = [
      {
        name: 'Profanity & Explicit Language Filter',
        code: 'RULE-PROFANITY-01',
        category: 'profanity',
        condition_type: 'contains_keywords',
        action: 'flag_for_review',
        severity: 'high',
        params: { keywords: ['scam', 'fraud', 'cheat', 'idiot', 'garbage', 'f***', 's***'], case_sensitive: false }
      },
      {
        name: 'External URL & Link Redirection',
        code: 'RULE-LINKS-02',
        category: 'links',
        condition_type: 'contains_urls',
        action: 'flag_for_review',
        severity: 'critical',
        params: { allowed_domains: ['desigot.com', 'figma.com'], block_all_others: true }
      },
      {
        name: 'Personal Contact & PII Detection',
        code: 'RULE-PII-03',
        category: 'pii',
        condition_type: 'contains_phone_email',
        action: 'flag_for_review',
        severity: 'critical',
        params: { detect_phone: true, detect_email: true, detect_whatsapp: true }
      },
      {
        name: 'Competitor Defamation & Off-Platform Names',
        code: 'RULE-COMPETITOR-04',
        category: 'keywords',
        condition_type: 'contains_keywords',
        action: 'flag_for_review',
        severity: 'medium',
        params: { keywords: ['envato', 'themeforest', 'ui8', 'creativemarket', 'freepik'] }
      },
      {
        name: 'High Rating Velocity Spike Detector',
        code: 'RULE-VELOCITY-05',
        category: 'suspicious_activity',
        condition_type: 'rating_above',
        action: 'require_manager_audit',
        severity: 'high',
        params: { max_reviews_per_seller_per_hour: 5, action: 'quarantine_seller_queue' }
      },
      {
        name: 'Short Text with 1-Star Rating Check',
        code: 'RULE-SHORT-1STAR-06',
        category: 'length',
        condition_type: 'text_length_below',
        action: 'flag_for_review',
        severity: 'medium',
        params: { min_characters: 20, rating_threshold: 1 }
      },
      {
        name: 'Duplicate Text Fingerprinting Rule',
        code: 'RULE-DUPLICATE-07',
        category: 'suspicious_activity',
        condition_type: 'regex_match',
        action: 'auto_reject',
        severity: 'critical',
        params: { hash_check: true, jaccard_similarity_threshold: 0.85 }
      },
      {
        name: 'Extreme Low-Star Customer Recovery Alert',
        code: 'RULE-LOW-RATING-08',
        category: 'rating_anomaly',
        condition_type: 'rating_below',
        action: 'flag_for_review',
        severity: 'medium',
        params: { rating_threshold: 2, notify_support_tier: true }
      },
      {
        name: 'Automated 5-Star Auto-Approval for Verified Buyers',
        code: 'RULE-AUTO-APPROVE-09',
        category: 'rating_anomaly',
        condition_type: 'rating_above',
        action: 'auto_approve',
        severity: 'low',
        params: { min_rating: 5, require_verified_purchase: true, min_account_age_days: 7 }
      },
      {
        name: 'Crypto & Off-Platform Payment Solicitations',
        code: 'RULE-CRYPTO-PAY-10',
        category: 'keywords',
        condition_type: 'contains_keywords',
        action: 'auto_reject',
        severity: 'critical',
        params: { keywords: ['usdt', 'crypto', 'wire transfer', 'paypal direct', 'cashapp', 'telegram payment'] }
      },
      {
        name: 'Unverified High Value Booking Oversight',
        code: 'RULE-HIGH-VAL-11',
        category: 'suspicious_activity',
        condition_type: 'rating_below',
        action: 'require_manager_audit',
        severity: 'medium',
        params: { min_order_cents: 100000, trigger_instant_notification: true }
      },
      {
        name: 'Excessive All-Caps and Punctuation Screaming',
        code: 'RULE-EXCESSIVE-CAPS-12',
        category: 'length',
        condition_type: 'regex_match',
        action: 'flag_for_review',
        severity: 'low',
        params: { caps_percentage_threshold: 0.65, consecutive_exclamations: 4 }
      },
      {
        name: 'Seller Collusion & Cross-Buying Fingerprint',
        code: 'RULE-COLLUSION-13',
        category: 'suspicious_activity',
        condition_type: 'regex_match',
        action: 'auto_reject',
        severity: 'critical',
        params: { check_ip_match: true, check_device_fingerprint: true }
      },
      {
        name: 'Extortion or Blackmail Keyword Watchlist',
        code: 'RULE-EXTORTION-14',
        category: 'keywords',
        condition_type: 'contains_keywords',
        action: 'escalate',
        severity: 'critical',
        params: { keywords: ['refund or bad review', 'give me money back or 1 star', 'ruin your profile'] }
      },
      {
        name: 'Malicious Attachment & Link File Inspection',
        code: 'RULE-ATTACH-SECURITY-15',
        category: 'suspicious_activity',
        condition_type: 'regex_match',
        action: 'auto_reject',
        severity: 'high',
        params: { blocked_extensions: ['.exe', '.bat', '.sh', '.vbs', '.scr', '.zip'] }
      }
    ];

    for (const rule of moderationRules) {
      await client.query(`
        INSERT INTO review_moderation_rules (
          rule_name, rule_code, category, condition_type, action, severity, parameters, matches_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (rule_code) DO UPDATE 
          SET rule_name = EXCLUDED.rule_name, action = EXCLUDED.action, parameters = EXCLUDED.parameters;
      `, [rule.name, rule.code, rule.category, rule.condition_type, rule.action, rule.severity, JSON.stringify(rule.params), randomInt(12, 140)]);
    }
    console.log(`✅ Seeded ${moderationRules.length} moderation rules.`);

    // 7. Seed Review Moderation Actions (Audit Trail) (at least 100)
    console.log('📜 Seeding Review Moderation Audit Actions...');
    await client.query(`DELETE FROM review_moderation_actions`);
    const actionTypes = [
      { action: 'approve', prev: 'pending_moderation', next: 'approved', reason: 'Review meets all quality and verified purchase criteria.' },
      { action: 'reject', prev: 'pending_moderation', next: 'rejected', reason: 'Contains offensive personal accusations without proof.' },
      { action: 'hide', prev: 'approved', next: 'hidden', reason: 'Temporarily hidden while customer support investigates transaction dispute.' },
      { action: 'restore', prev: 'hidden', next: 'approved', reason: 'Dispute closed in good standing; customer requested review reactivation.' },
      { action: 'remove', prev: 'under_investigation', next: 'removed', reason: 'Confirmed competitor sock-puppet review violation.' },
      { action: 'investigate', prev: 'approved', next: 'under_investigation', reason: 'Assigned to senior investigator following 3 customer flags.' },
      { action: 'dismiss_report', prev: 'under_investigation', next: 'approved', reason: 'Report dismissed: customer expressed fair opinion regarding delivery speed.' },
      { action: 'escalate', prev: 'pending_moderation', next: 'under_investigation', reason: 'Escalated to Legal & Trust team due to copyright infringement claim.' },
      { action: 'approve_response', prev: 'pending_approval', next: 'approved', reason: 'Seller response verified courteous and factual.' },
      { action: 'reject_response', prev: 'pending_approval', next: 'rejected', reason: 'Seller response contains external email contact violating ToS.' }
    ];

    const allReviewIds = await client.query(`SELECT id FROM reviews LIMIT 80`);
    let auditCount = 0;
    for (let i = 0; i < 110; i++) {
      const act = actionTypes[i % actionTypes.length];
      const rev = allReviewIds.rows[i % allReviewIds.rows.length];
      const mod = randomItem(moderators);
      const ip = `192.168.1.${randomInt(10, 240)}`;
      const meta = { source: 'admin_dashboard', session_id: crypto.randomBytes(8).toString('hex') };

      await client.query(`
        INSERT INTO review_moderation_actions (
          review_id, moderator_id, action_type, previous_status, new_status, reason, metadata, ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - ($9 || ' hours')::interval);
      `, [rev.id, mod.id, act.action, act.prev, act.next, act.reason, JSON.stringify(meta), ip, String(i * 2 + 1)]);
      auditCount++;
    }
    console.log(`✅ Seeded ${auditCount} moderation audit records.`);

    // 8. Seed Review Appeals (at least 15)
    console.log('⚖️ Seeding Review Appeals...');
    await client.query(`DELETE FROM review_appeals`);
    const appealReasons = [
      'Customer admitted in private support ticket that they downloaded the wrong format by mistake, yet left a 1-star review claiming our files are broken.',
      'This review was posted 10 minutes after ordering before work even started. Clearly an accidental submission.',
      'The client accepted the order with 5-star rating, then 3 months later changed it to 1 star without contacting us.',
      'Review contains false allegations that we stole the mockups from Behance, but our Figma version history proves original timestamped creation.',
      'Customer is attempting to extort free additional custom revisions in exchange for removing their 1-star feedback.'
    ];

    const appealStatuses = ['pending', 'under_review', 'granted', 'denied'];
    const rejectedOrFlaggedReviews = await client.query(`
      SELECT r.id, r.seller_id, r.customer_id
      FROM reviews r
      WHERE r.seller_id IS NOT NULL
      ORDER BY r.rating_overall ASC
      LIMIT 20
    `);

    let appealSeq = 1;
    for (const r of rejectedOrFlaggedReviews.rows) {
      const status = appealStatuses[appealSeq % appealStatuses.length];
      const ref = `APL-2026-${String(appealSeq).padStart(4, '0')}`;
      const reason = appealReasons[appealSeq % appealReasons.length];
      const mod = status !== 'pending' ? randomItem(moderators) : null;
      const decNotes = status === 'granted' ? 'Appeal verified. Review hidden pending verification of chat transcripts.' : status === 'denied' ? 'Appeal denied. Customer feedback remains within policy limits.' : null;
      const decAt = status === 'granted' || status === 'denied' ? new Date() : null;

      await client.query(`
        INSERT INTO review_appeals (
          appeal_reference, review_id, appellant_id, appellant_type, reason, status, reviewer_id, decision_notes, decided_at
        ) VALUES ($1, $2, $3, 'seller', $4, $5, $6, $7, $8);
      `, [ref, r.id, r.seller_id, reason, status, mod ? mod.id : null, decNotes, decAt]);
      appealSeq++;
    }
    console.log(`✅ Seeded ${appealSeq - 1} review appeals.`);

    // 9. Compute and Seed Rating Aggregates for Products, Services, Sellers
    console.log('📊 Calculating and Seeding Rating Aggregates...');
    await client.query(`DELETE FROM rating_aggregates`);

    // (A) Products
    for (const p of products) {
      // Find eligible reviews (approved only, visible only)
      const res = await client.query(`
        SELECT 
          COUNT(*)::int as total_reviews,
          COUNT(CASE WHEN is_verified_purchase THEN 1 END)::int as verified_reviews,
          COALESCE(AVG(rating_overall), 0) as avg_rating,
          COUNT(CASE WHEN rating_overall = 5 THEN 1 END)::int as s5,
          COUNT(CASE WHEN rating_overall = 4 THEN 1 END)::int as s4,
          COUNT(CASE WHEN rating_overall = 3 THEN 1 END)::int as s3,
          COUNT(CASE WHEN rating_overall = 2 THEN 1 END)::int as s2,
          COUNT(CASE WHEN rating_overall = 1 THEN 1 END)::int as s1,
          COALESCE(AVG(rating_quality), 0) as avg_qual,
          COALESCE(AVG(rating_communication), 0) as avg_comm,
          COALESCE(AVG(rating_value), 0) as avg_val,
          COALESCE(AVG(rating_delivery), 0) as avg_del
        FROM reviews
        WHERE (product_id = $1 OR listing_id = $1)
          AND status = 'approved' AND visibility_status = 'visible'
      `, [p.id]);

      const d = res.rows[0];
      const total = d.total_reviews || randomInt(5, 45);
      const avg = d.total_reviews > 0 ? parseFloat(d.avg_rating).toFixed(2) : randomFloat(4.2, 4.95);
      const s5 = d.total_reviews > 0 ? d.s5 : Math.floor(total * 0.65);
      const s4 = d.total_reviews > 0 ? d.s4 : Math.floor(total * 0.25);
      const s3 = d.total_reviews > 0 ? d.s3 : Math.floor(total * 0.07);
      const s2 = d.total_reviews > 0 ? d.s2 : Math.floor(total * 0.02);
      const s1 = d.total_reviews > 0 ? d.s1 : total - (s5 + s4 + s3 + s2);
      const recPct = total > 0 ? parseFloat((((s5 + s4) / total) * 100).toFixed(2)) : 94.50;

      await client.query(`
        INSERT INTO rating_aggregates (
          entity_type, entity_id, average_rating, total_reviews, verified_reviews,
          star_1_count, star_2_count, star_3_count, star_4_count, star_5_count,
          avg_quality, avg_communication, avg_value, avg_delivery, recommendation_percentage
        ) VALUES ('product', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
      `, [p.id, avg, total, total > 0 ? d.verified_reviews || total : total, s1, s2, s3, s4, s5, d.avg_qual || 4.8, d.avg_comm || 4.9, d.avg_val || 4.7, d.avg_del || 4.9, recPct]);

      // Sync back to digital_products table
      await client.query(`
        UPDATE digital_products
        SET avg_rating = $1, review_count = $2
        WHERE id = $3;
      `, [avg, total, p.id]);
    }
    console.log(`✅ Seeded rating aggregates for ${products.length} products.`);

    // (B) Services
    for (const s of services) {
      const res = await client.query(`
        SELECT 
          COUNT(*)::int as total_reviews,
          COUNT(CASE WHEN is_verified_purchase THEN 1 END)::int as verified_reviews,
          COALESCE(AVG(rating_overall), 0) as avg_rating,
          COUNT(CASE WHEN rating_overall = 5 THEN 1 END)::int as s5,
          COUNT(CASE WHEN rating_overall = 4 THEN 1 END)::int as s4,
          COUNT(CASE WHEN rating_overall = 3 THEN 1 END)::int as s3,
          COUNT(CASE WHEN rating_overall = 2 THEN 1 END)::int as s2,
          COUNT(CASE WHEN rating_overall = 1 THEN 1 END)::int as s1,
          COALESCE(AVG(rating_quality), 0) as avg_qual,
          COALESCE(AVG(rating_communication), 0) as avg_comm,
          COALESCE(AVG(rating_value), 0) as avg_val,
          COALESCE(AVG(rating_delivery), 0) as avg_del
        FROM reviews
        WHERE (service_id = $1 OR listing_id = $1)
          AND status = 'approved' AND visibility_status = 'visible'
      `, [s.id]);

      const d = res.rows[0];
      const total = d.total_reviews || randomInt(8, 60);
      const avg = d.total_reviews > 0 ? parseFloat(d.avg_rating).toFixed(2) : randomFloat(4.3, 4.98);
      const s5 = d.total_reviews > 0 ? d.s5 : Math.floor(total * 0.70);
      const s4 = d.total_reviews > 0 ? d.s4 : Math.floor(total * 0.20);
      const s3 = d.total_reviews > 0 ? d.s3 : Math.floor(total * 0.06);
      const s2 = d.total_reviews > 0 ? d.s2 : Math.floor(total * 0.02);
      const s1 = d.total_reviews > 0 ? d.s1 : total - (s5 + s4 + s3 + s2);
      const recPct = total > 0 ? parseFloat((((s5 + s4) / total) * 100).toFixed(2)) : 96.00;

      await client.query(`
        INSERT INTO rating_aggregates (
          entity_type, entity_id, average_rating, total_reviews, verified_reviews,
          star_1_count, star_2_count, star_3_count, star_4_count, star_5_count,
          avg_quality, avg_communication, avg_value, avg_delivery, recommendation_percentage
        ) VALUES ('service', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
      `, [s.id, avg, total, total > 0 ? d.verified_reviews || total : total, s1, s2, s3, s4, s5, d.avg_qual || 4.9, d.avg_comm || 4.9, d.avg_val || 4.8, d.avg_del || 4.9, recPct]);

      // Sync back to services table
      await client.query(`
        UPDATE services
        SET avg_rating = $1, review_count = $2
        WHERE id = $3;
      `, [avg, total, s.id]);
    }
    console.log(`✅ Seeded rating aggregates for ${services.length} services.`);

    // (C) Sellers
    for (const seller of sellers) {
      const res = await client.query(`
        SELECT 
          COUNT(*)::int as total_reviews,
          COUNT(CASE WHEN is_verified_purchase THEN 1 END)::int as verified_reviews,
          COALESCE(AVG(rating_overall), 0) as avg_rating,
          COUNT(CASE WHEN rating_overall = 5 THEN 1 END)::int as s5,
          COUNT(CASE WHEN rating_overall = 4 THEN 1 END)::int as s4,
          COUNT(CASE WHEN rating_overall = 3 THEN 1 END)::int as s3,
          COUNT(CASE WHEN rating_overall = 2 THEN 1 END)::int as s2,
          COUNT(CASE WHEN rating_overall = 1 THEN 1 END)::int as s1,
          COALESCE(AVG(rating_quality), 0) as avg_qual,
          COALESCE(AVG(rating_communication), 0) as avg_comm,
          COALESCE(AVG(rating_value), 0) as avg_val,
          COALESCE(AVG(rating_delivery), 0) as avg_del
        FROM reviews
        WHERE seller_id = $1
          AND status = 'approved' AND visibility_status = 'visible'
      `, [seller.id]);

      const d = res.rows[0];
      const total = d.total_reviews || randomInt(12, 85);
      const avg = d.total_reviews > 0 ? parseFloat(d.avg_rating).toFixed(2) : randomFloat(4.5, 4.98);
      const s5 = d.total_reviews > 0 ? d.s5 : Math.floor(total * 0.72);
      const s4 = d.total_reviews > 0 ? d.s4 : Math.floor(total * 0.20);
      const s3 = d.total_reviews > 0 ? d.s3 : Math.floor(total * 0.05);
      const s2 = d.total_reviews > 0 ? d.s2 : Math.floor(total * 0.02);
      const s1 = d.total_reviews > 0 ? d.s1 : total - (s5 + s4 + s3 + s2);
      const recPct = total > 0 ? parseFloat((((s5 + s4) / total) * 100).toFixed(2)) : 95.00;

      await client.query(`
        INSERT INTO rating_aggregates (
          entity_type, entity_id, average_rating, total_reviews, verified_reviews,
          star_1_count, star_2_count, star_3_count, star_4_count, star_5_count,
          avg_quality, avg_communication, avg_value, avg_delivery, recommendation_percentage
        ) VALUES ('seller', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (entity_type, entity_id) DO UPDATE
          SET average_rating = EXCLUDED.average_rating,
              total_reviews = EXCLUDED.total_reviews,
              star_1_count = EXCLUDED.star_1_count,
              star_2_count = EXCLUDED.star_2_count,
              star_3_count = EXCLUDED.star_3_count,
              star_4_count = EXCLUDED.star_4_count,
              star_5_count = EXCLUDED.star_5_count,
              recommendation_percentage = EXCLUDED.recommendation_percentage;
      `, [seller.id, avg, total, total > 0 ? d.verified_reviews || total : total, s1, s2, s3, s4, s5, d.avg_qual || 4.9, d.avg_comm || 4.9, d.avg_val || 4.8, d.avg_del || 4.9, recPct]);

      // Sync back to users table
      await client.query(`
        UPDATE users
        SET avg_seller_rating = $1, seller_review_count = $2
        WHERE id = $3;
      `, [avg, total, seller.id]);
    }
    console.log(`✅ Seeded rating aggregates for ${sellers.length} sellers.`);

    console.log('🎉 Comprehensive Reviews & Moderation Seeding Completed Successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedReviews().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedReviews;
