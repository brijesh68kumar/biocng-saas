import { useMemo, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { formatDate } from '../utils/formatters';

// Reports page: date-range operational summaries for quick review/export.
export default function ReportsPage() {
  const { authRequest } = useAuth();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [intakeRows, setIntakeRows] = useState([]);
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [dispatchRows, setDispatchRows] = useState([]);
  const [centerReceiptRows, setCenterReceiptRows] = useState([]);

  // Load all required module rows and compute report metrics client-side by date range.
  const handleLoadReport = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsLoading(true);
    try {
      const [intakes, invoices, dispatches, centerReceipts] = await Promise.all([
        authRequest('/api/plant-intake-entries'),
        authRequest('/api/invoices'),
        authRequest('/api/dispatch-trips'),
        authRequest('/api/center-receipt-lots'),
      ]);

      setIntakeRows(Array.isArray(intakes) ? intakes : []);
      setInvoiceRows(Array.isArray(invoices) ? invoices : []);
      setDispatchRows(Array.isArray(dispatches) ? dispatches : []);
      setCenterReceiptRows(Array.isArray(centerReceipts) ? centerReceipts : []);
      setSuccessText('Report loaded successfully.');
    } catch (error) {
      setErrorText(error.message || 'Unable to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const inRange = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (date < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (date > to) return false;
    }
    return true;
  };

  const filteredIntakes = intakeRows.filter((row) => inRange(row.intakeDate));
  const filteredInvoices = invoiceRows.filter((row) => inRange(row.weekEndDate));
  const filteredDispatches = dispatchRows.filter((row) => inRange(row.createdAt));
  const filteredCenterReceipts = centerReceiptRows.filter((row) => inRange(row.receiptDate));

  const summary = useMemo(() => {
    const acceptedQty = filteredIntakes.reduce((sum, row) => sum + Number(row.acceptedQtyTon || 0), 0);
    const rejectedQty = filteredIntakes.reduce((sum, row) => sum + Number(row.rejectedQtyTon || 0), 0);
    const invoiceTotal = filteredInvoices.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
    const centerReceiptQty = filteredCenterReceipts.reduce((sum, row) => sum + Number(row.grossQtyTon || 0), 0);
    const completedTrips = filteredDispatches.filter((row) => row.status === 'closed').length;

    return {
      acceptedQtyTon: Number(acceptedQty.toFixed(3)),
      rejectedQtyTon: Number(rejectedQty.toFixed(3)),
      invoiceTotalAmount: Number(invoiceTotal.toFixed(2)),
      centerReceiptQtyTon: Number(centerReceiptQty.toFixed(3)),
      closedDispatchCount: completedTrips,
    };
  }, [filteredIntakes, filteredInvoices, filteredDispatches, filteredCenterReceipts]);

  const topInvoiceParties = useMemo(() => {
    const grouped = {};
    filteredInvoices.forEach((row) => {
      const key = `${row.partyType}:${row.partyRefId}`;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          partyType: row.partyType,
          partyRefId: row.partyRefId,
          totalAmount: 0,
          invoiceCount: 0,
        };
      }
      grouped[key].totalAmount += Number(row.totalAmount || 0);
      grouped[key].invoiceCount += 1;
    });
    return Object.values(grouped)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [filteredInvoices]);

  return (
    <div>
      <section className="card">
        <h1>Operational Reports</h1>
        <p className="dashboard-meta">Choose a date range to view intake, dispatch, center receipt, and invoice summaries.</p>
      </section>

      <section className="card">
        <h2>Report Filters</h2>
        <form className="module-form" onSubmit={handleLoadReport}>
          <label className="auth-label" htmlFor="repDateFrom">
            Date From
            <input id="repDateFrom" type="date" className="auth-input" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label className="auth-label" htmlFor="repDateTo">
            Date To
            <input id="repDateTo" type="date" className="auth-input" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>

          <div className="module-actions">
            <button className="auth-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load Report'}
            </button>
          </div>
          {errorText ? <p className="auth-error">{errorText}</p> : null}
          {successText ? <p className="module-success">{successText}</p> : null}
        </form>
      </section>

      <section className="card">
        <h2>Summary</h2>
        <div className="dashboard-kpi-grid">
          <div className="kpi-card">
            <h3>Accepted Intake (Ton)</h3>
            <p className="kpi-value">{summary.acceptedQtyTon}</p>
          </div>
          <div className="kpi-card">
            <h3>Rejected Intake (Ton)</h3>
            <p className="kpi-value">{summary.rejectedQtyTon}</p>
          </div>
          <div className="kpi-card">
            <h3>Center Receipt (Ton)</h3>
            <p className="kpi-value">{summary.centerReceiptQtyTon}</p>
          </div>
          <div className="kpi-card">
            <h3>Invoice Amount</h3>
            <p className="kpi-value">{summary.invoiceTotalAmount}</p>
          </div>
          <div className="kpi-card">
            <h3>Closed Dispatch Trips</h3>
            <p className="kpi-value">{summary.closedDispatchCount}</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Top Invoice Parties (By Amount)</h2>
        {topInvoiceParties.length === 0 ? <p className="dashboard-meta">No invoice rows in selected range.</p> : null}
        {topInvoiceParties.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Party Type</th>
                  <th>Party Ref</th>
                  <th>Invoice Count</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {topInvoiceParties.map((row) => (
                  <tr key={row.key}>
                    <td>{row.partyType}</td>
                    <td>{row.partyRefId}</td>
                    <td>{row.invoiceCount}</td>
                    <td>{Number(row.totalAmount.toFixed(2))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Recent Invoices In Range</h2>
        {filteredInvoices.length === 0 ? <p className="dashboard-meta">No invoices in selected range.</p> : null}
        {filteredInvoices.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Party Type</th>
                  <th>Party Ref</th>
                  <th>Week Start</th>
                  <th>Week End</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.slice(0, 20).map((row) => (
                  <tr key={row._id}>
                    <td>{row.invoiceNo}</td>
                    <td>{row.partyType}</td>
                    <td>{row.partyRefId}</td>
                    <td>{formatDate(row.weekStartDate)}</td>
                    <td>{formatDate(row.weekEndDate)}</td>
                    <td>{row.totalAmount}</td>
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
