import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';

const statusOptions = ['planned', 'dispatched', 'in_transit', 'arrived', 'closed', 'cancelled'];

// Dispatch trips page: create trips, list trips, and update status.
export default function DispatchTripsPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [collectionCenters, setCollectionCenters] = useState([]);
  const [landParcels, setLandParcels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [sourceType, setSourceType] = useState('mixed');
  const [collectionCenterId, setCollectionCenterId] = useState('');
  const [landParcelId, setLandParcelId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [destinationPlantName, setDestinationPlantName] = useState('Main Plant');
  const [plannedLotSourceType, setPlannedLotSourceType] = useState('center-receipt');
  const [plannedLotRefId, setPlannedLotRefId] = useState('');
  const [plannedLotQtyTon, setPlannedLotQtyTon] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDrafts, setStatusDrafts] = useState({});

  // Load dropdown dependencies.
  const loadOptions = useCallback(async () => {
    setIsOptionsLoading(true);
    try {
      const [vehicleRows, centerRows, parcelRows] = await Promise.all([
        authRequest('/api/vehicles'),
        authRequest('/api/collection-centers'),
        authRequest('/api/land-parcels'),
      ]);
      const vehiclesArr = Array.isArray(vehicleRows) ? vehicleRows : [];
      const centersArr = Array.isArray(centerRows) ? centerRows : [];
      const parcelsArr = Array.isArray(parcelRows) ? parcelRows : [];

      setVehicles(vehiclesArr);
      setCollectionCenters(centersArr);
      setLandParcels(parcelsArr);

      if (vehiclesArr.length > 0) setVehicleId(vehiclesArr[0]._id);
      if (centersArr.length > 0) setCollectionCenterId(centersArr[0]._id);
      if (parcelsArr.length > 0) setLandParcelId(parcelsArr[0]._id);
    } catch (error) {
      setErrorText(error.message || 'Unable to load form options');
    } finally {
      setIsOptionsLoading(false);
    }
  }, [authRequest]);

  // Load dispatch trip list.
  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/dispatch-trips');
      const arr = Array.isArray(payload) ? payload : [];
      setItems(arr);

      const draftMap = {};
      arr.forEach((row) => {
        draftMap[row._id] = row.status || 'planned';
      });
      setStatusDrafts(draftMap);
    } catch (error) {
      setErrorText(error.message || 'Unable to load dispatch trips');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadOptions();
    loadTrips();
  }, [loadOptions, loadTrips]);

  // Create a dispatch trip and refresh list.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const qty = Number(plannedLotQtyTon);
      if (plannedLotRefId && (Number.isNaN(qty) || qty < 0)) {
        throw new Error('planned lot qty must be valid non-negative number');
      }

      const plannedLots = plannedLotRefId
        ? [
            {
              lotSourceType: plannedLotSourceType,
              lotRefId: plannedLotRefId.trim(),
              qtyTon: qty,
            },
          ]
        : [];

      await authRequest('/api/dispatch-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          collectionCenterId: collectionCenterId || undefined,
          landParcelId: landParcelId || undefined,
          vehicleId: vehicleId || undefined,
          driverName: driverName || undefined,
          driverPhone: driverPhone || undefined,
          destinationPlantName: destinationPlantName || undefined,
          plannedLots,
          status: 'planned',
        }),
      });

      setDriverName('');
      setDriverPhone('');
      setDestinationPlantName('Main Plant');
      setPlannedLotRefId('');
      setPlannedLotQtyTon('0');
      setSuccessText('Dispatch trip created successfully.');
      await loadTrips();
    } catch (error) {
      setErrorText(error.message || 'Unable to create dispatch trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update dispatch status for one row.
  const handleUpdateStatus = async (tripId) => {
    setErrorText('');
    setSuccessText('');
    try {
      const status = statusDrafts[tripId] || 'planned';
      await authRequest(`/api/dispatch-trips/${tripId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setSuccessText('Dispatch trip status updated.');
      await loadTrips();
    } catch (error) {
      setErrorText(error.message || 'Unable to update trip status');
    }
  };

  return (
    <div>
      <section className="card">
        <h1>Dispatch Trips</h1>
        <p className="dashboard-meta">Create dispatch trips and manage dispatch status lifecycle.</p>
      </section>

      <section className="card">
        <h2>Create Dispatch Trip</h2>
        {isOptionsLoading ? <p className="dashboard-meta">Loading form options...</p> : null}
        {!isOptionsLoading ? (
          <form className="module-form" onSubmit={handleCreate}>
            <label className="auth-label" htmlFor="dtSourceType">
              Source Type
              <select id="dtSourceType" className="auth-input" value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                <option value="collection-center">collection-center</option>
                <option value="own-farm">own-farm</option>
                <option value="mixed">mixed</option>
              </select>
            </label>

            <label className="auth-label" htmlFor="dtCollectionCenterId">
              Collection Center
              <select
                id="dtCollectionCenterId"
                className="auth-input"
                value={collectionCenterId}
                onChange={(event) => setCollectionCenterId(event.target.value)}
              >
                <option value="">Select None</option>
                {collectionCenters.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="dtLandParcelId">
              Land Parcel
              <select id="dtLandParcelId" className="auth-input" value={landParcelId} onChange={(event) => setLandParcelId(event.target.value)}>
                <option value="">Select None</option>
                {landParcels.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.parcelCode}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="dtVehicleId">
              Vehicle
              <select id="dtVehicleId" className="auth-input" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
                <option value="">Select None</option>
                {vehicles.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.number}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="dtDriverName">
              Driver Name
              <input id="dtDriverName" className="auth-input" value={driverName} onChange={(event) => setDriverName(event.target.value)} />
            </label>

            <label className="auth-label" htmlFor="dtDriverPhone">
              Driver Phone
              <input id="dtDriverPhone" className="auth-input" value={driverPhone} onChange={(event) => setDriverPhone(event.target.value)} />
            </label>

            <label className="auth-label" htmlFor="dtDestinationPlantName">
              Destination Plant
              <input
                id="dtDestinationPlantName"
                className="auth-input"
                value={destinationPlantName}
                onChange={(event) => setDestinationPlantName(event.target.value)}
              />
            </label>

            <label className="auth-label" htmlFor="dtPlannedLotSourceType">
              Planned Lot Source Type
              <select
                id="dtPlannedLotSourceType"
                className="auth-input"
                value={plannedLotSourceType}
                onChange={(event) => setPlannedLotSourceType(event.target.value)}
              >
                <option value="center-receipt">center-receipt</option>
                <option value="harvest-batch">harvest-batch</option>
              </select>
            </label>

            <label className="auth-label" htmlFor="dtPlannedLotRefId">
              Planned Lot Ref ID (Optional)
              <input
                id="dtPlannedLotRefId"
                className="auth-input"
                value={plannedLotRefId}
                onChange={(event) => setPlannedLotRefId(event.target.value)}
                placeholder="Lot id or code"
              />
            </label>

            <label className="auth-label" htmlFor="dtPlannedLotQtyTon">
              Planned Lot Qty (Ton)
              <input
                id="dtPlannedLotQtyTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={plannedLotQtyTon}
                onChange={(event) => setPlannedLotQtyTon(event.target.value)}
              />
            </label>

            <div className="module-actions">
              <button className="auth-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Create'}
              </button>
            </div>

            {errorText ? <p className="auth-error">{errorText}</p> : null}
            {successText ? <p className="module-success">{successText}</p> : null}
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2>Dispatch Trips List</h2>
        {isLoading ? <p className="dashboard-meta">Loading dispatch trips...</p> : null}
        {!isLoading && items.length === 0 ? <p className="dashboard-meta">No dispatch trips found.</p> : null}
        {!isLoading && items.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Trip Code</th>
                  <th>Source Type</th>
                  <th>Status</th>
                  <th>Update Status</th>
                  <th>Vehicle ID</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.tripCode}</td>
                    <td>{item.sourceType}</td>
                    <td>{item.status}</td>
                    <td>
                      <div className="table-inline">
                        <select
                          className="auth-input table-inline-select"
                          value={statusDrafts[item._id] || item.status}
                          onChange={(event) =>
                            setStatusDrafts((prev) => ({
                              ...prev,
                              [item._id]: event.target.value,
                            }))
                          }
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button className="secondary-button" type="button" onClick={() => handleUpdateStatus(item._id)}>
                          Save
                        </button>
                      </div>
                    </td>
                    <td>{item.vehicleId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

