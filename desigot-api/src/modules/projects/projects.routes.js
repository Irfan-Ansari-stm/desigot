'use strict';
const router = require('express').Router();
const { body, param } = require('express-validator');
const svc    = require('./projects.service');
const { authenticate, requireAdmin, requireSeller } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { uuidParam } = require('../../shared/validators/common');
const { fileUpload } = require('../../middleware/upload');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// ── Projects ───────────────────────────────────────────────────────────────────
router.post('/',
  authenticate,
  body('order_id').isUUID(),
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('description').notEmpty(),
  body('revision_limit').optional().isInt({ min: 0, max: 10 }),
  validate,
  async (req, res) => successResponse(res, await svc.createProject(req.body.order_id, req.user.id, req.body), 201)
);

router.get('/me', authenticate, async (req, res) => {
  const role = req.query.role === 'seller' ? 'seller' : 'buyer';
  const r = await svc.listProjects(req.user.id, role, req.query, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.get('/:id',    authenticate, uuidParam(), validate, async (req, res) => successResponse(res, await svc.getProject(req.params.id, req.user.id, req.user.role === 'admin')));
router.patch('/:id/status', authenticate, uuidParam(), body('status').notEmpty(), validate,
  async (req, res) => successResponse(res, await svc.updateProjectStatus(req.params.id, req.user.id, req.body.status, req.user.role === 'admin'))
);

// ── Milestones ─────────────────────────────────────────────────────────────────
router.post('/:id/milestones',
  authenticate, requireSeller,
  uuidParam(),
  body('title').notEmpty(),
  body('amount_cents').isInt({ min: 1 }),
  validate,
  async (req, res) => successResponse(res, await svc.createMilestone(req.params.id, req.user.id, req.body), 201)
);

router.patch('/:id/milestones/:milestoneId',
  authenticate, uuidParam(), uuidParam('milestoneId'), validate,
  async (req, res) => successResponse(res, await svc.updateMilestone(req.params.milestoneId, req.params.id, req.user.id, req.body, req.user.role === 'admin'))
);

router.post('/:id/milestones/:milestoneId/submit',
  authenticate, requireSeller, uuidParam(), uuidParam('milestoneId'), validate,
  async (req, res) => successResponse(res, await svc.submitMilestone(req.params.milestoneId, req.user.id))
);

router.post('/:id/milestones/:milestoneId/approve',
  authenticate, uuidParam(), uuidParam('milestoneId'), validate,
  async (req, res) => successResponse(res, await svc.approveMilestone(req.params.milestoneId, req.user.id))
);

router.delete('/:id/milestones/:milestoneId',
  authenticate, requireSeller, uuidParam(), uuidParam('milestoneId'), validate,
  async (req, res) => successResponse(res, await svc.deleteMilestone(req.params.milestoneId, req.user.id))
);

// ── Files ──────────────────────────────────────────────────────────────────────
router.post('/:id/files',
  authenticate, uuidParam(), validate,
  fileUpload.single('file'),
  async (req, res) => successResponse(res, await svc.uploadProjectFile(req.params.id, req.user.id, req.file, req.body.milestone_id, req.body.version_notes), 201)
);

router.get('/:id/files', authenticate, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.listProjectFiles(req.params.id, req.user.id, req.user.role === 'admin'))
);

router.get('/:id/files/:fileId/download', authenticate, uuidParam(), uuidParam('fileId'), validate,
  async (req, res) => successResponse(res, await svc.getFileDownloadUrl(req.params.fileId, req.user.id, req.user.role === 'admin'))
);

// ── Messages ───────────────────────────────────────────────────────────────────
router.get('/:id/messages', authenticate, uuidParam(), validate, async (req, res) => {
  const r = await svc.getMessages(req.params.id, req.user.id, req.user.role === 'admin', req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.post('/:id/messages',
  authenticate, uuidParam(),
  body('content').if(body('message_type').not().equals('file')).notEmpty(),
  body('message_type').optional().isIn(['text', 'file', 'system_event', 'milestone_update']),
  validate,
  async (req, res) => successResponse(res, await svc.sendMessage(req.params.id, req.user.id, req.body.content, req.body.message_type), 201)
);

router.post('/:id/messages/:messageId/pin', authenticate, uuidParam(), uuidParam('messageId'), validate,
  async (req, res) => successResponse(res, await svc.pinMessage(req.params.messageId, req.params.id, req.user.id))
);

module.exports = router;
