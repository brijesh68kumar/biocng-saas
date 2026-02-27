import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config/api';

// Collection centers module page: list and create center master records.
export default function CollectionCentersPage() {
  const { getAuthorizedHeaders } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [managerName, setManagerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load center list from backend.
  const loadCollectionCenters = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/collection-centers`, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to load collection centers');
      }
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load collection centers');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthorizedHeaders]);

  useEffect(() => {
    loadCollectionCenters();
  }, [loadCollectionCenters]);

  // Create center and refresh list.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/collection-centers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          location: location.trim(),
          managerName: managerName.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to create collection center');
      }

      setCode('');
      setName('');
      setLocation('');
      setManagerName('');
      setSuccessText('Collection center created successfully.');
      await loadCollectionCenters();
    } catch (error) {
      setErrorText(error.message || 'Unable to create collection center');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <section className="card">
        <h1>Collection Centers</h1>
        <p className="dashboard-meta">
          Create and view collection center master records used for feedstock receipt and stock flow.
        </p>
      </section>

      <section className="card">
        <h2>Create Collection Center</h2>
        <form className="module-form" onSubmit={handleCreate}>
          <label className="auth-label" htmlFor="centerCode">
            Code
            <input
              id="centerCode"
              className="auth-input"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="CC-001"
              required
            />
          </label>

          <label className="auth-label" htmlFor="centerName">
            Name
            <input
              id="centerName"
              className="auth-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="North Cluster Center"
              required
            />
          </label>

          <label className="auth-label" htmlFor="centerLocation">
            Location
            <input
              id="centerLocation"
              className="auth-input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Sector 8, District A"
            />
          </label>

          <label className="auth-label" htmlFor="centerManager">
            Manager Name
            <input
              id="centerManager"
              className="auth-input"
              value={managerName}
              onChange={(event) => setManagerName(event.target.value)}
              placeholder="Suresh Kumar"
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
      </section>

      <section className="card">
        <h2>Collection Centers List</h2>
        {isLoading ? <p className="dashboard-meta">Loading collection centers...</p> : null}
        {!isLoading && items.length === 0 ? <p className="dashboard-meta">No collection centers found.</p> : null}
        {!isLoading && items.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Manager</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.location || '-'}</td>
                    <td>{item.managerName || '-'}</td>
                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
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
