import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import ListToolbar from '../components/ListToolbar';
import { formatDate } from '../utils/formatters';

// Harvest batches module page: list and create lot/batch records.
export default function HarvestBatchesPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [landParcels, setLandParcels] = useState([]);
  const [cropPlans, setCropPlans] = useState([]);
  const [feedstockTypes, setFeedstockTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [landParcelId, setLandParcelId] = useState('');
  const [cropPlanId, setCropPlanId] = useState('');
  const [feedstockTypeId, setFeedstockTypeId] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [grossQtyTon, setGrossQtyTon] = useState('0');
  const [moisturePercent, setMoisturePercent] = useState('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load list dependencies for dropdowns.
  const loadOptions = useCallback(async () => {
    setIsOptionsLoading(true);
    try {
      const [parcels, plans, feedstocks] = await Promise.all([
        authRequest('/api/land-parcels'),
        authRequest('/api/crop-plans'),
        authRequest('/api/feedstock-types'),
      ]);
      setLandParcels(Array.isArray(parcels) ? parcels : []);
      setCropPlans(Array.isArray(plans) ? plans : []);
      setFeedstockTypes(Array.isArray(feedstocks) ? feedstocks : []);

      if (Array.isArray(parcels) && parcels.length > 0) {
        setLandParcelId(parcels[0]._id);
      }
      if (Array.isArray(plans) && plans.length > 0) {
        setCropPlanId(plans[0]._id);
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

  // Load harvest batch list.
  const loadHarvestBatches = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/harvest-batches');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load harvest batches');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadOptions();
    loadHarvestBatches();
  }, [loadOptions, loadHarvestBatches]);

  // Create harvest batch and refresh list.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const qty = Number(grossQtyTon);
      if (Number.isNaN(qty) || qty < 0) {
        throw new Error('grossQtyTon must be a valid non-negative number');
      }

      await authRequest('/api/harvest-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landParcelId,
          cropPlanId: cropPlanId || undefined,
          feedstockTypeId,
          harvestDate,
          grossQtyTon: qty,
          moisturePercent: moisturePercent ? Number(moisturePercent) : undefined,
          qualityGrade: qualityGrade || undefined,
          notes: notes.trim(),
        }),
      });

      setHarvestDate('');
      setGrossQtyTon('0');
      setMoisturePercent('');
      setQualityGrade('');
      setNotes('');
      setSuccessText('Harvest batch created successfully.');
      await loadHarvestBatches();
    } catch (error) {
      setErrorText(error.message || 'Unable to create harvest batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => JSON.stringify(item || {}).toLowerCase().includes(normalizedSearch));
  const exportRows = filteredItems.map((item) => ({
    batchCode: item.batchCode,
    lotNo: item.lotNo,
    harvestDate: formatDate(item.harvestDate),
    grossQtyTon: item.grossQtyTon,
    qualityGrade: item.qualityGrade || '',
  }));

  return (
    <div>
      <section className="card">
        <h1>Harvest Batches</h1>
        <p className="dashboard-meta">Create and view harvested lots for batch-wise traceability.</p>
      </section>

      <section className="card">
        <h2>Create Harvest Batch</h2>
        {isOptionsLoading ? <p className="dashboard-meta">Loading form options...</p> : null}
        {!isOptionsLoading ? (
          <form className="module-form" onSubmit={handleCreate}>
            <label className="auth-label" htmlFor="hbLandParcelId">
              Land Parcel
              <select
                id="hbLandParcelId"
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

            <label className="auth-label" htmlFor="hbCropPlanId">
              Crop Plan (Optional)
              <select id="hbCropPlanId" className="auth-input" value={cropPlanId} onChange={(event) => setCropPlanId(event.target.value)}>
                <option value="">Select None</option>
                {cropPlans.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.planCode}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="hbFeedstockTypeId">
              Feedstock Type
              <select
                id="hbFeedstockTypeId"
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

            <label className="auth-label" htmlFor="harvestDate">
              Harvest Date
              <input
                id="harvestDate"
                type="date"
                className="auth-input"
                value={harvestDate}
                onChange={(event) => setHarvestDate(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="grossQtyTon">
              Gross Quantity (Ton)
              <input
                id="grossQtyTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={grossQtyTon}
                onChange={(event) => setGrossQtyTon(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="moisturePercent">
              Moisture %
              <input
                id="moisturePercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="auth-input"
                value={moisturePercent}
                onChange={(event) => setMoisturePercent(event.target.value)}
              />
            </label>

            <label className="auth-label" htmlFor="qualityGrade">
              Quality Grade
              <input
                id="qualityGrade"
                className="auth-input"
                value={qualityGrade}
                onChange={(event) => setQualityGrade(event.target.value)}
                placeholder="A"
              />
            </label>

            <label className="auth-label" htmlFor="hbNotes">
              Notes
              <input
                id="hbNotes"
                className="auth-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional note"
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
        <h2>Harvest Batches List</h2>
        <ListToolbar
          title="Harvest Batches Controls"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          exportRows={exportRows}
          exportFile="harvest-batches.csv"
        />
        {isLoading ? <p className="dashboard-meta">Loading harvest batches...</p> : null}
        {!isLoading && filteredItems.length === 0 ? <p className="dashboard-meta">No harvest batches found.</p> : null}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Batch Code</th>
                  <th>Lot No</th>
                  <th>Harvest Date</th>
                  <th>Gross Qty (Ton)</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.batchCode}</td>
                    <td>{item.lotNo}</td>
                    <td>{formatDate(item.harvestDate)}</td>
                    <td>{item.grossQtyTon}</td>
                    <td>{item.qualityGrade || '-'}</td>
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
