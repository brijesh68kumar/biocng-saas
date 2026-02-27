import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';

// Vehicles module page: list and create vehicle master records.
export default function VehiclesPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [number, setNumber] = useState('');
  const [capacityTon, setCapacityTon] = useState('0');
  const [ownerType, setOwnerType] = useState('contracted');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load vehicle list from backend.
  const loadVehicles = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/vehicles');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load vehicles');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Create vehicle and refresh list.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const parsedCapacity = Number(capacityTon);
      if (Number.isNaN(parsedCapacity) || parsedCapacity < 0) {
        throw new Error('capacityTon must be a valid non-negative number');
      }

      await authRequest('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: number.trim(),
          capacityTon: parsedCapacity,
          ownerType,
        }),
      });

      setNumber('');
      setCapacityTon('0');
      setOwnerType('contracted');
      setSuccessText('Vehicle created successfully.');
      await loadVehicles();
    } catch (error) {
      setErrorText(error.message || 'Unable to create vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <section className="card">
        <h1>Vehicles</h1>
        <p className="dashboard-meta">
          Create and view vehicle master records used in dispatch and transport operations.
        </p>
      </section>

      <section className="card">
        <h2>Create Vehicle</h2>
        <form className="module-form" onSubmit={handleCreate}>
          <label className="auth-label" htmlFor="vehicleNumber">
            Vehicle Number
            <input
              id="vehicleNumber"
              className="auth-input"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              placeholder="GJ01AB1234"
              required
            />
          </label>

          <label className="auth-label" htmlFor="vehicleCapacity">
            Capacity (Ton)
            <input
              id="vehicleCapacity"
              type="number"
              min="0"
              step="0.1"
              className="auth-input"
              value={capacityTon}
              onChange={(event) => setCapacityTon(event.target.value)}
              required
            />
          </label>

          <label className="auth-label" htmlFor="vehicleOwnerType">
            Owner Type
            <select
              id="vehicleOwnerType"
              className="auth-input"
              value={ownerType}
              onChange={(event) => setOwnerType(event.target.value)}
            >
              <option value="contracted">contracted</option>
              <option value="owned">owned</option>
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
        <h2>Vehicles List</h2>
        {isLoading ? <p className="dashboard-meta">Loading vehicles...</p> : null}
        {!isLoading && items.length === 0 ? <p className="dashboard-meta">No vehicles found.</p> : null}
        {!isLoading && items.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Capacity (Ton)</th>
                  <th>Owner Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.number}</td>
                    <td>{item.capacityTon}</td>
                    <td>{item.ownerType}</td>
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
