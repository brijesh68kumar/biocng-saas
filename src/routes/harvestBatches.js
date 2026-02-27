// Harvest batch routes reuse shared CRUD behavior.
const createMasterRouter = require('./masterCrudFactory');
const HarvestBatch = require('../models/HarvestBatch');

// Required fields for create API.
// batchCode and lotNo are auto-generated if omitted by caller.
module.exports = createMasterRouter(HarvestBatch, [
  'landParcelId',
  'feedstockTypeId',
  'harvestDate',
  'grossQtyTon',
]);
