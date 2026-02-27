import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import ListToolbar from '../components/ListToolbar';
import { formatDate } from '../utils/formatters';

// Crop plans module page: list and create crop planning records.
export default function CropPlansPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [landParcels, setLandParcels] = useState([]);
  const [feedstockTypes, setFeedstockTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [landParcelId, setLandParcelId] = useState('');
  const [feedstockTypeId, setFeedstockTypeId] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [expectedYieldTon, setExpectedYieldTon] = useState('0');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load list dependencies for dropdowns.
  const loadOptions = useCallback(async () => {
    setIsOptionsLoading(true);
    try {
      const [parcels, feedstocks] = await Promise.all([
        authRequest('/api/land-parcels'),
        authRequest('/api/feedstock-types'),
      ]);
      setLandParcels(Array.isArray(parcels) ? parcels : []);
      setFeedstockTypes(Array.isArray(feedstocks) ? feedstocks : []);
      if (Array.isArray(parcels) && parcels.length > 0) {
        setLandParcelId(parcels[0]._id);
      }
      if (Array.isArray(feedstocks) && feedstocks.length > 0) {
        setFeedstockTypeId(feedstocks[0]._id);
      }
    } catch (error) {
      setErrorText(error.message || 'Unable to load dropdown data');
    } finally {
      setIsOptionsLoading(false);
    }
  }, [authRequest]);

  // Load crop plan list.
  const loadCropPlans = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/crop-plans');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load crop plans');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadOptions();
    loadCropPlans();
  }, [loadOptions, loadCropPlans]);

  // Create crop plan and refresh list.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const yieldTon = Number(expectedYieldTon);
      const cost = Number(estimatedCost);
      if (Number.isNaN(yieldTon) || yieldTon < 0) {
        throw new Error('expectedYieldTon must be a valid non-negative number');
      }
      if (Number.isNaN(cost) || cost < 0) {
        throw new Error('estimatedCost must be a valid non-negative number');
      }

      await authRequest('/api/crop-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: planCode.trim(),
          landParcelId,
          feedstockTypeId,
          sowingDate,
          expectedHarvestDate,
          expectedYieldTon: yieldTon,
          estimatedCost: cost,
          notes: notes.trim(),
        }),
      });

      setPlanCode('');
      setSowingDate('');
      setExpectedHarvestDate('');
      setExpectedYieldTon('0');
      setEstimatedCost('0');
      setNotes('');
      setSuccessText('Crop plan created successfully.');
      await loadCropPlans();
    } catch (error) {
      setErrorText(error.message || 'Unable to create crop plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => JSON.stringify(item || {}).toLowerCase().includes(normalizedSearch));
  const exportRows = filteredItems.map((item) => ({
    planCode: item.planCode,
    landParcelId: item.landParcelId,
    feedstockTypeId: item.feedstockTypeId,
    sowingDate: formatDate(item.sowingDate),
    expectedHarvestDate: formatDate(item.expectedHarvestDate),
    expectedYieldTon: item.expectedYieldTon,
  }));

  return (
    <div>
      <section className="card">
        <h1>Crop Plans</h1>
        <p className="dashboard-meta">Create and view crop planning records linked to land parcels and feedstock types.</p>
      </section>

      <section className="card">
        <h2>Create Crop Plan</h2>
        {isOptionsLoading ? <p className="dashboard-meta">Loading form options...</p> : null}
        {!isOptionsLoading ? (
          <form className="module-form" onSubmit={handleCreate}>
            <label className="auth-label" htmlFor="planCode">
              Plan Code
              <input
                id="planCode"
                className="auth-input"
                value={planCode}
                onChange={(event) => setPlanCode(event.target.value)}
                placeholder="CP-2026-001"
                required
              />
            </label>

            <label className="auth-label" htmlFor="landParcelId">
              Land Parcel
              <select
                id="landParcelId"
                className="auth-input"
                value={landParcelId}
                onChange={(event) => setLandParcelId(event.target.value)}
                required
              >
                {landParcels.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.parcelCode}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="feedstockTypeId">
              Feedstock Type
              <select
                id="feedstockTypeId"
                className="auth-input"
                value={feedstockTypeId}
                onChange={(event) => setFeedstockTypeId(event.target.value)}
                required
              >
                {feedstockTypes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="sowingDate">
              Sowing Date
              <input
                id="sowingDate"
                type="date"
                className="auth-input"
                value={sowingDate}
                onChange={(event) => setSowingDate(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="expectedHarvestDate">
              Expected Harvest Date
              <input
                id="expectedHarvestDate"
                type="date"
                className="auth-input"
                value={expectedHarvestDate}
                onChange={(event) => setExpectedHarvestDate(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="expectedYieldTon">
              Expected Yield (Ton)
              <input
                id="expectedYieldTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={expectedYieldTon}
                onChange={(event) => setExpectedYieldTon(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="estimatedCost">
              Estimated Cost
              <input
                id="estimatedCost"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={estimatedCost}
                onChange={(event) => setEstimatedCost(event.target.value)}
              />
            </label>

            <label className="auth-label" htmlFor="notes">
              Notes
              <input
                id="notes"
                className="auth-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional planning note"
              />
            </label>

            <div className="module-actions">
              <button className="auth-button" type="submit" disabled={isSubmitting || !landParcelId || !feedstockTypeId}>
                {isSubmitting ? 'Saving...' : 'Create'}
              </button>
            </div>

            {errorText ? <p className="auth-error">{errorText}</p> : null}
            {successText ? <p className="module-success">{successText}</p> : null}
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2>Crop Plans List</h2>
        <ListToolbar
          title="Crop Plans Controls"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          exportRows={exportRows}
          exportFile="crop-plans.csv"
        />
        {isLoading ? <p className="dashboard-meta">Loading crop plans...</p> : null}
        {!isLoading && filteredItems.length === 0 ? <p className="dashboard-meta">No crop plans found.</p> : null}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Plan Code</th>
                  <th>Land Parcel ID</th>
                  <th>Feedstock Type ID</th>
                  <th>Sowing Date</th>
                  <th>Expected Harvest</th>
                  <th>Yield (Ton)</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.planCode}</td>
                    <td>{item.landParcelId}</td>
                    <td>{item.feedstockTypeId}</td>
                    <td>{formatDate(item.sowingDate)}</td>
                    <td>{formatDate(item.expectedHarvestDate)}</td>
                    <td>{item.expectedYieldTon}</td>
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
