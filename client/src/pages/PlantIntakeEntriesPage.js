import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthContext';

// Plant intake entries page: list and create intake/weighbridge records.
export default function PlantIntakeEntriesPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [dispatchTrips, setDispatchTrips] = useState([]);
  const [feedstockTypes, setFeedstockTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [dispatchTripId, setDispatchTripId] = useState('');
  const [feedstockTypeId, setFeedstockTypeId] = useState('');
  const [sourceType, setSourceType] = useState('collection-center');
  const [sourceRefId, setSourceRefId] = useState('');
  const [grossWeightTon, setGrossWeightTon] = useState('0');
  const [tareWeightTon, setTareWeightTon] = useState('0');
  const [netWeightTon, setNetWeightTon] = useState('0');
  const [moisturePercent, setMoisturePercent] = useState('');
  const [contaminationPercent, setContaminationPercent] = useState('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [acceptedQtyTon, setAcceptedQtyTon] = useState('0');
  const [rejectedQtyTon, setRejectedQtyTon] = useState('0');
  const [rejectionReason, setRejectionReason] = useState('');
  const [intakeDate, setIntakeDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dropdown options.
  const loadOptions = useCallback(async () => {
    setIsOptionsLoading(true);
    try {
      const [trips, feedstocks] = await Promise.all([authRequest('/api/dispatch-trips'), authRequest('/api/feedstock-types')]);
      const tripArr = Array.isArray(trips) ? trips : [];
      const feedstockArr = Array.isArray(feedstocks) ? feedstocks : [];
      setDispatchTrips(tripArr);
      setFeedstockTypes(feedstockArr);
      if (tripArr.length > 0) setDispatchTripId(tripArr[0]._id);
      if (feedstockArr.length > 0) setFeedstockTypeId(feedstockArr[0]._id);
    } catch (error) {
      setErrorText(error.message || 'Unable to load dropdown data');
    } finally {
      setIsOptionsLoading(false);
    }
  }, [authRequest]);

  // Load intake list.
  const loadIntakeEntries = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/plant-intake-entries');
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(error.message || 'Unable to load intake entries');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadOptions();
    loadIntakeEntries();
  }, [loadOptions, loadIntakeEntries]);

  // Create intake entry and refresh list.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const gross = Number(grossWeightTon);
      const tare = Number(tareWeightTon);
      const net = Number(netWeightTon);
      const accepted = Number(acceptedQtyTon);
      const rejected = Number(rejectedQtyTon);

      if ([gross, tare, net, accepted, rejected].some((x) => Number.isNaN(x))) {
        throw new Error('Weight and quantity fields must be valid numbers');
      }

      await authRequest('/api/plant-intake-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatchTripId: dispatchTripId || undefined,
          feedstockTypeId,
          sourceType,
          sourceRefId: sourceRefId || undefined,
          grossWeightTon: gross,
          tareWeightTon: tare,
          netWeightTon: net,
          moisturePercent: moisturePercent ? Number(moisturePercent) : undefined,
          contaminationPercent: contaminationPercent ? Number(contaminationPercent) : undefined,
          qualityGrade: qualityGrade || undefined,
          acceptedQtyTon: accepted,
          rejectedQtyTon: rejected,
          rejectionReason: rejectionReason || undefined,
          intakeDate,
          notes: notes.trim(),
        }),
      });

      setSourceRefId('');
      setGrossWeightTon('0');
      setTareWeightTon('0');
      setNetWeightTon('0');
      setMoisturePercent('');
      setContaminationPercent('');
      setQualityGrade('');
      setAcceptedQtyTon('0');
      setRejectedQtyTon('0');
      setRejectionReason('');
      setIntakeDate('');
      setNotes('');
      setSuccessText('Plant intake entry created successfully.');
      await loadIntakeEntries();
    } catch (error) {
      setErrorText(error.message || 'Unable to create intake entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <section className="card">
        <h1>Plant Intake Entries</h1>
        <p className="dashboard-meta">Create and view weighbridge intake entries with quality and acceptance details.</p>
      </section>

      <section className="card">
        <h2>Create Plant Intake Entry</h2>
        {isOptionsLoading ? <p className="dashboard-meta">Loading form options...</p> : null}
        {!isOptionsLoading ? (
          <form className="module-form" onSubmit={handleCreate}>
            <label className="auth-label" htmlFor="pieDispatchTripId">
              Dispatch Trip
              <select id="pieDispatchTripId" className="auth-input" value={dispatchTripId} onChange={(event) => setDispatchTripId(event.target.value)}>
                <option value="">Select None</option>
                {dispatchTrips.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.tripCode}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="pieFeedstockTypeId">
              Feedstock Type
              <select
                id="pieFeedstockTypeId"
                className="auth-input"
                value={feedstockTypeId}
                onChange={(event) => setFeedstockTypeId(event.target.value)}
                required
              >
                {feedstockTypes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="pieSourceType">
              Source Type
              <select id="pieSourceType" className="auth-input" value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                <option value="farmer">farmer</option>
                <option value="collection-center">collection-center</option>
                <option value="own-farm">own-farm</option>
                <option value="supplier">supplier</option>
              </select>
            </label>

            <label className="auth-label" htmlFor="pieSourceRefId">
              Source Ref ID
              <input id="pieSourceRefId" className="auth-input" value={sourceRefId} onChange={(event) => setSourceRefId(event.target.value)} />
            </label>

            <label className="auth-label" htmlFor="pieGrossWeightTon">
              Gross Weight (Ton)
              <input
                id="pieGrossWeightTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={grossWeightTon}
                onChange={(event) => setGrossWeightTon(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="pieTareWeightTon">
              Tare Weight (Ton)
              <input
                id="pieTareWeightTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={tareWeightTon}
                onChange={(event) => setTareWeightTon(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="pieNetWeightTon">
              Net Weight (Ton)
              <input
                id="pieNetWeightTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={netWeightTon}
                onChange={(event) => setNetWeightTon(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="pieAcceptedQtyTon">
              Accepted Qty (Ton)
              <input
                id="pieAcceptedQtyTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={acceptedQtyTon}
                onChange={(event) => setAcceptedQtyTon(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="pieRejectedQtyTon">
              Rejected Qty (Ton)
              <input
                id="pieRejectedQtyTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={rejectedQtyTon}
                onChange={(event) => setRejectedQtyTon(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="pieIntakeDate">
              Intake Date
              <input
                id="pieIntakeDate"
                type="date"
                className="auth-input"
                value={intakeDate}
                onChange={(event) => setIntakeDate(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="pieQualityGrade">
              Quality Grade
              <input id="pieQualityGrade" className="auth-input" value={qualityGrade} onChange={(event) => setQualityGrade(event.target.value)} />
            </label>

            <label className="auth-label" htmlFor="pieMoisturePercent">
              Moisture %
              <input
                id="pieMoisturePercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="auth-input"
                value={moisturePercent}
                onChange={(event) => setMoisturePercent(event.target.value)}
              />
            </label>

            <label className="auth-label" htmlFor="pieContaminationPercent">
              Contamination %
              <input
                id="pieContaminationPercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="auth-input"
                value={contaminationPercent}
                onChange={(event) => setContaminationPercent(event.target.value)}
              />
            </label>

            <label className="auth-label" htmlFor="pieRejectionReason">
              Rejection Reason
              <input
                id="pieRejectionReason"
                className="auth-input"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
              />
            </label>

            <label className="auth-label" htmlFor="pieNotes">
              Notes
              <input id="pieNotes" className="auth-input" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>

            <div className="module-actions">
              <button className="auth-button" type="submit" disabled={isSubmitting || !feedstockTypeId}>
                {isSubmitting ? 'Saving...' : 'Create'}
              </button>
            </div>

            {errorText ? <p className="auth-error">{errorText}</p> : null}
            {successText ? <p className="module-success">{successText}</p> : null}
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2>Plant Intake Entries List</h2>
        {isLoading ? <p className="dashboard-meta">Loading intake entries...</p> : null}
        {!isLoading && items.length === 0 ? <p className="dashboard-meta">No intake entries found.</p> : null}
        {!isLoading && items.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Intake Code</th>
                  <th>Source Type</th>
                  <th>Intake Date</th>
                  <th>Gross</th>
                  <th>Tare</th>
                  <th>Net</th>
                  <th>Accepted</th>
                  <th>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.intakeCode}</td>
                    <td>{item.sourceType}</td>
                    <td>{item.intakeDate ? new Date(item.intakeDate).toLocaleDateString() : '-'}</td>
                    <td>{item.grossWeightTon}</td>
                    <td>{item.tareWeightTon}</td>
                    <td>{item.netWeightTon}</td>
                    <td>{item.acceptedQtyTon}</td>
                    <td>{item.rejectedQtyTon}</td>
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

