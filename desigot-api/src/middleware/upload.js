'use strict';
const multer = require('multer');
const path   = require('path');
const config = require('../config');
const { ValidationError } = require('../shared/errors/AppError');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_TYPES  = [...ALLOWED_IMAGE_TYPES, 'application/zip', 'application/pdf',
  'application/octet-stream', 'video/mp4', 'video/webm', 'image/svg+xml'];

const storage = multer.memoryStorage();  // Store in memory; pipe to S3 in service layer

const imageUpload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new ValidationError(`Image type ${file.mimetype} not allowed`));
    }
    cb(null, true);
  },
});

const fileUpload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },  // 200 MB for delivery files
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return cb(new ValidationError(`File type ${file.mimetype} not allowed`));
    }
    cb(null, true);
  },
});

module.exports = { imageUpload, fileUpload };
