'use strict';
const authService = require('./auth.service');
const { successResponse } = require('../../shared/utils');

const register = async (req, res) => {
  const result = await authService.register(req.body);
  return successResponse(res, result, 201);
};

const login = async (req, res) => {
  const result = await authService.login({
    ...req.body,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return successResponse(res, { user: result.user, accessToken: result.accessToken });
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const tokens = await authService.refreshTokens(refreshToken);
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return successResponse(res, { accessToken: tokens.accessToken });
};

const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  await authService.logout(refreshToken);
  res.clearCookie('refreshToken');
  return successResponse(res, { message: 'Logged out successfully' });
};

const logoutAll = async (req, res) => {
  await authService.logoutAll(req.user.id);
  res.clearCookie('refreshToken');
  return successResponse(res, { message: 'All sessions revoked' });
};

const verifyEmail = async (req, res) => {
  await authService.verifyEmail(req.user.id);
  return successResponse(res, { message: 'Email verified' });
};

const setup2FA = async (req, res) => {
  const result = await authService.setup2FA(req.user.id);
  return successResponse(res, result);
};

const confirm2FA = async (req, res) => {
  const result = await authService.confirm2FA(req.user.id, req.body.totp_code);
  return successResponse(res, result);
};

const disable2FA = async (req, res) => {
  const result = await authService.disable2FA(req.user.id, req.body.password);
  return successResponse(res, result);
};

const changePassword = async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body.current_password, req.body.new_password);
  return successResponse(res, result);
};

const oauthCallback = async (req, res) => {
  const result = await authService.oauthUpsert({ ...req.body, ip: req.ip, userAgent: req.headers['user-agent'] });
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return successResponse(res, { accessToken: result.accessToken, userId: result.userId, role: result.role });
};

module.exports = { register, login, refresh, logout, logoutAll, verifyEmail, setup2FA, confirm2FA, disable2FA, changePassword, oauthCallback };
