const cron = require('node-cron');
const prisma = require('../config/prisma');
const notifService = require('../services/notification.service');

const runExpirySweep = async () => {
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [expiringDrivers, activeMaintenance] = await Promise.all([
    prisma.driver.findMany({
      where: { licenseExpiry: { lte: in30Days } },
      select: { id: true, name: true, licenseNo: true, licenseExpiry: true },
    }),
    prisma.maintenance.findMany({
      where: { status: 'ACTIVE' },
      include: { vehicle: { select: { registrationNo: true } } },
    }),
  ]);

  const safetyUsers = await prisma.user.findMany({
    where: { role: { name: { in: ['SAFETY_OFFICER', 'ADMIN'] } }, isActive: true },
    select: { id: true },
  });
  const fleetUsers = await prisma.user.findMany({
    where: { role: { name: { in: ['FLEET_MANAGER', 'ADMIN'] } }, isActive: true },
    select: { id: true },
  });

  for (const driver of expiringDrivers) {
    const daysLeft = Math.ceil((new Date(driver.licenseExpiry) - Date.now()) / (24 * 60 * 60 * 1000));
    const urgency = daysLeft <= 7 ? 'urgent' : 'warning';
    for (const user of safetyUsers) {
      await notifService.create({
        userId: user.id,
        type: 'LICENSE_EXPIRY',
        message: `${driver.name} (${driver.licenseNo}) license expires in ${daysLeft} day(s).`,
        meta: { driverId: driver.id, daysLeft, urgency },
      });
    }
  }

  for (const m of activeMaintenance) {
    for (const user of fleetUsers) {
      await notifService.create({
        userId: user.id,
        type: 'MAINTENANCE_DUE',
        message: `${m.vehicle.registrationNo}: ${m.title} is in progress.`,
        meta: { maintenanceId: m.id, vehicleId: m.vehicleId },
      });
    }
  }

  console.log(`[cron] Expiry sweep: ${expiringDrivers.length} drivers, ${activeMaintenance.length} maintenance records`);
};

const startNotificationCron = () => {
  // Daily at 02:00 IST (20:30 UTC previous day) — use 02:00 server local for dev
  cron.schedule('0 2 * * *', () => {
    runExpirySweep().catch((err) => console.error('[cron] notification sweep failed:', err));
  });
  console.log('📅 Notification cron scheduled (daily 02:00)');
};

module.exports = { startNotificationCron, runExpirySweep };
