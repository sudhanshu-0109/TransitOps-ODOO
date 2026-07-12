const prisma = require('../config/prisma');

const getAll = async (userId, { page = 1, limit = 20 } = {}) => {
  const take = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (Math.max(1, parseInt(page)) - 1) * take;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({
      where: { OR: [{ userId }, { userId: null }] },
    }),
  ]);

  return { data: notifications, total, page: parseInt(page), limit: take };
};

const unreadCount = async (userId) => {
  return prisma.notification.count({
    where: { OR: [{ userId }, { userId: null }], isRead: false },
  });
};

const markRead = async (id) => {
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
};

const markAllRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { OR: [{ userId }, { userId: null }], isRead: false },
    data: { isRead: true },
  });
};

const create = async ({ userId, type, message, meta }) => {
  return prisma.notification.create({
    data: { userId, type, message, meta: meta || undefined },
  });
};

module.exports = { getAll, unreadCount, markRead, markAllRead, create };
