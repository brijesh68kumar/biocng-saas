import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';

// Land parcels module page: list and create parcel master records.
export default function LandParcelsPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [parcelCode, setParcelCode] = useState('');
  const [landType, setLandType] = useState('rented');
  const [lessorName, setLessorName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [areaAcres, setAreaAcres] = useState('0');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [rentPerAcrePerYear, setRentPerAcrePerYear] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load parcel list from backend.
  const loadLandParcels = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/land-parcels');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load land parcels');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadLandParcels();
  }, [loadLandParcels]);

  // Create parcel and refresh list.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const area = Number(areaAcres);
      const rent = Number(rentPerAcrePerYear);
      if (Number.isNaN(area) || area < 0) {
        throw new Error('areaAcres must be a valid non-negative number');
      }
      if (Number.isNaN(rent) || rent < 0) {
        throw new Error('rentPerAcrePerYear must be a valid non-negative number');
      }

      await authRequest('/api/land-parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelCode: parcelCode.trim(),
          landType,
          lessorName: lessorName.trim(),
          village: village.trim(),
          district: district.trim(),
          areaAcres: area,
          leaseStartDate: leaseStartDate || undefined,
          leaseEndDate: leaseEndDate || undefined,
          rentPerAcrePerYear: rent,
        }),
      });

      setParcelCode('');
      setLandType('rented');
      setLessorName('');
      setVillage('');
      setDistrict('');
      setAreaAcres('0');
      setLeaseStartDate('');
      setLeaseEndDate('');
      setRentPerAcrePerYear('0');
      setSuccessText('Land parcel created successfully.');
      await loadLandParcels();
    } catch (error) {
      setErrorText(error.message || 'Unable to create land parcel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <section className="card">
        <h1>Land Parcels</h1>
        <p className="dashboard-meta">Create and view land parcels for own/rented feedstock cultivation planning.</p>
      </section>

      <section className="card">
        <h2>Create Land Parcel</h2>
        <form className="module-form" onSubmit={handleCreate}>
          <label className="auth-label" htmlFor="parcelCode">
            Parcel Code
            <input
              id="parcelCode"
              className="auth-input"
              value={parcelCode}
              onChange={(event) => setParcelCode(event.target.value)}
              placeholder="LP-001"
              required
            />
          </label>

          <label className="auth-label" htmlFor="landType">
            Land Type
            <select id="landType" className="auth-input" value={landType} onChange={(event) => setLandType(event.target.value)}>
              <option value="rented">rented</option>
              <option value="owned">owned</option>
            </select>
          </label>

          <label className="auth-label" htmlFor="lessorName">
            Lessor Name
            <input
              id="lessorName"
              className="auth-input"
              value={lessorName}
              onChange={(event) => setLessorName(event.target.value)}
              placeholder="Land Owner Name"
            />
          </label>

          <label className="auth-label" htmlFor="village">
            Village
            <input
              id="village"
              className="auth-input"
              value={village}
              onChange={(event) => setVillage(event.target.value)}
              placeholder="Village Name"
            />
          </label>

          <label className="auth-label" htmlFor="district">
            District
            <input
              id="district"
              className="auth-input"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              placeholder="District Name"
            />
          </label>

          <label className="auth-label" htmlFor="areaAcres">
            Area (Acres)
            <input
              id="areaAcres"
              type="number"
              min="0"
              step="0.01"
              className="auth-input"
              value={areaAcres}
              onChange={(event) => setAreaAcres(event.target.value)}
              required
            />
          </label>

          <label className="auth-label" htmlFor="leaseStartDate">
            Lease Start Date
            <input
              id="leaseStartDate"
              type="date"
              className="auth-input"
              value={leaseStartDate}
              onChange={(event) => setLeaseStartDate(event.target.value)}
            />
          </label>

          <label className="auth-label" htmlFor="leaseEndDate">
            Lease End Date
            <input
              id="leaseEndDate"
              type="date"
              className="auth-input"
              value={leaseEndDate}
              onChange={(event) => setLeaseEndDate(event.target.value)}
            />
          </label>

          <label className="auth-label" htmlFor="rentPerAcrePerYear">
            Rent Per Acre Per Year
            <input
              id="rentPerAcrePerYear"
              type="number"
              min="0"
              step="0.01"
              className="auth-input"
              value={rentPerAcrePerYear}
              onChange={(event) => setRentPerAcrePerYear(event.target.value)}
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
        <h2>Land Parcels List</h2>
        {isLoading ? <p className="dashboard-meta">Loading land parcels...</p> : null}
        {!isLoading && items.length === 0 ? <p className="dashboard-meta">No land parcels found.</p> : null}
        {!isLoading && items.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Parcel Code</th>
                  <th>Type</th>
                  <th>Village</th>
                  <th>District</th>
                  <th>Area (Acres)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.parcelCode}</td>
                    <td>{item.landType || '-'}</td>
                    <td>{item.village || '-'}</td>
                    <td>{item.district || '-'}</td>
                    <td>{item.areaAcres}</td>
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

