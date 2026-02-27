// Crop plan routes reuse the shared master CRUD router.
const createMasterRouter = require('./masterCrudFactory');
const CropPlan = require('../models/CropPlan');

// Required fields for create API.
module.exports = createMasterRouter(CropPlan, [
  'planCode',
  'landParcelId',
  'feedstockTypeId',
  'sowingDate',
  'expectedHarvestDate',
  'expectedYieldTon',
]);
