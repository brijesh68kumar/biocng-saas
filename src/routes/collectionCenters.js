// Collection center routes use shared master CRUD behavior.
const createMasterRouter = require('./masterCrudFactory');
const CollectionCenter = require('../models/CollectionCenter');

module.exports = createMasterRouter(CollectionCenter, ['code', 'name']);
