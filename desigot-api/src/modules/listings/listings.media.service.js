'use strict';
const path   = require('path');
const crypto = require('crypto');
const { query, queryRead } = require('../../db/pool');
const { NotFoundError, ForbiddenError } = require('../../shared/errors/AppError');
const config = require('../../config');

// Simulated S3 upload (replace with AWS SDK in production)
const uploadToStorage = async (buffer, mimeType, folder) => {
  const ext = mimeType.split('/')[1] || 'bin';
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  // In production: await s3.putObject({ Bucket, Key: key, Body: buffer, ContentType: mimeType })
  const cdnUrl = `${config.aws.cdnBaseUrl}/${key}`;
  return { key, cdnUrl };
};

const addMedia = async (listingId, sellerId, file, mediaType, sortOrder = 0) => {
  // Verify ownership
  const { rows } = await query(
    'SELECT id, seller_id FROM listings WHERE id=$1 AND deleted_at IS NULL', [listingId]
  );
  if (!rows.length) throw new NotFoundError('Listing');
  if (rows[0].seller_id !== sellerId) throw new ForbiddenError('Not your listing');

  const { key, cdnUrl } = await uploadToStorage(file.buffer, file.mimetype, `listings/${listingId}`);
  const isPublic = ['preview_image', 'video', 'portfolio_item'].includes(mediaType);

  const { rows: media } = await query(
    `INSERT INTO listing_media
       (listing_id, media_type, storage_key, cdn_url, file_name, file_size_bytes, mime_type, sort_order, is_watermarked)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [listingId, mediaType, key, isPublic ? cdnUrl : null,
     file.originalname, file.size, file.mimetype, sortOrder, false]
  );
  return media[0];
};

const listMedia = async (listingId) => {
  const { rows } = await queryRead(
    `SELECT id, media_type, cdn_url, file_name, file_size_bytes, mime_type,
            width_px, height_px, sort_order, virus_scan_status
       FROM listing_media WHERE listing_id=$1 ORDER BY sort_order`,
    [listingId]
  );
  return rows;
};

const deleteMedia = async (mediaId, sellerId, isAdmin) => {
  const { rows } = await queryRead(
    `SELECT lm.*, l.seller_id FROM listing_media lm
       JOIN listings l ON l.id=lm.listing_id WHERE lm.id=$1`,
    [mediaId]
  );
  if (!rows.length) throw new NotFoundError('Media');
  if (!isAdmin && rows[0].seller_id !== sellerId) throw new ForbiddenError('Not your listing');
  await query('DELETE FROM listing_media WHERE id=$1', [mediaId]);
  return { message: 'Media deleted' };
};

const reorderMedia = async (listingId, sellerId, order) => {
  // order: [{ id, sort_order }]
  for (const item of order) {
    await query(
      `UPDATE listing_media SET sort_order=$1
        WHERE id=$2 AND listing_id=$3`,
      [item.sort_order, item.id, listingId]
    );
  }
  return listMedia(listingId);
};

module.exports = { addMedia, listMedia, deleteMedia, reorderMedia };
