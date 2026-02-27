import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { formatDate } from '../utils/formatters';

const initialKpis = {
  intakeToday: 0,
  intakeQtyToday: 0,
  pendingDispatch: 0,
  invoicesGenerated: 0,
  farmerCount: 0,
  centerCount: 0,
};

// Dashboard with KPI snapshots from existing APIs.
export default function DashboardPage() {
  const { user, authRequest } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [kpis, setKpis] = useState(initialKpis);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const [
        intakeRows,
        dispatchRows,
        invoiceRows,
        farmerRows,
        centerRows,
      ] = await Promise.all([
        authRequest('/api/plant-intake-entries'),
        authRequest('/api/dispatch-trips'),
        authRequest('/api/invoices'),
        authRequest('/api/farmers'),
        authRequest('/api/collection-centers'),
      ]);

      const todayIso = new Date().toISOString().slice(0, 10);
      const intakeTodayRows = (Array.isArray(intakeRows) ? intakeRows : []).filter(
        (x) => (x.intakeDate || '').slice(0, 10) === todayIso
      );
      const intakeQtyToday = intakeTodayRows.reduce((sum, row) => sum + Number(row.acceptedQtyTon || 0), 0);

      const dispatchPendingStatuses = new Set(['planned', 'dispatched', 'in_transit']);
      const pendingDispatch = (Array.isArray(dispatchRows) ? dispatchRows : []).filter((x) =>
        dispatchPendingStatuses.has(x.status)
      ).length;

      const invoicesGenerated = (Array.isArray(invoiceRows) ? invoiceRows : []).filter(
        (x) => x.status === 'generated'
      ).length;

      setKpis({
        intakeToday: intakeTodayRows.length,
        intakeQtyToday: Number(intakeQtyToday.toFixed(2)),
        pendingDispatch,
        invoicesGenerated,
        farmerCount: Array.isArray(farmerRows) ? farmerRows.length : 0,
        centerCount: Array.isArray(centerRows) ? centerRows.length : 0,
      });

      const sortedTrips = (Array.isArray(dispatchRows) ? dispatchRows : [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentTrips(sortedTrips.slice(0, 5));

      const sortedInvoices = (Array.isArray(invoiceRows) ? invoiceRows : [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentInvoices(sortedInvoices.slice(0, 5));
    } catch (error) {
      setErrorText(error.message || 'Unable to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header card">
        <div>
          <h1>BioCNG SaaS Dashboard</h1>
          <p className="dashboard-meta">
            Logged in as <strong>{user?.name || '-'}</strong> ({user?.role || '-'}) | Tenant: {user?.tenantId || '-'}
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={loadDashboard}>
          Refresh
        </button>
      </header>

      {errorText ? <p className="auth-error">{errorText}</p> : null}

      <section className="dashboard-kpi-grid">
        <article className="kpi-card">
          <h3>Intake Entries (Today)</h3>
          <p className="kpi-value">{isLoading ? '...' : kpis.intakeToday}</p>
        </article>
        <article className="kpi-card">
          <h3>Accepted Qty (Today Ton)</h3>
          <p className="kpi-value">{isLoading ? '...' : kpis.intakeQtyToday}</p>
        </article>
        <article className="kpi-card">
          <h3>Pending Dispatch Trips</h3>
          <p className="kpi-value">{isLoading ? '...' : kpis.pendingDispatch}</p>
        </article>
        <article className="kpi-card">
          <h3>Generated Invoices</h3>
          <p className="kpi-value">{isLoading ? '...' : kpis.invoicesGenerated}</p>
        </article>
        <article className="kpi-card">
          <h3>Farmers</h3>
          <p className="kpi-value">{isLoading ? '...' : kpis.farmerCount}</p>
        </article>
        <article className="kpi-card">
          <h3>Collection Centers</h3>
          <p className="kpi-value">{isLoading ? '...' : kpis.centerCount}</p>
        </article>
      </section>

      <section className="card">
        <h2>Recent Dispatch Trips</h2>
        <div className="table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Status</th>
                <th>Source Type</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((item) => (
                <tr key={item._id}>
                  <td>{item.tripCode}</td>
                  <td>{item.status}</td>
                  <td>{item.sourceType}</td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Recent Invoices</h2>
        <div className="table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Party Type</th>
                <th>Total Amount</th>
                <th>Week Start</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((item) => (
                <tr key={item._id}>
                  <td>{item.invoiceNo}</td>
                  <td>{item.partyType}</td>
                  <td>{item.totalAmount}</td>
                  <td>{formatDate(item.weekStartDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
