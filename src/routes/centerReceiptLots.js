// Center receipt lot routes reuse shared CRUD behavior.
const createMasterRouter = require('./masterCrudFactory');
const CenterReceiptLot = require('../models/CenterReceiptLot');

// Required fields for create API.
module.exports = createMasterRouter(CenterReceiptLot, [
  'collectionCenterId',
  'sourceType',
  'feedstockTypeId',
  'receiptDate',
  'grossQtyTon',
]);
