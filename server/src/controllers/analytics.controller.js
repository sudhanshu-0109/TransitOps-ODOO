const dashboardService = require('../services/dashboard.service');
const analyticsService = require('../services/analytics.service');
const { Parser } = require('json2csv');

const getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboard();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnalytics(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const exportCsv = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnalytics(req.query);
    const rows = data.topCostlyVehicles.map((v) => ({
      Registration: v.registrationNo,
      Name: v.name,
      FuelCost: v.fuel,
      MaintenanceCost: v.maintenance,
      OtherExpenses: v.expenses,
      TotalCost: v.totalCost,
      Revenue: v.revenue,
      ROI_Percent: v.roi,
    }));
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-analytics.csv"');
    res.send(csv);
  } catch (err) { next(err); }
};

module.exports = { getDashboard, getAnalytics, exportCsv };
