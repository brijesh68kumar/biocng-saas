const createMasterRouter = require('./masterCrudFactory');
const Vehicle = require('../models/Vehicle');

module.exports = createMasterRouter(Vehicle, ['number']);