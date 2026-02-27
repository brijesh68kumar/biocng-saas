const createMasterRouter = require('./masterCrudFactory');
const Farmer = require('../models/Farmer');

module.exports = createMasterRouter(Farmer, ['code', 'name']);