'use strict';

const express = require('express');
const router = express.Router();
const ordersService = require('./orders-bookings.service');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');

// 1. Stats & KPIs Overview
router.get(
  '/stats',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const stats = await ordersService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Export Orders to CSV
router.get(
  '/export',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const result = await ordersService.listOrders({ ...req.query, limit: 2000, page: 1 });
      const orders = result.orders || [];

      const headers = ['Order ID', 'Type', 'Listing Title', 'Customer Name', 'Customer Email', 'Seller Name', 'Amount (Cents)', 'Status', 'Date'];
      const rows = orders.map(o => [
        `"${o.id}"`,
        `"${o.listing_type}"`,
        `"${(o.listing_title || '').replace(/"/g, '""')}"`,
        `"${(o.customer_name || '').replace(/"/g, '""')}"`,
        `"${(o.customer_email || '').replace(/"/g, '""')}"`,
        `"${(o.seller_name || '').replace(/"/g, '""')}"`,
        o.amount_cents || 0,
        `"${o.status}"`,
        `"${o.created_at}"`
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);

// 3. Digital Product Orders
router.get(
  '/digital',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listOrders({ ...req.query, order_type: 'asset' });
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 4. Service Orders
router.get(
  '/services',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listOrders({ ...req.query, order_type: 'service' });
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 5. Pending Confirmation
router.get(
  '/pending-confirmation',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listOrders({ ...req.query, status: 'pending' });
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 6. In Progress Orders
router.get(
  '/in-progress',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listOrders({ ...req.query, status: 'active' });
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 7. Completed Orders
router.get(
  '/completed',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listOrders({ ...req.query, status: 'complete' });
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 8. Cancelled Orders
router.get(
  '/cancelled',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listOrders({ ...req.query, status: 'cancelled' });
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 9. Disputed Orders
router.get(
  '/disputes',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listDisputes(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/disputes/:id/resolve',
  authenticate,
  requirePermission('orders.update'),
  async (req, res, next) => {
    try {
      const result = await ordersService.resolveDispute(req.params.id, req.body, req.user?.id, req);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 10. Bookings Directory
router.get(
  '/bookings',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listBookings(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/bookings/new',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listBookings({ ...req.query, booking_status: 'requested' });
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/bookings/:id/confirm',
  authenticate,
  requirePermission('orders.update'),
  async (req, res, next) => {
    try {
      const result = await ordersService.updateBookingStatus(req.params.id, 'confirmed', req.body.notes, req.user?.id, req);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/bookings/:id/reschedule',
  authenticate,
  requirePermission('orders.update'),
  async (req, res, next) => {
    try {
      const result = await ordersService.rescheduleBooking(
        req.params.id,
        req.body.appointment_date,
        req.body.start_time,
        req.body.end_time,
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
  '/bookings/:id/cancel',
  authenticate,
  requirePermission('orders.update'),
  async (req, res, next) => {
    try {
      const result = await ordersService.updateBookingStatus(req.params.id, 'cancelled', req.body.notes || req.body.reason, req.user?.id, req);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 11. Active Projects
router.get(
  '/projects/active',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listActiveProjects(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 12. Submitted Deliveries
router.get(
  '/deliveries',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listDeliveries(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/deliveries/:id/review',
  authenticate,
  requirePermission('orders.update'),
  async (req, res, next) => {
    try {
      const result = await ordersService.reviewDelivery(req.params.id, req.body.review_status, req.body.notes, req.user?.id, req);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 13. Revision Requests
router.get(
  '/revisions',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listRevisions(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 14. Custom Quotes
router.get(
  '/quotes',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listCustomQuotes(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/quotes/:id/convert',
  authenticate,
  requirePermission('orders.create'),
  async (req, res, next) => {
    try {
      const order = await ordersService.convertQuoteToOrder(req.params.id, req.user?.id, req);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
);

// 15. Order History Audit Trail
router.get(
  '/history',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listOrderHistory(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 16. Master Orders List & Specific Order Workspace
router.get(
  '/',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const data = await ordersService.listOrders(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('orders.read'),
  async (req, res, next) => {
    try {
      const order = await ordersService.getOrderById(req.params.id);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/confirm',
  authenticate,
  requirePermission('orders.update'),
  async (req, res, next) => {
    try {
      const order = await ordersService.updateOrderStatus(req.params.id, 'active', req.body.reason || 'Order confirmed by administrator', req.user?.id, req);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/cancel',
  authenticate,
  requirePermission('orders.cancel'),
  async (req, res, next) => {
    try {
      const order = await ordersService.cancelOrder(
        req.params.id,
        req.body.reason_category,
        req.body.reason_details,
        req.body.refund_eligible || false,
        req.user?.id,
        req
      );
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/assign',
  authenticate,
  requirePermission('orders.assign'),
  async (req, res, next) => {
    try {
      const assignment = await ordersService.assignOrder(
        req.params.id,
        req.body.staff_id,
        req.body.role_type,
        req.body.notes,
        req.user?.id,
        req
      );
      res.json({ success: true, data: assignment });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/notes',
  authenticate,
  requirePermission('orders.update'),
  async (req, res, next) => {
    try {
      const note = await ordersService.addOrderInternalNote(req.params.id, req.body.note, req.user?.id, req);
      res.status(201).json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
