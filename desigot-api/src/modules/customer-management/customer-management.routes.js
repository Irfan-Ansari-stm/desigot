'use strict';
const express = require('express');
const router = express.Router();
const customerService = require('./customer-management.service');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');

// 1. Stats Overview
router.get(
  '/stats',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const stats = await customerService.getCustomerStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Export Customers to CSV
router.get(
  '/export',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const result = await customerService.listCustomers({ ...req.query, limit: 1000, page: 1 });
      const customers = result.customers || [];
      
      const headers = ['ID', 'Name', 'Email', 'Status', 'Total Orders', 'Total Spent', 'Created At'];
      const rows = customers.map(c => [
        `"${c.id}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${c.account_status}"`,
        c.total_orders || 0,
        c.total_spent || 0,
        `"${c.created_at}"`
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customers-export.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);

// 3. Active Customers shortcut
router.get(
  '/active',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const data = await customerService.listCustomers({ ...req.query, status: 'active' });
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 4. Inactive Customers shortcut
router.get(
  '/inactive',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const data = await customerService.listCustomers({ ...req.query, status: 'inactive' });
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 5. Customer Tags list
router.get(
  '/tags',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const tags = await customerService.listAllTags();
      res.json({ success: true, data: tags });
    } catch (err) {
      next(err);
    }
  }
);

// 6. Global Orders across customers
router.get(
  '/orders',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const data = await customerService.listCustomerOrders(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 7. Global Bookings across customers
router.get(
  '/bookings',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const data = await customerService.listCustomerBookings(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 8. Update Booking status
router.post(
  '/bookings/:id/status',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const result = await customerService.updateBookingStatus(
        req.params.id,
        req.body.status,
        req.body.notes,
        req.user?.id,
        req
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 9. Global Reviews across customers
router.get(
  '/reviews',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const data = await customerService.listCustomerReviews(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 10. Moderate Review
router.post(
  '/reviews/:id/moderate',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const result = await customerService.moderateReview(
        req.params.id,
        req.body.status,
        req.body.notes,
        req.user?.id,
        req
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 11. Customer Complaints / Tickets
router.get(
  '/complaints',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const data = await customerService.listComplaints(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/complaints/:id',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const complaint = await customerService.getComplaintById(req.params.id);
      res.json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/complaints/:id/messages',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const message = await customerService.addComplaintMessage(
        req.params.id,
        req.body.message,
        req.body.is_internal_note || false,
        req.user?.id,
        req.user?.role,
        req
      );
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/complaints/:id/status',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const complaint = await customerService.updateComplaintStatus(
        req.params.id,
        req.body.status,
        req.body.resolution_details,
        req.user?.id,
        req
      );
      res.json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/complaints/:id/assign',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const complaint = await customerService.assignComplaint(
        req.params.id,
        req.body.agent_id,
        req.user?.id,
        req
      );
      res.json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }
);

// 12. Global Customer Activity Log
router.get(
  '/activity',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const data = await customerService.listCustomerActivity(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 13. Customer CRUD & Specific actions
router.get(
  '/',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const data = await customerService.listCustomers(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('customers.create'),
  async (req, res, next) => {
    try {
      const customer = await customerService.createCustomer(req.body, req.user?.id, req);
      res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('customers.read'),
  async (req, res, next) => {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body, req.user?.id, req);
      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/status',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const result = await customerService.setAccountStatus(
        req.params.id,
        req.body.status,
        req.body.reason,
        req.user?.id,
        req
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/notes',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const note = await customerService.addInternalNote(
        req.params.id,
        req.body.note,
        req.user?.id,
        req
      );
      res.status(201).json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id/notes/:noteId',
  authenticate,
  requirePermission('customers.delete'),
  async (req, res, next) => {
    try {
      const result = await customerService.deleteInternalNote(
        req.params.noteId,
        req.user?.id,
        req
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/addresses',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const address = await customerService.addAddress(
        req.params.id,
        req.body,
        req.user?.id,
        req
      );
      res.status(201).json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id/addresses/:addressId',
  authenticate,
  requirePermission('customers.delete'),
  async (req, res, next) => {
    try {
      const result = await customerService.deleteAddress(
        req.params.addressId,
        req.user?.id,
        req
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/tags',
  authenticate,
  requirePermission('customers.update'),
  async (req, res, next) => {
    try {
      const result = await customerService.assignTag(
        req.params.id,
        req.body.tag_id,
        req.user?.id,
        req
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id/tags/:tagId',
  authenticate,
  requirePermission('customers.delete'),
  async (req, res, next) => {
    try {
      const result = await customerService.removeTag(
        req.params.id,
        req.params.tagId,
        req.user?.id,
        req
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
