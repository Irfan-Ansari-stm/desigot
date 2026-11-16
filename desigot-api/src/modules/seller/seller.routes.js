'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { primaryPool, queryRead } = require('../../db/pool');
const { successResponse } = require('../../shared/utils');
const AppError = require('../../shared/errors/AppError');

// 1. Get Onboarding Status & Active Application
router.get('/onboarding', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check user record
    const userRes = await queryRead(
      `SELECT id, role, seller_verified, seller_type FROM users WHERE id = $1`,
      [userId]
    );
    const user = userRes.rows[0];
    const isApprovedSeller = user && (user.role === 'seller' || user.seller_verified === true);

    // Get application if any
    const appRes = await queryRead(
      `SELECT * FROM seller_applications WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    const application = appRes.rows[0] || null;

    return successResponse(res, {
      user_id: userId,
      is_seller: isApprovedSeller,
      is_approved: isApprovedSeller,
      status: isApprovedSeller ? 'approved' : (application?.status || 'not_started'),
      application,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Create or Get Draft Application
router.post('/applications', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      email,
      phone,
      business_name,
      business_type,
      country,
      address,
      website,
      avatar_url,
      cover_image_url,
      bio,
      skills,
      years_of_experience,
      portfolio_url,
    } = req.body;

    const existingRes = await queryRead(
      `SELECT * FROM seller_applications WHERE user_id = $1`,
      [userId]
    );

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      // Update existing draft
      const updateRes = await primaryPool.query(
        `UPDATE seller_applications SET
          full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          business_name = COALESCE($4, business_name),
          business_type = COALESCE($5, business_type),
          country = COALESCE($6, country),
          address = COALESCE($7, address),
          website = COALESCE($8, website),
          avatar_url = COALESCE($9, avatar_url),
          cover_image_url = COALESCE($10, cover_image_url),
          bio = COALESCE($11, bio),
          skills = COALESCE($12, skills),
          years_of_experience = COALESCE($13, years_of_experience),
          portfolio_url = COALESCE($14, portfolio_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING *`,
        [
          full_name,
          email,
          phone,
          business_name,
          business_type,
          country,
          address,
          website,
          avatar_url,
          cover_image_url,
          bio,
          skills,
          years_of_experience,
          portfolio_url,
          existing.id,
        ]
      );
      return successResponse(res, updateRes.rows[0]);
    }

    const insertRes = await primaryPool.query(
      `INSERT INTO seller_applications (
        user_id, full_name, email, phone, business_name, business_type,
        country, address, website, avatar_url, cover_image_url, bio,
        skills, years_of_experience, portfolio_url, status, current_step
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'draft', 1)
      RETURNING *`,
      [
        userId,
        full_name || req.user.display_name,
        email || req.user.email,
        phone || null,
        business_name || null,
        business_type || 'individual',
        country || null,
        address || null,
        website || null,
        avatar_url || req.user.avatar_url || null,
        cover_image_url || null,
        bio || null,
        skills || [],
        years_of_experience || 1,
        portfolio_url || null,
      ]
    );

    return successResponse(res, insertRes.rows[0], 201);
  } catch (err) {
    next(err);
  }
});

// 3. Patch Application by ID (multi-step progress)
router.patch('/applications/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const appRes = await queryRead(
      `SELECT * FROM seller_applications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (appRes.rows.length === 0) {
      throw new AppError('Seller application not found or unauthorized', 404);
    }

    const b = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      'full_name', 'email', 'phone', 'business_name', 'business_type',
      'country', 'address', 'website', 'avatar_url', 'cover_image_url',
      'bio', 'skills', 'years_of_experience', 'portfolio_url',
      'id_document_type', 'id_document_url', 'business_document_url',
      'verification_consent', 'agreed_terms', 'agreed_commission',
      'agreed_guidelines', 'current_step'
    ];

    for (const f of allowedFields) {
      if (b[f] !== undefined) {
        fields.push(`${f} = $${idx++}`);
        values.push(b[f]);
      }
    }

    if (fields.length === 0) {
      return successResponse(res, appRes.rows[0]);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const updateQuery = `
      UPDATE seller_applications
      SET ${fields.join(', ')}
      WHERE id = $${idx++} AND user_id = $${idx++}
      RETURNING *
    `;

    const updated = await primaryPool.query(updateQuery, values);
    return successResponse(res, updated.rows[0]);
  } catch (err) {
    next(err);
  }
});

// 4. Submit Application for Administrator Review
router.post('/applications/:id/submit', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const appRes = await queryRead(
      `SELECT * FROM seller_applications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (appRes.rows.length === 0) {
      throw new AppError('Seller application not found or unauthorized', 404);
    }

    const app = appRes.rows[0];

    // Validate agreements
    const agreedTerms = req.body.agreed_terms ?? app.agreed_terms;
    const agreedCommission = req.body.agreed_commission ?? app.agreed_commission;
    const agreedGuidelines = req.body.agreed_guidelines ?? app.agreed_guidelines;

    if (!agreedTerms || !agreedCommission || !agreedGuidelines) {
      throw new AppError('All marketplace agreements, seller terms, and commission policies must be accepted prior to submission.', 400);
    }

    const updatedRes = await primaryPool.query(
      `UPDATE seller_applications SET
        status = 'pending',
        agreed_terms = true,
        agreed_commission = true,
        agreed_guidelines = true,
        current_step = 6,
        submitted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
      [id, userId]
    );

    // Create user notification
    try {
      await primaryPool.query(
        `INSERT INTO notifications (user_id, type, title, body, action_url, is_read, created_at)
         VALUES ($1, 'system_alert', 'Seller Application Submitted', 'Your seller application has been received and is currently under administrative review. We will notify you once approved.', '/seller/onboarding', false, CURRENT_TIMESTAMP)`,
        [userId]
      );
    } catch (_) {}

    return successResponse(res, {
      message: 'Seller application submitted successfully and is awaiting administrator verification.',
      application: updatedRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
