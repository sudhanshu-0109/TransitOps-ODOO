const vehicleService = require('../services/vehicle.service');
const { wrapList } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const result = await vehicleService.getAll(req.query);
    res.json({ success: true, ...wrapList(result) });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await vehicleService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getTimeline = async (req, res, next) => {
  try {
    const data = await vehicleService.getTimeline(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await vehicleService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await vehicleService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const retire = async (req, res, next) => {
  try {
    const data = await vehicleService.retire(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await vehicleService.remove(req.params.id);
    res.json({ success: true, message: 'Vehicle deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, getTimeline, create, update, retire, remove };
