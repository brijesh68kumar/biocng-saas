import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import ListToolbar from '../components/ListToolbar';

// Farmers module page: list and create farmer master records.
export default function FarmersPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load farmer list from backend.
  const loadFarmers = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/farmers');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load farmers');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  // Create farmer and refresh list.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      await authRequest('/api/farmers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          mobile: mobile.trim(),
          village: village.trim(),
        }),
      });

      setCode('');
      setName('');
      setMobile('');
      setVillage('');
      setSuccessText('Farmer created successfully.');
      await loadFarmers();
    } catch (error) {
      setErrorText(error.message || 'Unable to create farmer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => JSON.stringify(item || {}).toLowerCase().includes(normalizedSearch));
  const exportRows = filteredItems.map((item) => ({
    code: item.code,
    name: item.name,
    mobile: item.mobile || '',
    village: item.village || '',
    status: item.isActive ? 'Active' : 'Inactive',
  }));

  return (
    <div>
      <section className="card">
        <h1>Farmers</h1>
        <p className="dashboard-meta">
          Create and view farmer master records for procurement and weekly invoice generation.
        </p>
      </section>

      <section className="card">
        <h2>Create Farmer</h2>
        <form className="module-form" onSubmit={handleCreate}>
          <label className="auth-label" htmlFor="farmerCode">
            Code
            <input
              id="farmerCode"
              className="auth-input"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="FAR-001"
              required
            />
          </label>

          <label className="auth-label" htmlFor="farmerName">
            Name
            <input
              id="farmerName"
              className="auth-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ramesh Patel"
              required
            />
          </label>

          <label className="auth-label" htmlFor="farmerMobile">
            Mobile
            <input
              id="farmerMobile"
              className="auth-input"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              placeholder="9000000000"
            />
          </label>

          <label className="auth-label" htmlFor="farmerVillage">
            Village
            <input
              id="farmerVillage"
              className="auth-input"
              value={village}
              onChange={(event) => setVillage(event.target.value)}
              placeholder="Rampur"
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
        <h2>Farmers List</h2>
        <ListToolbar
          title="Farmers List Controls"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          exportRows={exportRows}
          exportFile="farmers.csv"
        />
        {isLoading ? <p className="dashboard-meta">Loading farmers...</p> : null}
        {!isLoading && filteredItems.length === 0 ? <p className="dashboard-meta">No farmers found.</p> : null}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Village</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.mobile || '-'}</td>
                    <td>{item.village || '-'}</td>
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
