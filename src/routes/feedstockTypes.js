const createMasterRouter = require('./masterCrudFactory');
const FeedstockType = require('../models/FeedstockType');

module.exports = createMasterRouter(FeedstockType, ['code', 'name']);