import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import ListToolbar from '../components/ListToolbar';

// Collection centers module page: list and create center master records.
export default function CollectionCentersPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [managerName, setManagerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load center list from backend.
  const loadCollectionCenters = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/collection-centers');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load collection centers');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

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
      await authRequest('/api/collection-centers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          location: location.trim(),
          managerName: managerName.trim(),
        }),
      });

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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => JSON.stringify(item || {}).toLowerCase().includes(normalizedSearch));
  const exportRows = filteredItems.map((item) => ({
    code: item.code,
    name: item.name,
    location: item.location || '',
    managerName: item.managerName || '',
    status: item.isActive ? 'Active' : 'Inactive',
  }));

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
        <ListToolbar
          title="Collection Centers Controls"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          exportRows={exportRows}
          exportFile="collection-centers.csv"
        />
        {isLoading ? <p className="dashboard-meta">Loading collection centers...</p> : null}
        {!isLoading && filteredItems.length === 0 ? <p className="dashboard-meta">No collection centers found.</p> : null}
        {!isLoading && filteredItems.length > 0 ? (
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
                {filteredItems.map((item) => (
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
