import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import ListToolbar from '../components/ListToolbar';
import { formatDateTime } from '../utils/formatters';

// Center stock ledger page: list movements and post OUT transactions.
export default function CenterStockLedgerPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [lots, setLots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [centerReceiptLotId, setCenterReceiptLotId] = useState('');
  const [qtyTon, setQtyTon] = useState('0');
  const [refType, setRefType] = useState('manual-out');
  const [refId, setRefId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load receipt lots for OUT posting dropdown.
  const loadOptions = useCallback(async () => {
    setIsOptionsLoading(true);
    try {
      const payload = await authRequest('/api/center-receipt-lots');
      const arr = Array.isArray(payload) ? payload : [];
      setLots(arr);
      if (arr.length > 0) {
        setCenterReceiptLotId(arr[0]._id);
      }
    } catch (error) {
      setErrorText(error.message || 'Unable to load receipt lots');
    } finally {
      setIsOptionsLoading(false);
    }
  }, [authRequest]);

  // Load stock ledger rows.
  const loadLedger = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/center-stock-ledger');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load stock ledger');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadOptions();
    loadLedger();
  }, [loadOptions, loadLedger]);

  // Post OUT transaction and refresh list.
  const handlePostOut = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const qty = Number(qtyTon);
      if (Number.isNaN(qty) || qty <= 0) {
        throw new Error('qtyTon must be a valid number greater than 0');
      }

      await authRequest('/api/center-stock-ledger/out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerReceiptLotId,
          qtyTon: qty,
          refType: refType || undefined,
          refId: refId || undefined,
          remarks: remarks || undefined,
        }),
      });

      setQtyTon('0');
      setRefType('manual-out');
      setRefId('');
      setRemarks('');
      setSuccessText('OUT movement posted successfully.');
      await loadLedger();
      await loadOptions();
    } catch (error) {
      setErrorText(error.message || 'Unable to post OUT movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => JSON.stringify(item || {}).toLowerCase().includes(normalizedSearch));
  const exportRows = filteredItems.map((item) => ({
    movementType: item.movementType,
    qtyTon: item.qtyTon,
    balanceAfterTon: item.balanceAfterTon,
    refType: item.refType || '',
    refId: item.refId || '',
    createdAt: formatDateTime(item.createdAt),
  }));

  return (
    <div>
      <section className="card">
        <h1>Center Stock Ledger</h1>
        <p className="dashboard-meta">View stock movements and post OUT quantity transactions by receipt lot.</p>
      </section>

      <section className="card">
        <h2>Post OUT Movement</h2>
        {isOptionsLoading ? <p className="dashboard-meta">Loading receipt lot options...</p> : null}
        {!isOptionsLoading ? (
          <form className="module-form" onSubmit={handlePostOut}>
            <label className="auth-label" htmlFor="cslReceiptLotId">
              Center Receipt Lot
              <select
                id="cslReceiptLotId"
                className="auth-input"
                value={centerReceiptLotId}
                onChange={(event) => setCenterReceiptLotId(event.target.value)}
                required
              >
                {lots.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.receiptLotCode} | Avl: {item.availableQtyTon}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="cslQtyTon">
              OUT Quantity (Ton)
              <input
                id="cslQtyTon"
                type="number"
                min="0.01"
                step="0.01"
                className="auth-input"
                value={qtyTon}
                onChange={(event) => setQtyTon(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="cslRefType">
              Ref Type
              <input
                id="cslRefType"
                className="auth-input"
                value={refType}
                onChange={(event) => setRefType(event.target.value)}
                placeholder="manual-out"
              />
            </label>

            <label className="auth-label" htmlFor="cslRefId">
              Ref ID
              <input
                id="cslRefId"
                className="auth-input"
                value={refId}
                onChange={(event) => setRefId(event.target.value)}
                placeholder="Optional reference id"
              />
            </label>

            <label className="auth-label" htmlFor="cslRemarks">
              Remarks
              <input
                id="cslRemarks"
                className="auth-input"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Optional remarks"
              />
            </label>

            <div className="module-actions">
              <button className="auth-button" type="submit" disabled={isSubmitting || !centerReceiptLotId}>
                {isSubmitting ? 'Posting...' : 'Post OUT'}
              </button>
            </div>

            {errorText ? <p className="auth-error">{errorText}</p> : null}
            {successText ? <p className="module-success">{successText}</p> : null}
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2>Ledger Movements</h2>
        <ListToolbar
          title="Center Stock Ledger Controls"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          exportRows={exportRows}
          exportFile="center-stock-ledger.csv"
        />
        {isLoading ? <p className="dashboard-meta">Loading ledger rows...</p> : null}
        {!isLoading && filteredItems.length === 0 ? <p className="dashboard-meta">No stock movements found.</p> : null}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Movement</th>
                  <th>Qty (Ton)</th>
                  <th>Balance After</th>
                  <th>Ref Type</th>
                  <th>Ref ID</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.movementType}</td>
                    <td>{item.qtyTon}</td>
                    <td>{item.balanceAfterTon}</td>
                    <td>{item.refType || '-'}</td>
                    <td>{item.refId || '-'}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
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
