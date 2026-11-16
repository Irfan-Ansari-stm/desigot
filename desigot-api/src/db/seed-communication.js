'use strict';
require('dotenv').config();
const { primaryPool } = require('./pool');

async function seedCommunication() {
  console.log('🌱 Starting comprehensive relational seed for Messages & Communication...');
  const client = await primaryPool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch valid relational entities
    const usersRes = await client.query(`
      SELECT id, email, display_name, role, is_super_admin 
      FROM users 
      WHERE deleted_at IS NULL
    `);
    const allUsers = usersRes.rows;
    if (allUsers.length === 0) {
      throw new Error('No users found in database to link seed data.');
    }

    const superAdmin = allUsers.find(u => u.is_super_admin || u.role === 'superadmin') || allUsers[0];
    const staffAgents = allUsers.filter(u => u.role === 'admin' || u.is_super_admin || u.role === 'superadmin');
    const sellers = allUsers.filter(u => u.role === 'seller');
    const buyers = allUsers.filter(u => u.role === 'buyer' || u.role === 'user');

    const fallbackBuyers = buyers.length > 0 ? buyers : allUsers;
    const fallbackSellers = sellers.length > 0 ? sellers : allUsers;
    const fallbackAgents = staffAgents.length > 0 ? staffAgents : [superAdmin];

    console.log(`ℹ️ Available entities: ${allUsers.length} users (${fallbackBuyers.length} buyers, ${fallbackSellers.length} sellers, ${fallbackAgents.length} staff)`);

    // Fetch existing orders
    const ordersRes = await client.query(`SELECT id, buyer_id, seller_id, listing_id, listing_title FROM orders LIMIT 200`);
    const orders = ordersRes.rows;

    // Fetch existing customer bookings
    const bookingsRes = await client.query(`SELECT id, booking_number, customer_id, seller_id, service_title FROM customer_bookings LIMIT 100`);
    const bookings = bookingsRes.rows;

    // Fetch existing services and digital products
    const servicesRes = await client.query(`SELECT id, title, seller_id FROM services LIMIT 50`);
    const services = servicesRes.rows;

    const productsRes = await client.query(`SELECT id, title, seller_id FROM digital_products LIMIT 50`);
    const products = productsRes.rows;

    // Fetch SLA policies
    const slaRes = await client.query(`SELECT id, priority, response_time_minutes, resolution_time_minutes FROM support_sla_policies`);
    const slaMap = {};
    slaRes.rows.forEach(p => { slaMap[p.priority] = p; });

    // 2. Seed Notification Templates (At least 30 templates)
    console.log('📦 Seeding Notification Templates (32 templates)...');
    const templateDefs = [
      {
        code: 'WELCOME_CUSTOMER',
        name: 'Welcome to Desigot (Customer)',
        cat: 'account_registration',
        channel: 'email',
        subject: 'Welcome to Desigot, {{customer_name}}!',
        body_text: 'Hi {{customer_name}},\n\nWelcome to Desigot, the premier design marketplace. Your account is ready.\n\nBest,\nThe {{platform_name}} Team',
        body_html: '<div style="font-family:sans-serif;padding:20px;"><h2>Welcome to Desigot, {{customer_name}}!</h2><p>Your account is all set. Discover exceptional design services and digital assets.</p><p>Best regards,<br/>The {{platform_name}} Team</p></div>',
        vars: ['customer_name', 'platform_name']
      },
      {
        code: 'WELCOME_SELLER',
        name: 'Welcome to Desigot Seller Network',
        cat: 'seller_application',
        channel: 'email',
        subject: 'Welcome to the Desigot Creator Community, {{seller_name}}',
        body_text: 'Hi {{seller_name}},\n\nCongratulations! You can now publish design services and digital assets.\n\nTeam {{platform_name}}',
        body_html: '<p>Hi {{seller_name}},</p><p>Welcome to our creator family! Start listing your products and services today.</p>',
        vars: ['seller_name', 'platform_name']
      },
      {
        code: 'EMAIL_VERIFICATION',
        name: 'Email Verification Link',
        cat: 'email_verification',
        channel: 'email',
        subject: 'Verify your Desigot email address',
        body_text: 'Please confirm your email address by clicking the link inside.',
        body_html: '<p>Click below to verify your email address:</p><p><a href="{{action_url}}">Verify My Email</a></p>',
        vars: ['action_url', 'platform_name']
      },
      {
        code: 'PASSWORD_RESET',
        name: 'Password Reset Request',
        cat: 'password_reset',
        channel: 'email',
        subject: 'Reset your Desigot password',
        body_text: 'We received a password reset request. If this was not you, ignore this message.',
        body_html: '<p>You requested a password reset. Click the button below to proceed securely.</p>',
        vars: ['action_url', 'platform_name']
      },
      {
        code: 'LOGIN_SECURITY_ALERT',
        name: 'New Login From Unknown Device',
        cat: 'login_security',
        channel: 'email',
        subject: 'Security Alert: New sign-in detected on Desigot',
        body_text: 'A new sign-in was detected from {{ip_address}} on {{created_at}}.',
        body_html: '<p>A new login was detected on your account.</p>',
        vars: ['ip_address', 'created_at']
      },
      {
        code: 'ORDER_CONFIRMATION_CUSTOMER',
        name: 'Order Confirmation (Customer)',
        cat: 'order_confirmation',
        channel: 'email',
        subject: 'Order Confirmation #{{order_id}} - Desigot',
        body_text: 'Thank you for your order #{{order_id}} with {{seller_name}}. Amount: ${{refund_amount}}.',
        body_html: '<h3>Order Confirmed!</h3><p>Order #{{order_id}} has been placed with {{seller_name}}.</p>',
        vars: ['order_id', 'customer_name', 'seller_name', 'platform_name']
      },
      {
        code: 'ORDER_RECEIVED_SELLER',
        name: 'New Order Received (Seller)',
        cat: 'order_status_update',
        channel: 'email',
        subject: 'New Order #{{order_id}} received from {{customer_name}}',
        body_text: 'You have received a new order #{{order_id}} from {{customer_name}}.',
        body_html: '<h3>New Order Alert</h3><p>{{customer_name}} has ordered from your studio.</p>',
        vars: ['order_id', 'customer_name', 'seller_name']
      },
      {
        code: 'PAYMENT_CONFIRMATION',
        name: 'Payment Receipt Confirmation',
        cat: 'payment_confirmation',
        channel: 'email',
        subject: 'Payment Receipt for Order #{{order_id}}',
        body_text: 'We have received your payment for order #{{order_id}}. Transaction ID: {{transaction_id}}.',
        body_html: '<p>Payment processed successfully. Transaction: {{transaction_id}}.</p>',
        vars: ['order_id', 'transaction_id']
      },
      {
        code: 'PAYMENT_FAILURE',
        name: 'Payment Failed Notification',
        cat: 'payment_failure',
        channel: 'email',
        subject: 'Payment action required for Order #{{order_id}}',
        body_text: 'Your payment attempt for order #{{order_id}} failed. Please update your payment method.',
        body_html: '<p>Your recent payment was declined. Please check your card or bank account.</p>',
        vars: ['order_id', 'customer_name']
      },
      {
        code: 'BOOKING_CONFIRMATION',
        name: 'Service Booking Confirmed',
        cat: 'booking_confirmation',
        channel: 'email',
        subject: 'Booking Confirmed #{{booking_id}} with {{seller_name}}',
        body_text: 'Your consultation session #{{booking_id}} is confirmed with {{seller_name}}.',
        body_html: '<p>Your design consultation has been locked into the calendar!</p>',
        vars: ['booking_id', 'seller_name', 'customer_name']
      },
      {
        code: 'BOOKING_REMINDER',
        name: 'Upcoming Booking Reminder',
        cat: 'booking_confirmation',
        channel: 'email',
        subject: 'Reminder: Upcoming design session with {{seller_name}} tomorrow',
        body_text: 'Friendly reminder that your session #{{booking_id}} starts tomorrow.',
        body_html: '<p>Get ready for your design review session tomorrow.</p>',
        vars: ['booking_id', 'seller_name']
      },
      {
        code: 'SERVICE_DELIVERY_SUBMITTED',
        name: 'Deliverable Submitted by Creator',
        cat: 'service_delivery',
        channel: 'email',
        subject: 'Deliverables submitted for Order #{{order_id}}',
        body_text: '{{seller_name}} has uploaded deliverables for order #{{order_id}}. Review your files.',
        body_html: '<p>Great news! {{seller_name}} delivered files for review.</p>',
        vars: ['order_id', 'seller_name', 'customer_name']
      },
      {
        code: 'REVISION_REQUESTED',
        name: 'Customer Requested Revision',
        cat: 'revision_request',
        channel: 'email',
        subject: 'Revision requested on Order #{{order_id}}',
        body_text: '{{customer_name}} requested a revision on order #{{order_id}}.',
        body_html: '<p>{{customer_name}} has feedback and requested a design iteration.</p>',
        vars: ['order_id', 'customer_name', 'seller_name']
      },
      {
        code: 'REFUND_PROCESSED',
        name: 'Refund Issued Confirmation',
        cat: 'refund_update',
        channel: 'email',
        subject: 'Refund processed: ${{refund_amount}} for Order #{{order_id}}',
        body_text: 'Your refund of ${{refund_amount}} for order #{{order_id}} has been issued.',
        body_html: '<p>A refund of ${{refund_amount}} has been credited back to your original payment method.</p>',
        vars: ['order_id', 'refund_amount', 'customer_name']
      },
      {
        code: 'PAYOUT_DISPATCHED',
        name: 'Seller Payout Dispatched',
        cat: 'payout_update',
        channel: 'email',
        subject: 'Payout Sent: ${{payout_amount}} has been transferred',
        body_text: 'Hi {{seller_name}}, your payout of ${{payout_amount}} was transferred to your bank.',
        body_html: '<p>Your payout of ${{payout_amount}} has cleared and is heading to your account.</p>',
        vars: ['seller_name', 'payout_amount']
      },
      {
        code: 'TICKET_CREATED_CUSTOMER',
        name: 'Support Ticket Received',
        cat: 'support_ticket_update',
        channel: 'email',
        subject: 'Support Ticket Received: #{{ticket_id}}',
        body_text: 'We received your inquiry (Ticket #{{ticket_id}}). Our helpdesk is reviewing it.',
        body_html: '<p>Your support ticket #{{ticket_id}} was logged. An agent will respond shortly.</p>',
        vars: ['ticket_id', 'customer_name', 'support_email']
      },
      {
        code: 'TICKET_AGENT_REPLY',
        name: 'Support Agent Replied',
        cat: 'support_ticket_update',
        channel: 'email',
        subject: 'Response on Ticket #{{ticket_id}} from {{platform_name}} Support',
        body_text: 'A support specialist has responded to ticket #{{ticket_id}}.',
        body_html: '<p>A new update is available on your support request #{{ticket_id}}.</p>',
        vars: ['ticket_id', 'customer_name', 'platform_name']
      },
      {
        code: 'TICKET_ESCALATED',
        name: 'Support Ticket Escalated',
        cat: 'support_ticket_update',
        channel: 'email',
        subject: 'Ticket #{{ticket_id}} Escalated to Senior Operations',
        body_text: 'Ticket #{{ticket_id}} has been prioritized and assigned to senior support staff.',
        body_html: '<p>Your inquiry #{{ticket_id}} has been escalated for priority handling.</p>',
        vars: ['ticket_id', 'platform_name']
      },
      {
        code: 'TICKET_RESOLVED',
        name: 'Support Ticket Resolved',
        cat: 'support_ticket_update',
        channel: 'email',
        subject: 'Ticket #{{ticket_id}} has been resolved',
        body_text: 'Ticket #{{ticket_id}} has been marked as resolved. Let us know if you need anything else.',
        body_html: '<p>Your ticket #{{ticket_id}} is resolved. If your issue persists, you may reopen it.</p>',
        vars: ['ticket_id', 'customer_name']
      },
      {
        code: 'DISPUTE_OPENED',
        name: 'Dispute Investigation Initiated',
        cat: 'dispute_update',
        channel: 'email',
        subject: 'Notice: Dispute #{{dispute_id}} opened regarding Order #{{order_id}}',
        body_text: 'A dispute #{{dispute_id}} has been initiated for order #{{order_id}}.',
        body_html: '<p>A formal dispute #{{dispute_id}} has been filed. Our mediation team will investigate.</p>',
        vars: ['dispute_id', 'order_id', 'platform_name']
      },
      {
        code: 'DISPUTE_EVIDENCE_REQUEST',
        name: 'Evidence Requested in Dispute',
        cat: 'dispute_update',
        channel: 'email',
        subject: 'Action Required: Submit evidence for Dispute #{{dispute_id}}',
        body_text: 'Please upload documentation or screenshots for dispute #{{dispute_id}} within 48 hours.',
        body_html: '<p>The mediator has requested additional proof for dispute #{{dispute_id}}.</p>',
        vars: ['dispute_id', 'customer_name', 'seller_name']
      },
      {
        code: 'DISPUTE_RESOLVED_FAVOR_BUYER',
        name: 'Dispute Decision - Buyer Favor',
        cat: 'dispute_update',
        channel: 'email',
        subject: 'Dispute #{{dispute_id}} Resolved in Customer Favor',
        body_text: 'Dispute #{{dispute_id}} has concluded with a favorable resolution for the customer.',
        body_html: '<p>The investigation for dispute #{{dispute_id}} has completed in favor of the customer.</p>',
        vars: ['dispute_id', 'order_id']
      },
      {
        code: 'DISPUTE_RESOLVED_FAVOR_SELLER',
        name: 'Dispute Decision - Seller Favor',
        cat: 'dispute_update',
        channel: 'email',
        subject: 'Dispute #{{dispute_id}} Resolved in Seller Favor',
        body_text: 'Dispute #{{dispute_id}} has concluded in favor of the seller as deliverables met criteria.',
        body_html: '<p>The mediation team found the deliverables satisfied agreed milestones.</p>',
        vars: ['dispute_id', 'seller_name']
      },
      {
        code: 'SELLER_APPLICATION_SUBMITTED',
        name: 'Seller Application Received',
        cat: 'seller_application',
        channel: 'email',
        subject: 'We received your Desigot Creator Application',
        body_text: 'Thanks {{seller_name}}, our curation board is reviewing your portfolio.',
        body_html: '<p>Thank you for applying to sell on Desigot! Our curators review all work within 48 hours.</p>',
        vars: ['seller_name', 'platform_name']
      },
      {
        code: 'SELLER_APPROVED',
        name: 'Seller Application Approved',
        cat: 'seller_approval',
        channel: 'email',
        subject: 'Congratulations {{seller_name}}! Your Creator Account is Approved',
        body_text: 'Welcome to the verified creator ranks on Desigot!',
        body_html: '<h2>You are approved!</h2><p>Your seller profile is verified and active.</p>',
        vars: ['seller_name', 'platform_name']
      },
      {
        code: 'INVOICE_GENERATED',
        name: 'Commercial Invoice Generated',
        cat: 'invoice',
        channel: 'email',
        subject: 'Invoice #{{invoice_number}} for Order #{{order_id}}',
        body_text: 'Your official tax invoice #{{invoice_number}} is attached.',
        body_html: '<p>Please find attached your invoice #{{invoice_number}} for order #{{order_id}}.</p>',
        vars: ['invoice_number', 'order_id', 'customer_name']
      },
      {
        code: 'PLATFORM_MAINTENANCE_ANNOUNCEMENT',
        name: 'Scheduled Platform Maintenance Notice',
        cat: 'platform_maintenance',
        channel: 'email',
        subject: 'Maintenance Notice: Desigot Platform Scheduled Upgrade',
        body_text: 'We are performing scheduled maintenance on our infrastructure on {{created_at}}.',
        body_html: '<p>Scheduled system maintenance will take place this Sunday at 02:00 UTC.</p>',
        vars: ['created_at', 'platform_name']
      },
      {
        code: 'IN_APP_MESSAGE_RECEIVED',
        name: 'New Message In-App Notification',
        cat: 'order_status_update',
        channel: 'in_app',
        subject: 'New message from {{customer_name}}',
        body_text: 'You received a new message regarding your order.',
        body_html: '<p>New direct message received in conversation.</p>',
        vars: ['customer_name']
      },
      {
        code: 'IN_APP_TICKET_ALERT',
        name: 'Ticket Assigned In-App Alert',
        cat: 'support_ticket_update',
        channel: 'in_app',
        subject: 'Ticket #{{ticket_id}} assigned to you',
        body_text: 'A new high priority support ticket #{{ticket_id}} was assigned to your queue.',
        body_html: '<p>Ticket #{{ticket_id}} needs your attention.</p>',
        vars: ['ticket_id']
      },
      {
        code: 'PUSH_ORDER_STATUS',
        name: 'Push Notification: Order Status Update',
        cat: 'order_status_update',
        channel: 'push',
        subject: 'Order #{{order_id}} Updated',
        body_text: 'Your order #{{order_id}} has moved to active design phase.',
        body_html: '<p>Order status updated.</p>',
        vars: ['order_id']
      },
      {
        code: 'PUSH_PAYOUT_SENT',
        name: 'Push Notification: Payout Sent',
        cat: 'payout_update',
        channel: 'push',
        subject: 'Payout Sent: ${{payout_amount}}',
        body_text: 'Your payout of ${{payout_amount}} is on its way to your bank.',
        body_html: '<p>Payout confirmed.</p>',
        vars: ['payout_amount']
      },
      {
        code: 'SMS_SECURITY_CODE',
        name: 'SMS 2FA Authentication Code',
        cat: 'login_security',
        channel: 'sms',
        subject: 'Your Desigot Verification Code',
        body_text: 'Your Desigot verification code is {{verification_code}}. It expires in 10 minutes.',
        body_html: '<p>Your verification code is {{verification_code}}.</p>',
        vars: ['verification_code']
      }
    ];

    const seededTemplates = [];
    for (const t of templateDefs) {
      const res = await client.query(`
        INSERT INTO communication_templates (
          template_name, template_code, category, channel, subject, body_html, body_text, language, version, is_active, variables_schema, created_by_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'en', 1, TRUE, $8, $9)
        ON CONFLICT (template_code) DO UPDATE
        SET template_name = EXCLUDED.template_name,
            subject = EXCLUDED.subject,
            body_html = EXCLUDED.body_html,
            body_text = EXCLUDED.body_text
        RETURNING id, template_code, template_name
      `, [t.name, t.code, t.cat, t.channel, t.subject, t.body_html, t.body_text, JSON.stringify(t.vars), superAdmin.id]);

      seededTemplates.push(res.rows[0]);

      // Seed version 1
      await client.query(`
        INSERT INTO communication_template_versions (template_id, version, subject, body_html, body_text, changed_by_id, change_summary)
        VALUES ($1, 1, $2, $3, $4, $5, 'Initial baseline production template')
        ON CONFLICT DO NOTHING
      `, [res.rows[0].id, t.subject, t.body_html, t.body_text, superAdmin.id]);
    }

    // 3. Seed Support Agent Workloads
    console.log('👷 Setting up support agent workloads...');
    for (let i = 0; i < Math.min(fallbackAgents.length, 6); i++) {
      const agent = fallbackAgents[i];
      await client.query(`
        INSERT INTO support_agent_workloads (agent_id, active_tickets_count, active_conversations_count, max_ticket_capacity, is_available, skills)
        VALUES ($1, $2, $3, 25, TRUE, ARRAY['design', 'billing', 'disputes', 'tech'])
        ON CONFLICT (agent_id) DO UPDATE
        SET is_available = TRUE,
            max_ticket_capacity = 25
      `, [agent.id, (i + 1) * 3, (i + 1) * 4]);
    }

    // 4. Seed Conversations (At least 100 conversations)
    console.log('💬 Seeding Conversations (105 conversations)...');
    const convTypes = [
      'customer_support',
      'seller_support',
      'customer_seller',
      'order_communication',
      'booking_communication',
      'product_communication',
      'service_communication',
      'general_inquiry'
    ];
    const statuses = ['open', 'pending', 'waiting_customer', 'waiting_seller', 'waiting_support', 'resolved', 'closed'];
    const priorities = ['low', 'normal', 'high', 'urgent', 'critical'];

    const seededConversations = [];
    for (let i = 1; i <= 105; i++) {
      const ref = `CONV-2026-${String(1000 + i).padStart(5, '0')}`;
      const type = convTypes[i % convTypes.length];
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];

      const customer = fallbackBuyers[i % fallbackBuyers.length];
      const seller = fallbackSellers[i % fallbackSellers.length];
      const agent = fallbackAgents[i % fallbackAgents.length];
      const order = orders.length > 0 ? orders[i % orders.length] : null;
      const booking = bookings.length > 0 ? bookings[i % bookings.length] : null;
      const product = products.length > 0 ? products[i % products.length] : null;
      const service = services.length > 0 ? services[i % services.length] : null;

      const subjects = [
        `Inquiry regarding UI Design deliverables and Figma handoff - #${i}`,
        `Booking consultation session scheduling conflict for #${i}`,
        `Question about font licensing and commercial usage rights - #${i}`,
        `Request for revision on logo variant and icon pack - #${i}`,
        `Invoice inquiry and tax breakdown for checkout #${i}`,
        `Digital asset package extraction issue on macOS - #${i}`,
        `Custom enterprise branding quote negotiation - #${i}`,
        `Urgent clarification on delivery timeline and milestones - #${i}`,
        `Account verification and seller payout inquiry - #${i}`,
        `Feedback on initial design wireframes and component tokens - #${i}`
      ];
      const subject = subjects[i % subjects.length];

      const preview = `Last message: Thanks for the update regarding milestone ${i % 4 + 1}. We are finalizing the assets.`;
      const lastMsgAt = new Date(Date.now() - (i * 3600000 * 2));

      const insConv = await client.query(`
        INSERT INTO conversations (
          conversation_reference, conversation_type, subject, customer_id, seller_id, order_id, booking_id,
          product_id, service_id, assigned_agent_id, status, priority, is_pinned, unread_customer_count,
          unread_seller_count, unread_agent_count, last_message_preview, last_message_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $18)
        ON CONFLICT (conversation_reference) DO UPDATE
        SET subject = EXCLUDED.subject,
            status = EXCLUDED.status,
            priority = EXCLUDED.priority
        RETURNING id, conversation_reference, conversation_type, customer_id, seller_id, assigned_agent_id
      `, [
        ref, type, subject, customer.id, seller.id,
        order ? order.id : null,
        booking ? booking.id : null,
        product ? product.id : null,
        service ? service.id : null,
        agent.id, status, priority,
        i % 8 === 0, // pinned
        i % 5 === 0 ? 2 : 0,
        i % 7 === 0 ? 1 : 0,
        i % 4 === 0 ? 3 : 0,
        preview, lastMsgAt, new Date(lastMsgAt.getTime() - 86400000)
      ]);

      const conv = insConv.rows[0];
      seededConversations.push(conv);

      // Add participants
      await client.query(`
        INSERT INTO conversation_participants (conversation_id, user_id, role, last_read_at)
        VALUES ($1, $2, 'customer', $3)
        ON CONFLICT (conversation_id, user_id) DO NOTHING
      `, [conv.id, conv.customer_id, lastMsgAt]);

      if (conv.seller_id) {
        await client.query(`
          INSERT INTO conversation_participants (conversation_id, user_id, role, last_read_at)
          VALUES ($1, $2, 'seller', $3)
          ON CONFLICT (conversation_id, user_id) DO NOTHING
        `, [conv.id, conv.seller_id, lastMsgAt]);
      }

      if (conv.assigned_agent_id) {
        await client.query(`
          INSERT INTO conversation_participants (conversation_id, user_id, role, last_read_at)
          VALUES ($1, $2, 'agent', $3)
          ON CONFLICT (conversation_id, user_id) DO NOTHING
        `, [conv.id, conv.assigned_agent_id, lastMsgAt]);
      }
    }

    // 5. Seed Messages & Attachments (At least 500 messages, at least 30 attachments)
    console.log('📨 Seeding Messages (530 messages) and Attachments (40 attachments)...');
    let attachmentCounter = 0;
    const sampleFiles = [
      { name: 'design-system-tokens-v2.pdf', type: 'application/pdf', size: 2450000, url: '/uploads/docs/design-system-tokens-v2.pdf' },
      { name: 'wireframe-preview-desktop.png', type: 'image/png', size: 1820000, url: '/uploads/images/wireframe-preview-desktop.png' },
      { name: 'brand-palette-swatches.webp', type: 'image/webp', size: 840000, url: '/uploads/images/brand-palette-swatches.webp' },
      { name: 'invoice_commercial_signed.pdf', type: 'application/pdf', size: 450000, url: '/uploads/docs/invoice_commercial_signed.pdf' },
      { name: 'mobile-prototype-flow.png', type: 'image/png', size: 3100000, url: '/uploads/images/mobile-prototype-flow.png' },
      { name: 'contract_deliverable_terms.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 920000, url: '/uploads/docs/contract_deliverable_terms.docx' }
    ];

    let totalMessagesSeeded = 0;
    for (let i = 0; i < seededConversations.length; i++) {
      const conv = seededConversations[i];
      // Generate 5-6 messages per conversation = ~530 messages
      const msgsInConv = (i % 2 === 0) ? 5 : 6;
      for (let m = 1; m <= msgsInConv; m++) {
        totalMessagesSeeded++;
        const isCustomer = m % 3 === 1;
        const isSeller = m % 3 === 2;
        const isAgent = m % 3 === 0;

        let senderId = conv.customer_id;
        let senderType = 'customer';
        if (isSeller && conv.seller_id) {
          senderId = conv.seller_id;
          senderType = 'seller';
        } else if (isAgent && conv.assigned_agent_id) {
          senderId = conv.assigned_agent_id;
          senderType = 'agent';
        }

        const isInternalNote = isAgent && m === msgsInConv && i % 3 === 0;
        const visibility = isInternalNote ? 'internal_only' : 'public';
        const msgType = isInternalNote ? 'internal_note' : (m === 1 ? 'text' : (m === 2 ? 'image' : 'text'));

        const contents = [
          `Hello! I wanted to check on the latest revision of the Figma design components. Are the auto-layout tokens updated?`,
          `Hi there! Yes, we have updated all frames and synchronized the primary design tokens. You can inspect them in the new artboard.`,
          `I reviewed the initial layout and left several comments on the mobile viewport grid. Looks promising overall!`,
          `Thanks for the feedback. I am adjusting the line-height and touch targets to guarantee accessibility compliance.`,
          `[Desigot Support Agent]: We have reviewed the communication log and confirmed milestone milestone requirements are in order.`,
          `INTERNAL AGENT NOTE: Verified buyer is under Enterprise tier. Priority response enforced. No payment issues flagged.`
        ];
        const content = isInternalNote ? contents[5] : contents[(m - 1) % contents.length];

        const msgDate = new Date(Date.now() - ((seededConversations.length - i) * 3600000 * 2) + (m * 600000));

        const insMsg = await client.query(`
          INSERT INTO messages (
            conversation_id, sender_id, sender_type, message_type, message_content,
            visibility, delivery_status, sent_at, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'delivered', $7, $7)
          RETURNING id
        `, [conv.id, senderId, senderType, msgType, content, visibility, msgDate]);

        const msgId = insMsg.rows[0].id;

        // Seed attachment every ~12 messages until we have at least 40
        if (attachmentCounter < 42 && (totalMessagesSeeded % 12 === 0 || m === 2)) {
          const file = sampleFiles[attachmentCounter % sampleFiles.length];
          await client.query(`
            INSERT INTO message_attachments (message_id, file_name, file_type, file_size_bytes, file_url, thumbnail_url)
            VALUES ($1, $2, $3, $4, $5, $5)
          `, [msgId, file.name, file.type, file.size, file.url]);
          attachmentCounter++;
        }
      }
    }

    // 6. Seed Support Tickets & Comments (At least 60 tickets, at least 150 comments)
    console.log('🎫 Seeding Support Tickets (65 tickets) and Comments (160 comments)...');
    const ticketCategories = [
      'general_inquiry', 'account_issues', 'login_problems', 'payment_issues', 'refund_requests',
      'order_issues', 'booking_issues', 'service_delivery', 'digital_product_issues', 'seller_issues',
      'payout_issues', 'technical_problems', 'billing_issues', 'other'
    ];
    const ticketStatuses = ['new', 'open', 'assigned', 'in_progress', 'waiting_customer', 'waiting_seller', 'escalated', 'resolved', 'closed'];

    const seededTickets = [];
    for (let i = 1; i <= 65; i++) {
      const ref = `TCK-2026-${String(2000 + i).padStart(5, '0')}`;
      const cat = ticketCategories[i % ticketCategories.length];
      const priority = priorities[i % priorities.length];
      const status = ticketStatuses[i % ticketStatuses.length];

      const customer = fallbackBuyers[i % fallbackBuyers.length];
      const seller = fallbackSellers[i % fallbackSellers.length];
      const agent = fallbackAgents[i % fallbackAgents.length];
      const order = orders.length > 0 ? orders[i % orders.length] : null;
      const booking = bookings.length > 0 ? bookings[i % bookings.length] : null;
      const policy = slaMap[priority] || slaMap['normal'];

      const subjects = [
        `Urgent: Payment deduction occurred twice for design order #${order ? order.id.slice(0, 8) : i}`,
        `Unable to download complete high-res .ZIP archive for purchased digital UI kit`,
        `Request to reschedule design review booking due to timezone miscalculation`,
        `Seller has not replied to deliverable revision request after 72 hours`,
        `Stripe payout account verification documents stuck in pending review`,
        `Figma embed link not loading in the buyer deliverable preview panel`,
        `Commercial invoice needed with registered VAT number for corporate accounting`,
        `Account two-factor authentication reset request following lost mobile device`,
        `Question about refund policy terms on custom 3-milestone design contracts`,
        `Reported intellectual property infringement claim on portfolio item`
      ];
      const subject = subjects[i % subjects.length];
      const desc = `Detailed incident report: User ${customer.email} reported problem regarding ${cat}. Specific transaction or order reference involved is tracked. Needs resolution within agreed SLA window.`;

      const createdAt = new Date(Date.now() - (i * 3600000 * 3));
      const responseDeadline = new Date(createdAt.getTime() + (policy ? policy.response_time_minutes * 60000 : 86400000));
      const resolutionDeadline = new Date(createdAt.getTime() + (policy ? policy.resolution_time_minutes * 60000 : 172800000));
      const isResolved = status === 'resolved' || status === 'closed';
      const resolvedAt = isResolved ? new Date(createdAt.getTime() + 18000000) : null;
      const slaStatus = (i % 9 === 0) ? 'breached' : ((i % 5 === 0) ? 'warning' : 'compliant');

      const insTicket = await client.query(`
        INSERT INTO support_tickets (
          ticket_reference, customer_id, seller_id, order_id, booking_id, category,
          subject, description, priority, status, assigned_agent_id, sla_policy_id,
          response_deadline, resolution_deadline, first_response_at, resolved_at,
          closed_at, sla_status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16, $17, $18, $18)
        ON CONFLICT (ticket_reference) DO UPDATE
        SET subject = EXCLUDED.subject,
            status = EXCLUDED.status,
            priority = EXCLUDED.priority
        RETURNING id, ticket_reference, customer_id, assigned_agent_id
      `, [
        ref, customer.id, seller.id,
        order ? order.id : null,
        booking ? booking.id : null,
        cat, subject, desc, priority, status, agent.id, policy ? policy.id : null,
        responseDeadline, resolutionDeadline,
        new Date(createdAt.getTime() + 3600000), // first response 1h later
        resolvedAt, slaStatus, createdAt
      ]);

      seededTickets.push(insTicket.rows[0]);

      // Seed 2-3 comments per ticket = ~165 comments
      const numComments = (i % 2 === 0) ? 2 : 3;
      for (let c = 1; c <= numComments; c++) {
        const isAgentComment = c % 2 === 0;
        const isInternalNote = isAgentComment && c === 2 && i % 3 === 0;
        const commentUser = isAgentComment ? agent : customer;
        const commentContent = isInternalNote
          ? `Internal Staff Note: Escalating to billing lead for transaction ledger verification. No customer contact needed yet.`
          : (isAgentComment
            ? `Hello ${customer.display_name || 'Customer'}, thank you for contacting Desigot Support. We have investigated the issue and taken corrective action.`
            : `Additional info: Here is the latest error screenshot and order receipt confirming the issue.`);

        await client.query(`
          INSERT INTO support_ticket_comments (ticket_id, user_id, comment_type, content, is_internal, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          insTicket.rows[0].id,
          commentUser.id,
          isInternalNote ? 'internal_note' : 'reply',
          commentContent,
          isInternalNote,
          new Date(createdAt.getTime() + (c * 7200000))
        ]);
      }
    }

    // 7. Seed Disputes & Evidence (At least 30 disputes, at least 40 evidence records)
    console.log('⚖️ Seeding Disputes (35 disputes) and Evidence (45 records)...');
    const disputeCategories = [
      'customer_seller', 'service_delivery', 'digital_product', 'order_cancellation',
      'payment', 'refund', 'booking', 'delivery', 'quality', 'chargeback'
    ];
    const disputeStatuses = ['submitted', 'under_review', 'evidence_requested', 'awaiting_customer', 'awaiting_seller', 'investigation', 'escalated', 'resolved', 'rejected', 'closed'];
    const resolutionTypes = ['customer_favor', 'seller_favor', 'partial_refund', 'full_refund', 'rework_redelivery', 'mutual_agreement', 'other_policy'];

    const seededDisputes = [];
    for (let i = 1; i <= 35; i++) {
      const ref = `DSP-2026-${String(3000 + i).padStart(5, '0')}`;
      const cat = disputeCategories[i % disputeCategories.length];
      const status = disputeStatuses[i % disputeStatuses.length];
      const priority = priorities[i % priorities.length];
      const resType = (status === 'resolved' || status === 'closed') ? resolutionTypes[i % resolutionTypes.length] : null;

      const customer = fallbackBuyers[i % fallbackBuyers.length];
      const seller = fallbackSellers[i % fallbackSellers.length];
      const investigator = fallbackAgents[i % fallbackAgents.length];
      const order = orders.length > 0 ? orders[i % orders.length] : null;
      const booking = bookings.length > 0 ? bookings[i % bookings.length] : null;

      const amountCents = (150 + (i * 25)) * 100;
      const desc = `Dispute regarding ${cat} on order. Customer claims deliverable did not match agreed specification. Seller states milestone work was fully furnished and inspected.`;
      const createdAt = new Date(Date.now() - (i * 86400000 * 2));
      const isResolved = status === 'resolved' || status === 'closed';
      const resolvedAt = isResolved ? new Date(createdAt.getTime() + 86400000 * 3) : null;

      // Note: we link to existing orders table
      const orderId = order ? order.id : (orders[0] ? orders[0].id : null);

      let dispId;
      const existingDisp = await client.query(`SELECT id FROM disputes WHERE dispute_reference = $1`, [ref]);
      if (existingDisp.rows.length) {
        dispId = existingDisp.rows[0].id;
      } else {
        const insDisp = await client.query(`
          INSERT INTO disputes (
            order_id, opened_by_id, resolved_by_id, status, reason, description, evidence_keys,
            outcome, outcome_notes, refund_amount_cents, opened_at, sla_deadline, resolved_at,
            dispute_reference, customer_id, seller_id, booking_id, dispute_category,
            dispute_amount_cents, currency, assigned_investigator_id, priority, resolution_type,
            resolution_reason, evidence_requested_from, evidence_deadline, created_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, ARRAY['evidence-key-1.pdf'],
            $7, $8, $9, $10, $11, $12,
            $13, $2, $14, $15, $16,
            $17, 'USD', $18, $19, $20,
            $21, $22, $23, $10, $10
          )
          RETURNING id
        `, [
          orderId, customer.id, isResolved ? investigator.id : null,
          status === 'submitted' ? 'open' : (status === 'resolved' ? 'resolved' : 'under_review'),
          'quality_issue',
          desc,
          isResolved ? (resType === 'full_refund' ? 'full_refund' : (resType === 'partial_refund' ? 'partial_refund' : 'no_refund')) : null,
          isResolved ? 'Resolved after evaluating provided source design files and scope' : null,
          resType === 'full_refund' ? amountCents : (resType === 'partial_refund' ? Math.floor(amountCents / 2) : 0),
          createdAt,
          new Date(createdAt.getTime() + 86400000 * 5),
          resolvedAt,
          ref, seller.id, booking ? booking.id : null,
          cat, amountCents, investigator.id, priority, resType,
          isResolved ? 'Comprehensive investigation confirmed milestone agreement specifications were met.' : null,
          (status === 'evidence_requested' || status === 'awaiting_seller') ? 'seller' : 'none',
          new Date(createdAt.getTime() + 86400000 * 2)
        ]);
        dispId = insDisp.rows[0].id;
      }

      seededDisputes.push({ id: dispId, ref, customer, seller, investigator, createdAt });

      // Add timeline event
      await client.query(`
        INSERT INTO dispute_timeline_events (dispute_id, user_id, event_type, notes, is_internal, created_at)
        VALUES ($1, $2, 'dispute_opened', $3, FALSE, $4)
      `, [dispId, customer.id, `Dispute opened by customer for reason: ${cat}`, createdAt]);

      if (investigator) {
        await client.query(`
          INSERT INTO dispute_timeline_events (dispute_id, user_id, event_type, notes, is_internal, created_at)
          VALUES ($1, $2, 'investigator_assigned', $3, FALSE, $4)
        `, [dispId, investigator.id, `Investigator ${investigator.display_name || investigator.email} assigned to review evidence`, new Date(createdAt.getTime() + 3600000)]);
      }

      // Seed Evidence (45 records across disputes)
      if (i <= 30) {
        const party = i % 2 === 0 ? 'customer' : 'seller';
        const uploader = party === 'customer' ? customer : seller;
        await client.query(`
          INSERT INTO dispute_evidence (
            dispute_id, uploaded_by_id, party_type, title, description, file_url, file_name, file_size_bytes, file_type, is_verified, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          dispId, uploader.id, party,
          `Contract & Deliverables Exhibit #${i}`,
          `Evidence submission showing clear delivery timestamps and client approval messages.`,
          `/uploads/evidence/exhibit-${i}.pdf`,
          `exhibit-${i}.pdf`,
          1250000,
          'application/pdf',
          i % 3 === 0,
          new Date(createdAt.getTime() + 7200000)
        ]);

        if (i % 2 === 0) {
          // Add second evidence file
          await client.query(`
            INSERT INTO dispute_evidence (
              dispute_id, uploaded_by_id, party_type, title, description, file_url, file_name, file_size_bytes, file_type, is_verified, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            dispId, customer.id, 'customer',
            `Screenshot of Defective Design Artifacts #${i}`,
            `Visual screenshot showing broken layout grids and missing component states.`,
            `/uploads/evidence/screenshot-defect-${i}.png`,
            `screenshot-defect-${i}.png`,
            780000,
            'image/png',
            true,
            new Date(createdAt.getTime() + 14400000)
          ]);
        }
      }
    }

    // 8. Seed Announcements (At least 20 announcements)
    console.log('📢 Seeding Announcements (22 announcements)...');
    const annTypes = [
      'platform_updates', 'maintenance_notifications', 'new_features', 'service_updates',
      'digital_product_updates', 'seller_announcements', 'customer_announcements',
      'policy_updates', 'promotions', 'security_alerts'
    ];
    const annAudiences = ['all_users', 'customers', 'sellers', 'verified_sellers', 'internal_staff'];
    const annStatuses = ['draft', 'scheduled', 'published', 'paused', 'expired', 'archived'];

    const annTitles = [
      'Introducing Real-Time Messages & Multi-Channel Communication Platform',
      'Scheduled Platform Maintenance: Performance & Database Cluster Upgrades',
      'New Seller Payout Options: Instant Bank Transfers via Stripe Connect',
      'Winter Creative Campaign: 0% Platform Fees on Featured UI Kits',
      'Updated Quality Standards for Commercial Figma Component Systems',
      'Security Advisory: Mandatory Two-Factor Authentication for Creators',
      'Enhanced Mobile Experience: Next-Gen Touch Navigation and Faster Checkouts',
      'Policy Update: Service Milestone Inspection Window Extended to 7 Days',
      'Creator Spotlight: Meet Top Design Studios on Desigot This Month',
      'Developer API v1 Now Live with Webhook Subscriptions and SDKs',
      'Spring Promo: 20% Discount Vouchers on Enterprise Design Packages',
      'Holiday Delivery Deadlines and Support Queue Working Hours Advisory'
    ];

    for (let i = 1; i <= 22; i++) {
      const ref = `ANN-2026-${String(4000 + i).padStart(5, '0')}`;
      const title = annTitles[(i - 1) % annTitles.length] + ` (Vol. ${i})`;
      const type = annTypes[i % annTypes.length];
      const audience = annAudiences[i % annAudiences.length];
      const status = annStatuses[i % annStatuses.length];
      const priority = priorities[i % priorities.length];

      const pubAt = (status === 'published' || status === 'expired') ? new Date(Date.now() - (i * 86400000)) : null;
      const schedAt = status === 'scheduled' ? new Date(Date.now() + (i * 86400000)) : null;
      const expAt = status === 'expired' ? new Date(Date.now() - 3600000) : new Date(Date.now() + (30 * 86400000));

      const insAnn = await client.query(`
        INSERT INTO announcements (
          announcement_reference, title, content, announcement_type, target_audience,
          priority, status, channels, banner_image_url, cta_label, cta_url,
          views_count, clicks_count, published_at, scheduled_at, expires_at, created_by_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, ARRAY['in_app', 'dashboard'], $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (announcement_reference) DO UPDATE
        SET title = EXCLUDED.title,
            status = EXCLUDED.status
        RETURNING id
      `, [
        ref, title,
        `Official announcement for Desigot members: ${title}. Please review our platform guidelines and contact support if you have questions.`,
        type, audience, priority, status,
        i % 2 === 0 ? '/images/announcements/banner-ann-1.webp' : null,
        'Learn More', '/dashboard',
        140 + (i * 35),
        25 + (i * 6),
        pubAt, schedAt, expAt, superAdmin.id
      ]);

      // Seed some read receipts
      if (status === 'published') {
        const annId = insAnn.rows[0].id;
        for (let r = 0; r < 5; r++) {
          const userToRead = allUsers[(i + r) % allUsers.length];
          await client.query(`
            INSERT INTO announcement_user_reads (announcement_id, user_id, read_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (announcement_id, user_id) DO NOTHING
          `, [annId, userToRead.id]);
        }
      }
    }

    // 9. Seed Email Notifications (At least 200 email logs)
    console.log('✉️ Seeding Email Logs (215 email notification records)...');
    const emailStatuses = ['queued', 'processing', 'sent', 'delivered', 'bounced', 'failed', 'deferred', 'cancelled'];
    const emailProviders = ['smtp', 'sendgrid', 'ses', 'resend', 'mailgun'];
    const emailCats = [
      'account_registration', 'email_verification', 'password_reset', 'login_security',
      'order_confirmation', 'payment_confirmation', 'payment_failure', 'booking_confirmation',
      'order_status_update', 'service_delivery', 'revision_request', 'refund_update',
      'payout_update', 'support_ticket_update', 'dispute_update', 'announcement', 'invoice'
    ];

    for (let i = 1; i <= 215; i++) {
      const ref = `EML-2026-${String(5000 + i).padStart(5, '0')}`;
      const status = emailStatuses[i % emailStatuses.length];
      const provider = emailProviders[i % emailProviders.length];
      const cat = emailCats[i % emailCats.length];
      const user = allUsers[i % allUsers.length];

      const queuedAt = new Date(Date.now() - (i * 3600000 * 4));
      const sentAt = (status === 'sent' || status === 'delivered') ? new Date(queuedAt.getTime() + 15000) : null;
      const deliveredAt = status === 'delivered' ? new Date(queuedAt.getTime() + 45000) : null;
      const failReason = (status === 'failed' || status === 'bounced') ? `SMTP 550 5.1.1 Recipient mailbox unavailable / DNS resolution timeout` : null;

      const events = [
        { event: 'queued', timestamp: queuedAt.toISOString() }
      ];
      if (sentAt) events.push({ event: 'sent', timestamp: sentAt.toISOString(), provider_id: `msg_${ref}` });
      if (deliveredAt) events.push({ event: 'delivered', timestamp: deliveredAt.toISOString() });
      if (failReason) events.push({ event: status, timestamp: new Date(queuedAt.getTime() + 30000).toISOString(), reason: failReason });

      await client.query(`
        INSERT INTO communication_emails (
          notification_reference, recipient_id, recipient_email, recipient_name, recipient_type,
          template_code, email_category, subject, body_text, body_html, provider, provider_message_id,
          status, retry_count, max_retries, failure_reason, delivery_events, queued_at, sent_at,
          delivered_at, opened_at, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 3, $15, $16, $17, $18, $19, $20, $17, $17
        )
        ON CONFLICT (notification_reference) DO NOTHING
      `, [
        ref, user.id, user.email, user.display_name || user.email.split('@')[0],
        user.role === 'seller' ? 'seller' : 'customer',
        'ORDER_CONFIRMATION_CUSTOMER',
        cat,
        `Transactional Notice: Update regarding ${cat.replace(/_/g, ' ')} - #${ref}`,
        `Hello ${user.display_name || 'Member'},\n\nThis is an automated notification regarding ${cat}.\n\nReference: ${ref}`,
        `<p>Hello ${user.display_name || 'Member'},</p><p>This is an automated notification regarding <strong>${cat}</strong>.</p><p>Reference: ${ref}</p>`,
        provider,
        `msg_id_${ref}_${provider}`,
        status,
        status === 'failed' ? 1 : 0,
        failReason,
        JSON.stringify(events),
        queuedAt, sentAt, deliveredAt,
        status === 'delivered' && i % 3 === 0 ? new Date(deliveredAt.getTime() + 180000) : null
      ]);
    }

    // 10. Seed Communication Audit Logs (At least 150 audit records)
    console.log('🛡️ Seeding Communication Audit Logs (160 audit records)...');
    const auditActions = [
      'conversation.created', 'conversation.assigned', 'conversation.closed', 'conversation.reopened',
      'message.sent', 'internal_note.created', 'ticket.created', 'ticket.assigned', 'ticket.reassigned',
      'ticket.escalated', 'ticket.resolved', 'dispute.created', 'dispute.investigator_assigned',
      'dispute.evidence_requested', 'dispute.resolved', 'announcement.created', 'announcement.published',
      'email.retry', 'template.created', 'template.updated'
    ];

    for (let i = 1; i <= 160; i++) {
      const action = auditActions[i % auditActions.length];
      const actor = fallbackAgents[i % fallbackAgents.length];
      const parts = action.split('.');
      const entityType = parts[0];
      const entityId = `REF-2026-${String(7000 + i).padStart(5, '0')}`;
      const createdAt = new Date(Date.now() - (i * 3600000 * 2));

      await client.query(`
        INSERT INTO communication_audit_logs (
          action, entity_type, entity_id, actor_id, actor_name, actor_email, ip_address, user_agent, details, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', $7, $8)
      `, [
        action, entityType, entityId, actor.id,
        actor.display_name || actor.email,
        actor.email,
        JSON.stringify({
          module: 'communication',
          action,
          target_reference: entityId,
          timestamp: createdAt.toISOString(),
          actor_role: actor.role || 'staff'
        }),
        createdAt
      ]);
    }

    // 11. Seed User Messaging Restrictions (Sample restricted users)
    console.log('🚫 Seeding sample user messaging restrictions...');
    if (fallbackBuyers.length > 5) {
      await client.query(`
        INSERT INTO user_messaging_restrictions (user_id, is_blocked, reason, restricted_by_id, restricted_until)
        VALUES ($1, FALSE, 'Warning logged for repeated spam links in public listings inquiry', $2, NOW() + INTERVAL '7 days')
        ON CONFLICT (user_id) DO UPDATE
        SET reason = EXCLUDED.reason
      `, [fallbackBuyers[fallbackBuyers.length - 1].id, superAdmin.id]);
    }

    await client.query('COMMIT');
    console.log('✅ Messages & Communication relational seed completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedCommunication().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedCommunication;
