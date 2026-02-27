import { useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config/api';

// Temporary protected dashboard used to confirm auth and backend connectivity.
export default function DashboardPage() {
  const { user, getAuthorizedHeaders } = useAuth();
  const [apiResult, setApiResult] = useState('');

  const checkMeEndpoint = async () => {
    setApiResult('Checking /api/auth/me...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || 'Request failed');
      }
      setApiResult(`Connected: ${body.email || 'user loaded'}`);
    } catch (error) {
      setApiResult(`Error: ${error.message}`);
    }
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header card">
        <div>
          <h1>BioCNG SaaS Dashboard</h1>
          <p className="dashboard-meta">
            Logged in as <strong>{user?.name || '-'}</strong> ({user?.role || '-'}) | Tenant: {user?.tenantId || '-'}
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={checkMeEndpoint}>
          Test Backend
        </button>
      </header>

      <section className="card">
        <h2>Frontend Step 2 Layout Active</h2>
        <p>
          Navigation shell and protected module routing are now active.
          Next step is to connect module pages with real API data and forms.
        </p>
        {apiResult ? <p className="dashboard-meta">{apiResult}</p> : null}
      </section>
    </main>
  );
}
