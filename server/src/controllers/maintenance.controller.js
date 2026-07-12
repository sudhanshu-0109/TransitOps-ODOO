const maintenanceService = require('../services/maintenance.service');

const getAll = async (req, res, next) => {
  try { res.json({ success: true, ...(await maintenanceService.getAll(req.query)) }); } catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await maintenanceService.create(req.body) }); } catch (err) { next(err); }
};
const close = async (req, res, next) => {
  try { res.json({ success: true, data: await maintenanceService.close(req.params.id) }); } catch (err) { next(err); }
};

module.exports = { getAll, create, close };
