const authService = require('./auth.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');
const env = require('../../config/env');

const REFRESH_COOKIE_NAME = 'nexview_refresh_token';

/** Shared cookie options so login/refresh/logout stay consistent. */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookies.secure,
    sameSite: env.cookies.secure ? 'none' : 'lax',
    domain: env.cookies.domain !== 'localhost' ? env.cookies.domain : undefined,
    path: '/api/v1/auth',
  };
}

const authController = {
  register: catchAsync(async (req, res) => {
    const { accessToken, refreshToken, user } = await authService.register(req.body);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    return sendSuccess(res, { statusCode: 201, data: { accessToken, user } });
  }),

  login: catchAsync(async (req, res) => {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    return sendSuccess(res, { data: { accessToken, user } });
  }),

  refresh: catchAsync(async (req, res) => {
    const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
    const { accessToken } = await authService.refresh(rawRefreshToken);
    return sendSuccess(res, { data: { accessToken } });
  }),

  logout: catchAsync(async (req, res) => {
    const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
    await authService.logout(rawRefreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    return sendSuccess(res, { data: { loggedOut: true } });
  }),

  forgotPassword: catchAsync(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    // Always return a generic success message regardless of whether the
    // email exists, to avoid leaking which emails are registered.
    return sendSuccess(res, {
      data: { message: 'If that email exists, a reset link has been sent.' },
    });
  }),

  resetPassword: catchAsync(async (req, res) => {
    await authService.resetPassword(req.body);
    return sendSuccess(res, { data: { passwordReset: true } });
  }),

  me: catchAsync(async (req, res) => {
    const user = req.user.toObject ? req.user.toObject() : req.user;
    delete user.passwordHash;
    return sendSuccess(res, { data: user });
  }),
};

module.exports = authController;
