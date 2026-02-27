// Feedstock type routes use shared master CRUD behavior.
const createMasterRouter = require('./masterCrudFactory');
const FeedstockType = require('../models/FeedstockType');

module.exports = createMasterRouter(FeedstockType, ['code', 'name']);
