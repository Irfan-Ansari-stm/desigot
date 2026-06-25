'use strict';
const svc = require('./users.service');
const { successResponse, paginatedResponse, paginate } = require('../../shared/utils');

const getMe          = async (req, res) => successResponse(res, await svc.getProfile(req.user.id));
const updateMe       = async (req, res) => successResponse(res, await svc.updateProfile(req.user.id, req.body));
const deleteMe       = async (req, res) => { await svc.softDeleteUser(req.user.id); res.clearCookie('refreshToken'); successResponse(res, { message: 'Account deleted' }); };
const getPublicProfile = async (req, res) => successResponse(res, await svc.getPublicProfile(req.params.username));

const submitKYC      = async (req, res) => successResponse(res, await svc.submitKYC(req.user.id, req.body.method, req.body.document_key), 201);
const listSessions   = async (req, res) => successResponse(res, await svc.listSessions(req.user.id));
const revokeSession  = async (req, res) => successResponse(res, await svc.revokeSession(req.user.id, req.params.sessionId));
const generateBackupCodes = async (req, res) => successResponse(res, await svc.generateBackupCodes(req.user.id));
const getSellerHealth = async (req, res) => successResponse(res, await svc.getSellerHealth(req.user.id));
const getSellerBalance = async (req, res) => successResponse(res, await svc.getSellerBalance(req.user.id));

// Admin
const listUsers     = async (req, res) => {
  const { data, total, page, limit } = await svc.listUsers(req.query, req.query);
  return paginatedResponse(res, data, total, page, limit);
};
const getUserById   = async (req, res) => successResponse(res, await svc.getProfile(req.params.id));
const updateStatus  = async (req, res) => successResponse(res, await svc.updateUserStatus(req.user.id, req.params.id, req.body.status, req.body.reason));
const listKYC       = async (req, res) => {
  const { data, total, page, limit } = await svc.listKYC(req.query, req.query);
  return paginatedResponse(res, data, total, page, limit);
};
const reviewKYC     = async (req, res) => successResponse(res, await svc.reviewKYC(req.params.kycId, req.user.id, req.body.status, req.body.notes));

module.exports = { getMe, updateMe, deleteMe, getPublicProfile, submitKYC, listSessions, revokeSession, generateBackupCodes, getSellerHealth, getSellerBalance, listUsers, getUserById, updateStatus, listKYC, reviewKYC };
