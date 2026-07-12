const driverService = require('../services/driver.service');

const getAll = async (req, res, next) => {
  try { res.json({ success: true, ...(await driverService.getAll(req.query)) }); } catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await driverService.getById(req.params.id) }); } catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await driverService.create(req.body) }); } catch (err) { next(err); }
};
const update = async (req, res, next) => {
  try { res.json({ success: true, data: await driverService.update(req.params.id, req.body) }); } catch (err) { next(err); }
};
const updateStatus = async (req, res, next) => {
  try { res.json({ success: true, data: await driverService.updateStatus(req.params.id, req.body.status) }); } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, updateStatus };
