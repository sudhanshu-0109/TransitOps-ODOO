const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role.name, depotId: user.depotId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
};

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      depotId: user.depotId,
    },
  };
};

const refresh = async (rawRefreshToken) => {
  if (!rawRefreshToken) throw new AppError('Refresh token required.', 401, 'UNAUTHENTICATED');

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, revoked: false },
    include: { user: { include: { role: true } } },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_TOKEN');
  }

  // Rotate: revoke old, issue new
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } }),
    prisma.refreshToken.create({
      data: { userId: stored.userId, tokenHash: newTokenHash, expiresAt },
    }),
  ]);

  const accessToken = generateAccessToken(stored.user);
  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
};

const getMe = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: { select: { name: true } }, depotId: true, lastLoginAt: true },
  });
};

module.exports = { login, refresh, logout, getMe };
