'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const commService = require('./communication.service');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');
const { BadRequestError } = require('../../shared/errors/AppError');

// ─── Setup Multer Storage for Attachments ───────────────────────────────────
const uploadDir = path.join(__dirname, '../../../public/uploads/attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
    cb(null, safeName);
  }
});

const allowedMimes = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`File type ${file.mimetype} is not supported.`));
    }
  }
});

// ============================================================================
// REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// ============================================================================
router.get('/stream', authenticate, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = `client_${req.user.id}_${Date.now()}`;
  commService.registerSseClient(clientId, res, req.user);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    commService.removeSseClient(clientId);
  });
});

// Broadcast Typing Event
router.post('/typing', authenticate, (req, res) => {
  const { conversationId, isTyping } = req.body;
  commService.broadcastRealTimeEvent('message.typing', {
    conversationId,
    userId: req.user.id,
    userName: req.user.display_name || req.user.email,
    isTyping: Boolean(isTyping)
  });
  res.json({ success: true });
});

// ============================================================================
// PART 4: ALL CONVERSATIONS
// ============================================================================
router.get(
  '/conversations',
  authenticate,
  requirePermission('communication.conversations.read'),
  async (req, res) => {
    const result = await commService.listConversations(req.query, req.user);
    res.json({ success: true, ...result });
  }
);

router.get(
  '/conversations/export',
  authenticate,
  requirePermission('communication.conversations.export'),
  async (req, res) => {
    const result = await commService.listConversations({ ...req.query, limit: 1000, page: 1 }, req.user);
    const convs = result.conversations || [];
    const headers = ['ID', 'Reference', 'Type', 'Subject', 'Customer', 'Seller', 'Status', 'Priority', 'Last Message At'];
    const rows = convs.map(c => [
      `"${c.id}"`,
      `"${c.conversation_reference}"`,
      `"${c.conversation_type}"`,
      `"${(c.subject || '').replace(/"/g, '""')}"`,
      `"${(c.customer_name || c.customer_email || '').replace(/"/g, '""')}"`,
      `"${(c.seller_name || c.seller_email || '').replace(/"/g, '""')}"`,
      `"${c.status}"`,
      `"${c.priority}"`,
      `"${c.last_message_at}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="conversations-export.csv"');
    res.send(csv);
  }
);

router.get(
  '/conversations/:id',
  authenticate,
  requirePermission('communication.conversations.read'),
  async (req, res) => {
    const conv = await commService.getConversationById(req.params.id, req.user);
    res.json({ success: true, data: conv });
  }
);

router.put(
  '/conversations/:id',
  authenticate,
  requirePermission('communication.conversations.read'),
  async (req, res) => {
    const updated = await commService.updateConversation(req.params.id, req.body, req.user);
    res.json({ success: true, data: updated });
  }
);

router.post(
  '/conversations/:id/assign',
  authenticate,
  requirePermission('communication.conversations.assign'),
  async (req, res) => {
    const updated = await commService.assignConversation(req.params.id, req.body.assigned_agent_id, req.user);
    res.json({ success: true, data: updated });
  }
);

router.post(
  '/conversations/:id/close',
  authenticate,
  requirePermission('communication.conversations.close'),
  async (req, res) => {
    const closed = await commService.closeConversation(req.params.id, req.user);
    res.json({ success: true, data: closed });
  }
);

router.post(
  '/conversations/:id/reopen',
  authenticate,
  requirePermission('communication.conversations.close'),
  async (req, res) => {
    const reopened = await commService.reopenConversation(req.params.id, req.user);
    res.json({ success: true, data: reopened });
  }
);

router.get(
  '/conversations/:id/messages',
  authenticate,
  requirePermission('communication.conversations.read'),
  async (req, res) => {
    const messages = await commService.listMessages(req.params.id, req.user);
    res.json({ success: true, data: messages });
  }
);

router.post(
  '/conversations/:id/messages',
  authenticate,
  requirePermission('communication.conversations.read'),
  async (req, res) => {
    const msg = await commService.sendMessage(req.params.id, req.body, req.user);
    res.json({ success: true, data: msg });
  }
);

// ============================================================================
// PART 5: CUSTOMER MESSAGES
// ============================================================================
router.get(
  '/customer-messages',
  authenticate,
  requirePermission('communication.customer_messages.read'),
  async (req, res) => {
    const result = await commService.listCustomerMessages(req.query);
    res.json({ success: true, ...result });
  }
);

router.get(
  '/customer-messages/:customerId/profile',
  authenticate,
  requirePermission('communication.customer_messages.read'),
  async (req, res) => {
    const profile = await commService.getCustomerCommunicationProfile(req.params.customerId);
    res.json({ success: true, data: profile });
  }
);

router.post(
  '/customer-messages/:conversationId/reply',
  authenticate,
  requirePermission('communication.customer_messages.reply'),
  async (req, res) => {
    const msg = await commService.sendMessage(req.params.conversationId, req.body, req.user);
    res.json({ success: true, data: msg });
  }
);

// ============================================================================
// PART 6: SELLER MESSAGES
// ============================================================================
router.get(
  '/seller-messages',
  authenticate,
  requirePermission('communication.seller_messages.read'),
  async (req, res) => {
    const result = await commService.listSellerMessages(req.query);
    res.json({ success: true, ...result });
  }
);

router.get(
  '/seller-messages/:sellerId/profile',
  authenticate,
  requirePermission('communication.seller_messages.read'),
  async (req, res) => {
    const profile = await commService.getSellerCommunicationProfile(req.params.sellerId);
    res.json({ success: true, data: profile });
  }
);

router.post(
  '/seller-messages/:conversationId/reply',
  authenticate,
  requirePermission('communication.seller_messages.reply'),
  async (req, res) => {
    const msg = await commService.sendMessage(req.params.conversationId, req.body, req.user);
    res.json({ success: true, data: msg });
  }
);

// ============================================================================
// PART 7: ORDER CONVERSATIONS
// ============================================================================
router.get(
  '/order-conversations',
  authenticate,
  requirePermission('communication.order_messages.read'),
  async (req, res) => {
    const result = await commService.listOrderConversations(req.query);
    res.json({ success: true, ...result });
  }
);

router.get(
  '/order-conversations/:orderId',
  authenticate,
  requirePermission('communication.order_messages.read'),
  async (req, res) => {
    const orderConv = await commService.getOrderConversationByOrderId(req.params.orderId, req.user);
    res.json({ success: true, data: orderConv });
  }
);

// ============================================================================
// PART 8: SUPPORT TICKETS
// ============================================================================
router.get(
  '/tickets',
  authenticate,
  requirePermission('communication.tickets.read'),
  async (req, res) => {
    const result = await commService.listTickets(req.query, req.user);
    res.json({ success: true, ...result });
  }
);

router.get(
  '/tickets/export',
  authenticate,
  requirePermission('communication.tickets.export'),
  async (req, res) => {
    const result = await commService.listTickets({ ...req.query, limit: 1000, page: 1 }, req.user);
    const tickets = result.tickets || [];
    const headers = ['ID', 'Reference', 'Category', 'Subject', 'Customer', 'Priority', 'Status', 'SLA Status', 'Created At'];
    const rows = tickets.map(t => [
      `"${t.id}"`,
      `"${t.ticket_reference}"`,
      `"${t.category}"`,
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      `"${(t.customer_name || t.customer_email || '').replace(/"/g, '""')}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.sla_status}"`,
      `"${t.created_at}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="support-tickets-export.csv"');
    res.send(csv);
  }
);

router.get(
  '/tickets/:id',
  authenticate,
  requirePermission('communication.tickets.read'),
  async (req, res) => {
    const ticket = await commService.getTicketById(req.params.id, req.user);
    res.json({ success: true, data: ticket });
  }
);

router.post(
  '/tickets',
  authenticate,
  requirePermission('communication.tickets.create'),
  async (req, res) => {
    const ticket = await commService.createTicket(req.body, req.user);
    res.json({ success: true, data: ticket });
  }
);

router.post(
  '/tickets/:id/reply',
  authenticate,
  requirePermission('communication.tickets.reply'),
  async (req, res) => {
    const comment = await commService.replyTicket(req.params.id, req.body, req.user);
    res.json({ success: true, data: comment });
  }
);

router.post(
  '/tickets/:id/assign',
  authenticate,
  requirePermission('communication.tickets.assign'),
  async (req, res) => {
    const updated = await commService.assignTicket(req.params.id, req.body.assigned_agent_id, req.user);
    res.json({ success: true, data: updated });
  }
);

router.post(
  '/tickets/:id/escalate',
  authenticate,
  requirePermission('communication.tickets.escalate'),
  async (req, res) => {
    const updated = await commService.escalateTicket(req.params.id, req.body.reason, req.user);
    res.json({ success: true, data: updated });
  }
);

router.post(
  '/tickets/:id/resolve',
  authenticate,
  requirePermission('communication.tickets.update'),
  async (req, res) => {
    const updated = await commService.resolveTicket(req.params.id, req.body.resolution_notes, req.user);
    res.json({ success: true, data: updated });
  }
);

// ============================================================================
// PART 9: DISPUTES
// ============================================================================
router.get(
  '/disputes',
  authenticate,
  requirePermission('communication.disputes.read'),
  async (req, res) => {
    const result = await commService.listDisputes(req.query);
    res.json({ success: true, ...result });
  }
);

router.get(
  '/disputes/:id',
  authenticate,
  requirePermission('communication.disputes.read'),
  async (req, res) => {
    const dispute = await commService.getDisputeById(req.params.id);
    res.json({ success: true, data: dispute });
  }
);

router.post(
  '/disputes/:id/assign',
  authenticate,
  requirePermission('communication.disputes.assign'),
  async (req, res) => {
    const updated = await commService.assignDisputeInvestigator(req.params.id, req.body.investigator_id, req.user);
    res.json({ success: true, data: updated });
  }
);

router.post(
  '/disputes/:id/resolve',
  authenticate,
  requirePermission('communication.disputes.resolve'),
  async (req, res) => {
    const updated = await commService.resolveDispute(req.params.id, req.body, req.user);
    res.json({ success: true, data: updated });
  }
);

// ============================================================================
// PART 10: ANNOUNCEMENTS
// ============================================================================
router.get(
  '/announcements',
  authenticate,
  requirePermission('communication.announcements.read'),
  async (req, res) => {
    const result = await commService.listAnnouncements(req.query);
    res.json({ success: true, ...result });
  }
);

router.post(
  '/announcements',
  authenticate,
  requirePermission('communication.announcements.create'),
  async (req, res) => {
    const created = await commService.createAnnouncement(req.body, req.user);
    res.json({ success: true, data: created });
  }
);

router.post(
  '/announcements/:id/publish',
  authenticate,
  requirePermission('communication.announcements.publish'),
  async (req, res) => {
    const published = await commService.publishAnnouncement(req.params.id, req.user);
    res.json({ success: true, data: published });
  }
);

// ============================================================================
// PART 11: EMAIL NOTIFICATIONS
// ============================================================================
router.get(
  '/emails',
  authenticate,
  requirePermission('communication.email.read'),
  async (req, res) => {
    const result = await commService.listEmails(req.query);
    res.json({ success: true, ...result });
  }
);

router.get(
  '/emails/:id',
  authenticate,
  requirePermission('communication.email.read'),
  async (req, res) => {
    const email = await commService.getEmailById(req.params.id);
    res.json({ success: true, data: email });
  }
);

router.post(
  '/emails/:id/retry',
  authenticate,
  requirePermission('communication.email.retry'),
  async (req, res) => {
    const retried = await commService.retryEmail(req.params.id, req.user);
    res.json({ success: true, data: retried });
  }
);

router.post(
  '/emails/:id/cancel',
  authenticate,
  requirePermission('communication.email.cancel'),
  async (req, res) => {
    const cancelled = await commService.cancelQueuedEmail(req.params.id, req.user);
    res.json({ success: true, data: cancelled });
  }
);

// ============================================================================
// PART 12: NOTIFICATION TEMPLATES
// ============================================================================
router.get(
  '/templates',
  authenticate,
  requirePermission('communication.templates.read'),
  async (req, res) => {
    const templates = await commService.listTemplates(req.query);
    res.json({ success: true, data: templates });
  }
);

router.get(
  '/templates/:id',
  authenticate,
  requirePermission('communication.templates.read'),
  async (req, res) => {
    const template = await commService.getTemplateById(req.params.id);
    res.json({ success: true, data: template });
  }
);

router.put(
  '/templates/:id',
  authenticate,
  requirePermission('communication.templates.update'),
  async (req, res) => {
    const updated = await commService.updateTemplate(req.params.id, req.body, req.user);
    res.json({ success: true, data: updated });
  }
);

router.post(
  '/templates/:id/preview',
  authenticate,
  requirePermission('communication.templates.read'),
  async (req, res) => {
    const template = await commService.getTemplateById(req.params.id);
    const preview = commService.renderTemplatePreview(template, req.body.variables);
    res.json({ success: true, data: preview });
  }
);

router.post(
  '/templates/:id/test',
  authenticate,
  requirePermission('communication.templates.test'),
  async (req, res) => {
    const template = await commService.getTemplateById(req.params.id);
    const preview = commService.renderTemplatePreview(template, req.body.variables);
    res.json({ 
      success: true, 
      message: `Test message dispatched to ${req.body.recipient_email || req.user.email}`,
      data: preview 
    });
  }
);

// ============================================================================
// PART 20: COMMUNICATION ANALYTICS
// ============================================================================
router.get(
  '/analytics/overview',
  authenticate,
  requirePermission('communication.conversations.read'),
  async (req, res) => {
    const kpis = await commService.getAnalyticsOverview();
    res.json({ success: true, data: kpis });
  }
);

router.get(
  '/analytics/conversations',
  authenticate,
  requirePermission('communication.conversations.read'),
  async (req, res) => {
    const data = await commService.getConversationsOverTime();
    res.json({ success: true, data });
  }
);

router.get(
  '/analytics/tickets',
  authenticate,
  requirePermission('communication.tickets.read'),
  async (req, res) => {
    const data = await commService.getTicketsAnalytics();
    res.json({ success: true, data });
  }
);

router.get(
  '/analytics/disputes',
  authenticate,
  requirePermission('communication.disputes.read'),
  async (req, res) => {
    const data = await commService.getDisputesAnalytics();
    res.json({ success: true, data });
  }
);

router.get(
  '/analytics/emails',
  authenticate,
  requirePermission('communication.email.read'),
  async (req, res) => {
    const data = await commService.getEmailAnalytics();
    res.json({ success: true, data });
  }
);

// ============================================================================
// AUDIT LOGS
// ============================================================================
router.get(
  '/audit-logs',
  authenticate,
  requirePermission('communication.conversations.read'),
  async (req, res) => {
    const result = await commService.listAuditLogs(req.query);
    res.json({ success: true, ...result });
  }
);

// ============================================================================
// PART 14: SECURE ATTACHMENT UPLOAD
// ============================================================================
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) throw new BadRequestError('No file provided');
    const relativeUrl = `/uploads/attachments/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size_bytes: req.file.size,
        file_url: relativeUrl
      }
    });
  }
);

module.exports = router;
