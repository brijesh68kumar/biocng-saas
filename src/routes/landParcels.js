// Land parcel routes reuse the shared master CRUD router.
const createMasterRouter = require('./masterCrudFactory');
const LandParcel = require('../models/LandParcel');

// Required fields for create API.
module.exports = createMasterRouter(LandParcel, ['parcelCode', 'areaAcres']);
