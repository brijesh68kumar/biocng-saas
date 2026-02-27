import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config/api';

// First real module page: list and create feedstock master records.
export default function FeedstockTypesPage() {
  const { getAuthorizedHeaders } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [uom, setUom] = useState('ton');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load current feedstock list from backend.
  const loadFeedstockTypes = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedstock-types`, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to load feedstock types');
      }
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load feedstock types');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthorizedHeaders]);

  useEffect(() => {
    loadFeedstockTypes();
  }, [loadFeedstockTypes]);

  // Create feedstock type and refresh list.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/feedstock-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          uom,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to create feedstock type');
      }

      setCode('');
      setName('');
      setUom('ton');
      setSuccessText('Feedstock type created successfully.');
      await loadFeedstockTypes();
    } catch (error) {
      setErrorText(error.message || 'Unable to create feedstock type');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <section className="card">
        <h1>Feedstock Types</h1>
        <p className="dashboard-meta">
          Create and view feedstock master records used in crop, intake, and invoice workflows.
        </p>
      </section>

      <section className="card">
        <h2>Create Feedstock Type</h2>
        <form className="module-form" onSubmit={handleCreate}>
          <label className="auth-label" htmlFor="feedstockCode">
            Code
            <input
              id="feedstockCode"
              className="auth-input"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="FS-MAIZE-SILAGE"
              required
            />
          </label>

          <label className="auth-label" htmlFor="feedstockName">
            Name
            <input
              id="feedstockName"
              className="auth-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Maize Silage"
              required
            />
          </label>

          <label className="auth-label" htmlFor="feedstockUom">
            UOM
            <select id="feedstockUom" className="auth-input" value={uom} onChange={(event) => setUom(event.target.value)}>
              <option value="ton">ton</option>
              <option value="kg">kg</option>
              <option value="bundle">bundle</option>
            </select>
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
        <h2>Feedstock List</h2>
        {isLoading ? <p className="dashboard-meta">Loading feedstock types...</p> : null}
        {!isLoading && items.length === 0 ? <p className="dashboard-meta">No feedstock types found.</p> : null}
        {!isLoading && items.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>UOM</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.uom}</td>
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
