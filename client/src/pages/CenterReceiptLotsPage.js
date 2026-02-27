import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import ListToolbar from '../components/ListToolbar';
import { formatDate } from '../utils/formatters';

// Center receipt lots page: list and create lot entries at collection centers.
export default function CenterReceiptLotsPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [collectionCenters, setCollectionCenters] = useState([]);
  const [feedstockTypes, setFeedstockTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [collectionCenterId, setCollectionCenterId] = useState('');
  const [sourceType, setSourceType] = useState('farmer');
  const [sourceRefId, setSourceRefId] = useState('');
  const [feedstockTypeId, setFeedstockTypeId] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [grossQtyTon, setGrossQtyTon] = useState('0');
  const [moisturePercent, setMoisturePercent] = useState('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dropdown options.
  const loadOptions = useCallback(async () => {
    setIsOptionsLoading(true);
    try {
      const [centers, feedstocks] = await Promise.all([
        authRequest('/api/collection-centers'),
        authRequest('/api/feedstock-types'),
      ]);
      setCollectionCenters(Array.isArray(centers) ? centers : []);
      setFeedstockTypes(Array.isArray(feedstocks) ? feedstocks : []);
      if (Array.isArray(centers) && centers.length > 0) {
        setCollectionCenterId(centers[0]._id);
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

  // Load receipt lot list.
  const loadLots = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/center-receipt-lots');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load center receipt lots');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadOptions();
    loadLots();
  }, [loadOptions, loadLots]);

  // Create receipt lot and refresh list.
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

      await authRequest('/api/center-receipt-lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionCenterId,
          sourceType,
          sourceRefId: sourceRefId || undefined,
          feedstockTypeId,
          receiptDate,
          grossQtyTon: qty,
          moisturePercent: moisturePercent ? Number(moisturePercent) : undefined,
          qualityGrade: qualityGrade || undefined,
          notes: notes.trim(),
        }),
      });

      setSourceRefId('');
      setReceiptDate('');
      setGrossQtyTon('0');
      setMoisturePercent('');
      setQualityGrade('');
      setNotes('');
      setSuccessText('Center receipt lot created successfully.');
      await loadLots();
    } catch (error) {
      setErrorText(error.message || 'Unable to create center receipt lot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => JSON.stringify(item || {}).toLowerCase().includes(normalizedSearch));
  const exportRows = filteredItems.map((item) => ({
    receiptLotCode: item.receiptLotCode,
    sourceType: item.sourceType,
    receiptDate: formatDate(item.receiptDate),
    grossQtyTon: item.grossQtyTon,
    availableQtyTon: item.availableQtyTon,
    qualityGrade: item.qualityGrade || '',
  }));

  return (
    <div>
      <section className="card">
        <h1>Center Receipt Lots</h1>
        <p className="dashboard-meta">Create and view inward lots received at collection centers.</p>
      </section>

      <section className="card">
        <h2>Create Center Receipt Lot</h2>
        {isOptionsLoading ? <p className="dashboard-meta">Loading form options...</p> : null}
        {!isOptionsLoading ? (
          <form className="module-form" onSubmit={handleCreate}>
            <label className="auth-label" htmlFor="crlCollectionCenterId">
              Collection Center
              <select
                id="crlCollectionCenterId"
                className="auth-input"
                value={collectionCenterId}
                onChange={(event) => setCollectionCenterId(event.target.value)}
                required
              >
                {collectionCenters.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="crlSourceType">
              Source Type
              <select id="crlSourceType" className="auth-input" value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                <option value="farmer">farmer</option>
                <option value="own-farm">own-farm</option>
                <option value="supplier">supplier</option>
              </select>
            </label>

            <label className="auth-label" htmlFor="crlSourceRefId">
              Source Ref ID (Optional)
              <input
                id="crlSourceRefId"
                className="auth-input"
                value={sourceRefId}
                onChange={(event) => setSourceRefId(event.target.value)}
                placeholder="Farmer/Supplier ID"
              />
            </label>

            <label className="auth-label" htmlFor="crlFeedstockTypeId">
              Feedstock Type
              <select
                id="crlFeedstockTypeId"
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

            <label className="auth-label" htmlFor="crlReceiptDate">
              Receipt Date
              <input
                id="crlReceiptDate"
                type="date"
                className="auth-input"
                value={receiptDate}
                onChange={(event) => setReceiptDate(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="crlGrossQtyTon">
              Gross Quantity (Ton)
              <input
                id="crlGrossQtyTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={grossQtyTon}
                onChange={(event) => setGrossQtyTon(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="crlMoisture">
              Moisture %
              <input
                id="crlMoisture"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="auth-input"
                value={moisturePercent}
                onChange={(event) => setMoisturePercent(event.target.value)}
              />
            </label>

            <label className="auth-label" htmlFor="crlQualityGrade">
              Quality Grade
              <input
                id="crlQualityGrade"
                className="auth-input"
                value={qualityGrade}
                onChange={(event) => setQualityGrade(event.target.value)}
                placeholder="A"
              />
            </label>

            <label className="auth-label" htmlFor="crlNotes">
              Notes
              <input
                id="crlNotes"
                className="auth-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional note"
              />
            </label>

            <div className="module-actions">
              <button className="auth-button" type="submit" disabled={isSubmitting || !collectionCenterId || !feedstockTypeId}>
                {isSubmitting ? 'Saving...' : 'Create'}
              </button>
            </div>

            {errorText ? <p className="auth-error">{errorText}</p> : null}
            {successText ? <p className="module-success">{successText}</p> : null}
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2>Center Receipt Lots List</h2>
        <ListToolbar
          title="Center Receipt Lots Controls"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          exportRows={exportRows}
          exportFile="center-receipt-lots.csv"
        />
        {isLoading ? <p className="dashboard-meta">Loading center receipt lots...</p> : null}
        {!isLoading && filteredItems.length === 0 ? <p className="dashboard-meta">No center receipt lots found.</p> : null}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Lot Code</th>
                  <th>Source Type</th>
                  <th>Receipt Date</th>
                  <th>Gross Qty (Ton)</th>
                  <th>Available Qty (Ton)</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.receiptLotCode}</td>
                    <td>{item.sourceType}</td>
                    <td>{formatDate(item.receiptDate)}</td>
                    <td>{item.grossQtyTon}</td>
                    <td>{item.availableQtyTon}</td>
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
