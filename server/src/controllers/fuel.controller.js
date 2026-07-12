const fuelService = require('../services/fuel.service');

const getAllFuel = async (req, res, next) => {
  try { res.json({ success: true, ...(await fuelService.getAllFuel(req.query)) }); } catch (err) { next(err); }
};
const createFuel = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await fuelService.createFuel(req.body) }); } catch (err) { next(err); }
};
const getAllExpenses = async (req, res, next) => {
  try { res.json({ success: true, ...(await fuelService.getAllExpenses(req.query)) }); } catch (err) { next(err); }
};
const createExpense = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await fuelService.createExpense(req.body) }); } catch (err) { next(err); }
};
const getTotals = async (req, res, next) => {
  try { res.json({ success: true, data: await fuelService.getTotals(req.query.vehicleId) }); } catch (err) { next(err); }
};

module.exports = { getAllFuel, createFuel, getAllExpenses, createExpense, getTotals };
