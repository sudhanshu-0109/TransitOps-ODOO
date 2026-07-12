const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const buildFleetContext = async () => {
  const [vehicles, drivers, recentTrips, kpis] = await Promise.all([
    prisma.vehicle.findMany({
      take: 15,
      select: {
        registrationNo: true, name: true, type: true, status: true,
        odometer: true, capacityKg: true, acquisitionCost: true,
        _count: { select: { trips: true, maintenances: true } },
      },
    }),
    prisma.driver.findMany({
      take: 10,
      select: { name: true, licenseExpiry: true, status: true, safetyScore: true, category: true },
    }),
    prisma.trip.findMany({
      take: 20, orderBy: { createdAt: 'desc' },
      select: { tripNo: true, source: true, destination: true, status: true, revenue: true, actualDistanceKm: true, fuelUsedLiters: true },
    }),
    Promise.all([
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    ]),
  ]);

  return JSON.stringify({ vehicles, drivers, recentTrips, summary: { available: kpis[0], onTrip: kpis[1], completed: kpis[2], totalFuelCost: kpis[3]._sum.cost } }, null, 2);
};

const query = async ({ question }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI Fleet Copilot is not configured. Set GEMINI_API_KEY.', 503, 'COPILOT_UNAVAILABLE');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const context = await buildFleetContext();
  const prompt = `You are an AI Fleet Operations Copilot for TransitOps, a transport management ERP.
You have access to the following LIVE fleet data (as of right now):

${context}

Answer the following question based ONLY on the data above. Be concise, actionable, and specific. Use INR (₹) for currency. Use km for distances.

Question: ${question}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = { query };
