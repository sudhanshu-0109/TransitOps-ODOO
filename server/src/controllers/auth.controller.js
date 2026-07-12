const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ success: true, data: { accessToken, user } });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const tokens = await authService.refresh(rawRefreshToken);
    res
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ success: true, data: { accessToken: tokens.accessToken } });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await authService.logout(rawRefreshToken);
    res.clearCookie('refreshToken').json({ success: true, message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, getMe };
