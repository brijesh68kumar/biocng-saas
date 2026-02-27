import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';

// Invoices page: generate weekly invoices and list generated invoice documents.
export default function InvoicesPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [partyType, setPartyType] = useState('collection-center');
  const [forceRegen, setForceRegen] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load generated invoices list.
  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/invoices');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Generate weekly invoices and refresh list.
  const handleGenerate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const payload = await authRequest('/api/invoices/generate-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate,
          weekEndDate,
          partyType,
          forceRegen,
          notes: notes || undefined,
        }),
      });

      setSuccessText(`Generated ${payload.generatedCount || 0} invoice(s). Skipped rows without rate: ${payload.skippedNoRate || 0}.`);
      await loadInvoices();
    } catch (error) {
      setErrorText(error.message || 'Unable to generate invoices');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <section className="card">
        <h1>Invoices</h1>
        <p className="dashboard-meta">Generate weekly invoices from plant intake records and view generated documents.</p>
      </section>

      <section className="card">
        <h2>Generate Weekly Invoices</h2>
        <form className="module-form" onSubmit={handleGenerate}>
          <label className="auth-label" htmlFor="invWeekStartDate">
            Week Start Date
            <input
              id="invWeekStartDate"
              type="date"
              className="auth-input"
              value={weekStartDate}
              onChange={(event) => setWeekStartDate(event.target.value)}
              required
            />
          </label>

          <label className="auth-label" htmlFor="invWeekEndDate">
            Week End Date
            <input
              id="invWeekEndDate"
              type="date"
              className="auth-input"
              value={weekEndDate}
              onChange={(event) => setWeekEndDate(event.target.value)}
              required
            />
          </label>

          <label className="auth-label" htmlFor="invPartyType">
            Party Type
            <select id="invPartyType" className="auth-input" value={partyType} onChange={(event) => setPartyType(event.target.value)}>
              <option value="farmer">farmer</option>
              <option value="supplier">supplier</option>
              <option value="collection-center">collection-center</option>
            </select>
          </label>

          <label className="auth-label" htmlFor="invNotes">
            Notes
            <input
              id="invNotes"
              className="auth-input"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional generation note"
            />
          </label>

          <label className="auth-label" htmlFor="invForceRegen">
            Force Regenerate Existing Invoices
            <select
              id="invForceRegen"
              className="auth-input"
              value={forceRegen ? 'yes' : 'no'}
              onChange={(event) => setForceRegen(event.target.value === 'yes')}
            >
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>

          <div className="module-actions">
            <button className="auth-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {errorText ? <p className="auth-error">{errorText}</p> : null}
          {successText ? <p className="module-success">{successText}</p> : null}
        </form>
      </section>

      <section className="card">
        <h2>Generated Invoices</h2>
        {isLoading ? <p className="dashboard-meta">Loading invoices...</p> : null}
        {!isLoading && items.length === 0 ? <p className="dashboard-meta">No invoices found.</p> : null}
        {!isLoading && items.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Party Type</th>
                  <th>Party Ref</th>
                  <th>Week Start</th>
                  <th>Week End</th>
                  <th>Total Qty</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.invoiceNo}</td>
                    <td>{item.partyType}</td>
                    <td>{item.partyRefId}</td>
                    <td>{item.weekStartDate ? new Date(item.weekStartDate).toLocaleDateString() : '-'}</td>
                    <td>{item.weekEndDate ? new Date(item.weekEndDate).toLocaleDateString() : '-'}</td>
                    <td>{item.totalQtyTon}</td>
                    <td>{item.totalAmount}</td>
                    <td>{item.status}</td>
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

