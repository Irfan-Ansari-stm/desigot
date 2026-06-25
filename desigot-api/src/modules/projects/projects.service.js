'use strict';
const { query, queryRead, withTransaction } = require('../../db/pool');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../shared/errors/AppError');
const { paginate } = require('../../shared/utils');
const crypto = require('crypto');

// ── Create project (triggered after service order completes) ──────────────────
const createProject = async (orderId, buyerId, data) => {
  const { rows: order } = await query(
    `SELECT * FROM orders WHERE id=$1 AND buyer_id=$2 AND listing_type='service' AND status='active'`,
    [orderId, buyerId]
  );
  if (!order.length) throw new NotFoundError('Service order');

  const { rows } = await query(
    `INSERT INTO projects
       (order_id, buyer_id, seller_id, title, description, deadline,
        revision_limit, total_budget_cents)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [orderId, buyerId, order[0].seller_id,
     data.title, data.description, data.deadline || null,
     data.revision_limit || 3, order[0].amount_cents]
  );
  return rows[0];
};

// ── Get project ────────────────────────────────────────────────────────────────
const getProject = async (projectId, userId, isAdmin = false) => {
  const { rows } = await queryRead(
    `SELECT p.*,
            buyer.display_name  AS buyer_name,  buyer.avatar_url  AS buyer_avatar,
            seller.display_name AS seller_name, seller.avatar_url AS seller_avatar
       FROM projects p
       JOIN users buyer  ON buyer.id=p.buyer_id
       JOIN users seller ON seller.id=p.seller_id
      WHERE p.id=$1 AND p.deleted_at IS NULL`,
    [projectId]
  );
  if (!rows.length) throw new NotFoundError('Project');
  const project = rows[0];
  if (!isAdmin && project.buyer_id !== userId && project.seller_id !== userId) {
    throw new ForbiddenError('Access denied');
  }

  // Load milestones
  const { rows: milestones } = await queryRead(
    `SELECT * FROM project_milestones WHERE project_id=$1 ORDER BY sort_order`, [projectId]
  );
  project.milestones = milestones;

  // Load recent files
  const { rows: files } = await queryRead(
    `SELECT id, file_name, file_size_bytes, mime_type, version_label, created_at
       FROM project_files WHERE project_id=$1 ORDER BY created_at DESC LIMIT 20`,
    [projectId]
  );
  project.files = files;

  return project;
};

// ── List projects ──────────────────────────────────────────────────────────────
const listProjects = async (userId, role, filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { status } = filters;
  const col = role === 'seller' ? 'seller_id' : 'buyer_id';
  const { rows } = await queryRead(
    `SELECT p.id, p.title, p.status, p.deadline, p.total_budget_cents,
            p.revisions_used, p.revision_limit, p.created_at,
            u.display_name AS counterpart_name
       FROM projects p
       JOIN users u ON u.id=p.${role === 'seller' ? 'buyer_id' : 'seller_id'}
      WHERE p.${col}=$1 AND p.deleted_at IS NULL
        AND ($2::TEXT IS NULL OR p.status=$2)
      ORDER BY p.updated_at DESC LIMIT $3 OFFSET $4`,
    [userId, status || null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM projects WHERE ${col}=$1 AND deleted_at IS NULL AND ($2::TEXT IS NULL OR status=$2)`,
    [userId, status || null]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Update project status ──────────────────────────────────────────────────────
const updateProjectStatus = async (projectId, userId, newStatus, isAdmin = false) => {
  const { rows } = await query('SELECT * FROM projects WHERE id=$1 AND deleted_at IS NULL', [projectId]);
  if (!rows.length) throw new NotFoundError('Project');
  const project = rows[0];

  // Validate state transitions
  const transitions = {
    buyer: { 'briefing': ['cancelled'], 'active': ['in_revision', 'complete', 'disputed'], 'in_revision': ['complete', 'disputed'] },
    seller: { 'briefing': ['proposal'], 'proposal': ['active', 'cancelled'], 'active': ['in_revision'], 'in_revision': ['active'] },
    admin: null,
  };

  if (!isAdmin) {
    const role = project.buyer_id === userId ? 'buyer' : project.seller_id === userId ? 'seller' : null;
    if (!role) throw new ForbiddenError('Access denied');
    const allowed = transitions[role]?.[project.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(`Cannot transition from '${project.status}' to '${newStatus}'`);
    }
  }

  const extra = newStatus === 'complete' ? ', completed_at=NOW()' : '';
  const { rows: updated } = await query(
    `UPDATE projects SET status=$1, updated_at=NOW()${extra} WHERE id=$2 RETURNING *`,
    [newStatus, projectId]
  );
  return updated[0];
};

// ── Milestones ─────────────────────────────────────────────────────────────────
const createMilestone = async (projectId, sellerId, data) => {
  const { rows: proj } = await query('SELECT seller_id FROM projects WHERE id=$1', [projectId]);
  if (!proj.length) throw new NotFoundError('Project');
  if (proj[0].seller_id !== sellerId) throw new ForbiddenError('Not your project');

  const { rows } = await query(
    `INSERT INTO project_milestones (project_id, title, description, amount_cents, due_date, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [projectId, data.title, data.description || null, data.amount_cents, data.due_date || null, data.sort_order || 0]
  );
  return rows[0];
};

const updateMilestone = async (milestoneId, projectId, userId, data, isAdmin = false) => {
  const { rows } = await queryRead(
    `SELECT m.*, p.buyer_id, p.seller_id FROM project_milestones m
       JOIN projects p ON p.id=m.project_id WHERE m.id=$1 AND m.project_id=$2`,
    [milestoneId, projectId]
  );
  if (!rows.length) throw new NotFoundError('Milestone');
  const m = rows[0];
  if (!isAdmin && m.buyer_id !== userId && m.seller_id !== userId) throw new ForbiddenError('Access denied');

  const { rows: updated } = await query(
    `UPDATE project_milestones
        SET title=COALESCE($1,title), description=COALESCE($2,description),
            amount_cents=COALESCE($3,amount_cents), due_date=COALESCE($4,due_date),
            updated_at=NOW()
      WHERE id=$5 RETURNING *`,
    [data.title, data.description, data.amount_cents, data.due_date, milestoneId]
  );
  return updated[0];
};

const submitMilestone = async (milestoneId, sellerId) => {
  const { rows } = await queryRead(
    `SELECT m.*, p.seller_id FROM project_milestones m
       JOIN projects p ON p.id=m.project_id WHERE m.id=$1`,
    [milestoneId]
  );
  if (!rows.length) throw new NotFoundError('Milestone');
  if (rows[0].seller_id !== sellerId) throw new ForbiddenError('Not your project');
  if (rows[0].status !== 'in_progress') throw new ValidationError('Milestone must be in_progress to submit');

  const { rows: updated } = await query(
    `UPDATE project_milestones SET status='submitted', submitted_at=NOW(), updated_at=NOW()
      WHERE id=$1 RETURNING *`,
    [milestoneId]
  );
  return updated[0];
};

const approveMilestone = async (milestoneId, buyerId) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT m.*, p.buyer_id, p.seller_id FROM project_milestones m
         JOIN projects p ON p.id=m.project_id WHERE m.id=$1`,
      [milestoneId]
    );
    if (!rows.length) throw new NotFoundError('Milestone');
    if (rows[0].buyer_id !== buyerId) throw new ForbiddenError('Only buyer can approve milestones');
    if (rows[0].status !== 'submitted') throw new ValidationError('Milestone must be submitted to approve');

    await client.query(
      `UPDATE project_milestones SET status='approved', approved_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [milestoneId]
    );

    // Release milestone payment to seller balance
    await client.query(
      `UPDATE seller_balances
         SET available_cents=available_cents+$1, updated_at=NOW()
       WHERE seller_id=$2`,
      [rows[0].amount_cents, rows[0].seller_id]
    );

    // Mark milestone as paid
    await client.query(
      `UPDATE project_milestones SET status='paid', paid_at=NOW() WHERE id=$1`, [milestoneId]
    );

    return rows[0];
  });
};

const deleteMilestone = async (milestoneId, sellerId) => {
  const { rows } = await queryRead(
    `SELECT m.*, p.seller_id FROM project_milestones m
       JOIN projects p ON p.id=m.project_id WHERE m.id=$1`,
    [milestoneId]
  );
  if (!rows.length) throw new NotFoundError('Milestone');
  if (rows[0].seller_id !== sellerId) throw new ForbiddenError('Not your project');
  if (!['not_started'].includes(rows[0].status)) throw new ValidationError('Cannot delete started milestone');
  await query('DELETE FROM project_milestones WHERE id=$1', [milestoneId]);
  return { message: 'Milestone deleted' };
};

// ── Files ──────────────────────────────────────────────────────────────────────
const uploadProjectFile = async (projectId, uploadedById, file, milestoneId, versionNotes) => {
  const { rows: proj } = await query(
    'SELECT buyer_id, seller_id FROM projects WHERE id=$1 AND deleted_at IS NULL', [projectId]
  );
  if (!proj.length) throw new NotFoundError('Project');
  if (proj[0].buyer_id !== uploadedById && proj[0].seller_id !== uploadedById) {
    throw new ForbiddenError('Not your project');
  }

  const storageKey = `projects/${projectId}/${crypto.randomUUID()}-${file.originalname}`;
  // In production: upload file.buffer to S3/R2

  // Get next version number
  const { rows: lastVersion } = await queryRead(
    `SELECT version_label FROM project_files WHERE project_id=$1 ORDER BY created_at DESC LIMIT 1`,
    [projectId]
  );
  const nextVersion = lastVersion.length
    ? `v${parseInt(lastVersion[0].version_label.slice(1)) + 1}`
    : 'v1';

  const { rows } = await query(
    `INSERT INTO project_files
       (project_id, milestone_id, uploaded_by_id, storage_key, file_name,
        file_size_bytes, mime_type, version_label, version_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [projectId, milestoneId || null, uploadedById, storageKey, file.originalname,
     file.size, file.mimetype, nextVersion, versionNotes || null]
  );
  return rows[0];
};

const listProjectFiles = async (projectId, userId, isAdmin = false) => {
  const { rows: proj } = await queryRead(
    'SELECT buyer_id, seller_id FROM projects WHERE id=$1', [projectId]
  );
  if (!proj.length) throw new NotFoundError('Project');
  if (!isAdmin && proj[0].buyer_id !== userId && proj[0].seller_id !== userId) {
    throw new ForbiddenError('Access denied');
  }

  const { rows } = await queryRead(
    `SELECT pf.*, u.display_name AS uploaded_by_name
       FROM project_files pf JOIN users u ON u.id=pf.uploaded_by_id
      WHERE pf.project_id=$1 ORDER BY pf.created_at DESC`,
    [projectId]
  );
  return rows;
};

const getFileDownloadUrl = async (fileId, userId, isAdmin = false) => {
  const { rows } = await queryRead(
    `SELECT pf.*, p.buyer_id, p.seller_id FROM project_files pf
       JOIN projects p ON p.id=pf.project_id WHERE pf.id=$1`,
    [fileId]
  );
  if (!rows.length) throw new NotFoundError('File');
  if (!isAdmin && rows[0].buyer_id !== userId && rows[0].seller_id !== userId) {
    throw new ForbiddenError('Access denied');
  }
  // In production: generate S3 presigned URL
  const signedUrl = `https://storage.desigot.com/${rows[0].storage_key}?token=SIGNED`;
  return { url: signedUrl, fileName: rows[0].file_name };
};

// ── Messages ───────────────────────────────────────────────────────────────────
const sendMessage = async (projectId, senderId, content, messageType = 'text', fileData = null) => {
  const { rows: proj } = await query(
    'SELECT buyer_id, seller_id FROM projects WHERE id=$1 AND deleted_at IS NULL', [projectId]
  );
  if (!proj.length) throw new NotFoundError('Project');
  const isBuyer  = proj[0].buyer_id  === senderId;
  const isSeller = proj[0].seller_id === senderId;
  if (!isBuyer && !isSeller) throw new ForbiddenError('Not your project');

  const { rows } = await query(
    `INSERT INTO project_messages
       (project_id, sender_id, message_type, content, file_storage_key, file_name, file_size_bytes,
        is_read_buyer, is_read_seller)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      projectId, senderId, messageType,
      content || null,
      fileData?.storageKey || null,
      fileData?.fileName || null,
      fileData?.size || null,
      isBuyer,    // sender already "read" their own message
      isSeller,
    ]
  );
  return rows[0];
};

const getMessages = async (projectId, userId, isAdmin = false, pageOpts = {}) => {
  const { rows: proj } = await queryRead(
    'SELECT buyer_id, seller_id FROM projects WHERE id=$1', [projectId]
  );
  if (!proj.length) throw new NotFoundError('Project');
  if (!isAdmin && proj[0].buyer_id !== userId && proj[0].seller_id !== userId) {
    throw new ForbiddenError('Access denied');
  }

  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT pm.*, u.display_name AS sender_name, u.avatar_url AS sender_avatar
       FROM project_messages pm JOIN users u ON u.id=pm.sender_id
      WHERE pm.project_id=$1
      ORDER BY pm.created_at DESC LIMIT $2 OFFSET $3`,
    [projectId, limit, offset]
  );

  // Mark messages as read
  const isBuyer = proj[0].buyer_id === userId;
  query(
    `UPDATE project_messages
        SET ${isBuyer ? 'is_read_buyer' : 'is_read_seller'}=TRUE
      WHERE project_id=$1 AND sender_id<>$2`,
    [projectId, userId]
  ).catch(() => {});

  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM project_messages WHERE project_id=$1`, [projectId]
  );
  return { data: rows.reverse(), total: parseInt(cnt[0].count), page, limit };
};

const pinMessage = async (messageId, projectId, userId) => {
  const { rows } = await queryRead(
    `SELECT pm.*, p.buyer_id, p.seller_id FROM project_messages pm
       JOIN projects p ON p.id=pm.project_id
      WHERE pm.id=$1 AND pm.project_id=$2`,
    [messageId, projectId]
  );
  if (!rows.length) throw new NotFoundError('Message');
  if (rows[0].buyer_id !== userId && rows[0].seller_id !== userId) throw new ForbiddenError('Access denied');
  await query('UPDATE project_messages SET is_pinned=NOT is_pinned WHERE id=$1', [messageId]);
  return { message: 'Toggled pin' };
};

module.exports = {
  createProject, getProject, listProjects, updateProjectStatus,
  createMilestone, updateMilestone, submitMilestone, approveMilestone, deleteMilestone,
  uploadProjectFile, listProjectFiles, getFileDownloadUrl,
  sendMessage, getMessages, pinMessage,
};
