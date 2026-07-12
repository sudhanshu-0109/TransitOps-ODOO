const tripService = require('../services/trip.service');

const getAll = async (req, res, next) => {
  try { res.json({ success: true, ...(await tripService.getAll(req.query)) }); } catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await tripService.getById(req.params.id) }); } catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await tripService.create(req.body, req.user.id) }); } catch (err) { next(err); }
};
const dispatch = async (req, res, next) => {
  try { res.json({ success: true, data: await tripService.dispatch(req.params.id, req.body, req.user.id) }); } catch (err) { next(err); }
};
const complete = async (req, res, next) => {
  try { res.json({ success: true, data: await tripService.complete(req.params.id, req.body, req.user.id) }); } catch (err) { next(err); }
};
const cancel = async (req, res, next) => {
  try { res.json({ success: true, data: await tripService.cancel(req.params.id, req.body, req.user.id) }); } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, dispatch, complete, cancel };
