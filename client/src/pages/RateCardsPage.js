import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import ListToolbar from '../components/ListToolbar';
import { formatDate } from '../utils/formatters';

const partyTypes = ['farmer', 'collection-center', 'land-lease', 'supplier'];

// Rate cards page: manage effective rate rows and resolve active rates by date.
export default function RateCardsPage() {
  const { authRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [feedstockTypes, setFeedstockTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [partyType, setPartyType] = useState('collection-center');
  const [partyId, setPartyId] = useState('');
  const [feedstockTypeId, setFeedstockTypeId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [ratePerTon, setRatePerTon] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editDrafts, setEditDrafts] = useState({});

  const [resolvePartyType, setResolvePartyType] = useState('collection-center');
  const [resolvePartyId, setResolvePartyId] = useState('');
  const [resolveFeedstockTypeId, setResolveFeedstockTypeId] = useState('');
  const [resolveAsOf, setResolveAsOf] = useState('');
  const [resolvedRate, setResolvedRate] = useState(null);

  // Load feedstock options for create/resolve forms.
  const loadOptions = useCallback(async () => {
    setIsOptionsLoading(true);
    try {
      const payload = await authRequest('/api/feedstock-types');
      const arr = Array.isArray(payload) ? payload : [];
      setFeedstockTypes(arr);
      if (arr.length > 0) {
        setFeedstockTypeId(arr[0]._id);
        setResolveFeedstockTypeId(arr[0]._id);
      }
    } catch (error) {
      setErrorText(error.message || 'Unable to load feedstock options');
    } finally {
      setIsOptionsLoading(false);
    }
  }, [authRequest]);

  // Load current rate cards and initialize row edit drafts.
  const loadRateCards = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const payload = await authRequest('/api/rate-cards');
      const arr = Array.isArray(payload) ? payload : [];
      setItems(arr);

      const draftMap = {};
      arr.forEach((row) => {
        draftMap[row._id] = {
          ratePerTon: String(row.ratePerTon ?? 0),
          effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom).toISOString().slice(0, 10) : '',
        };
      });
      setEditDrafts(draftMap);
    } catch (error) {
      setErrorText(error.message || 'Unable to load rate cards');
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    loadOptions();
    loadRateCards();
  }, [loadOptions, loadRateCards]);

  // Create new rate card version row.
  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsSubmitting(true);

    try {
      const parsedRate = Number(ratePerTon);
      if (Number.isNaN(parsedRate) || parsedRate < 0) {
        throw new Error('ratePerTon must be a valid non-negative number');
      }

      await authRequest('/api/rate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyType,
          partyId: partyId.trim(),
          feedstockTypeId,
          effectiveFrom,
          ratePerTon: parsedRate,
          qualityAdjustments: [],
        }),
      });

      setPartyId('');
      setEffectiveFrom('');
      setRatePerTon('0');
      setSuccessText('Rate card created successfully.');
      await loadRateCards();
    } catch (error) {
      setErrorText(error.message || 'Unable to create rate card');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save a row update for editable fields.
  const handleUpdate = async (rowId) => {
    setErrorText('');
    setSuccessText('');
    try {
      const draft = editDrafts[rowId];
      if (!draft) return;

      const parsedRate = Number(draft.ratePerTon);
      if (Number.isNaN(parsedRate) || parsedRate < 0) {
        throw new Error('ratePerTon must be a valid non-negative number');
      }

      await authRequest(`/api/rate-cards/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratePerTon: parsedRate,
          effectiveFrom: draft.effectiveFrom,
        }),
      });

      setSuccessText('Rate card updated successfully.');
      await loadRateCards();
    } catch (error) {
      setErrorText(error.message || 'Unable to update rate card');
    }
  };

  // Deactivate one row to stop future resolution while keeping history.
  const handleDeactivate = async (rowId) => {
    setErrorText('');
    setSuccessText('');
    try {
      await authRequest(`/api/rate-cards/${rowId}/deactivate`, { method: 'PATCH' });
      setSuccessText('Rate card deactivated successfully.');
      await loadRateCards();
    } catch (error) {
      setErrorText(error.message || 'Unable to deactivate rate card');
    }
  };

  // Resolve active rate based on party, feedstock, and as-of date.
  const handleResolve = async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setResolvedRate(null);
    try {
      const params = new URLSearchParams({
        partyType: resolvePartyType,
        partyId: resolvePartyId.trim(),
        feedstockTypeId: resolveFeedstockTypeId,
      });
      if (resolveAsOf) {
        params.append('asOf', resolveAsOf);
      }

      const payload = await authRequest(`/api/rate-cards/resolve?${params.toString()}`);
      setResolvedRate(payload || null);
      setSuccessText('Rate resolved successfully.');
    } catch (error) {
      setErrorText(error.message || 'Unable to resolve rate card');
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = useMemo(
    () => items.filter((item) => JSON.stringify(item || {}).toLowerCase().includes(normalizedSearch)),
    [items, normalizedSearch]
  );
  const exportRows = filteredItems.map((item) => ({
    partyType: item.partyType,
    partyId: item.partyId,
    feedstockTypeId: item.feedstockTypeId,
    effectiveFrom: formatDate(item.effectiveFrom),
    ratePerTon: item.ratePerTon,
    isActive: item.isActive ? 'yes' : 'no',
  }));

  return (
    <div>
      <section className="card">
        <h1>Rate Cards</h1>
        <p className="dashboard-meta">Manage effective pricing rows and resolve rate by party/feedstock date context.</p>
      </section>

      <section className="card">
        <h2>Create Rate Card</h2>
        {isOptionsLoading ? <p className="dashboard-meta">Loading feedstock options...</p> : null}
        {!isOptionsLoading ? (
          <form className="module-form" onSubmit={handleCreate}>
            <label className="auth-label" htmlFor="rcPartyType">
              Party Type
              <select id="rcPartyType" className="auth-input" value={partyType} onChange={(event) => setPartyType(event.target.value)}>
                {partyTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-label" htmlFor="rcPartyId">
              Party ID
              <input
                id="rcPartyId"
                className="auth-input"
                value={partyId}
                onChange={(event) => setPartyId(event.target.value)}
                placeholder="CC-001 / FAR-001"
                required
              />
            </label>

            <label className="auth-label" htmlFor="rcFeedstockTypeId">
              Feedstock Type
              <select
                id="rcFeedstockTypeId"
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

            <label className="auth-label" htmlFor="rcEffectiveFrom">
              Effective From
              <input
                id="rcEffectiveFrom"
                type="date"
                className="auth-input"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
                required
              />
            </label>

            <label className="auth-label" htmlFor="rcRatePerTon">
              Rate Per Ton
              <input
                id="rcRatePerTon"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                value={ratePerTon}
                onChange={(event) => setRatePerTon(event.target.value)}
                required
              />
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
        <h2>Resolve Active Rate</h2>
        <form className="module-form" onSubmit={handleResolve}>
          <label className="auth-label" htmlFor="rcResolvePartyType">
            Party Type
            <select
              id="rcResolvePartyType"
              className="auth-input"
              value={resolvePartyType}
              onChange={(event) => setResolvePartyType(event.target.value)}
            >
              {partyTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-label" htmlFor="rcResolvePartyId">
            Party ID
            <input
              id="rcResolvePartyId"
              className="auth-input"
              value={resolvePartyId}
              onChange={(event) => setResolvePartyId(event.target.value)}
              placeholder="CC-001 / FAR-001"
              required
            />
          </label>

          <label className="auth-label" htmlFor="rcResolveFeedstockTypeId">
            Feedstock Type
            <select
              id="rcResolveFeedstockTypeId"
              className="auth-input"
              value={resolveFeedstockTypeId}
              onChange={(event) => setResolveFeedstockTypeId(event.target.value)}
              required
            >
              {feedstockTypes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-label" htmlFor="rcResolveAsOf">
            As Of Date (Optional)
            <input id="rcResolveAsOf" type="date" className="auth-input" value={resolveAsOf} onChange={(event) => setResolveAsOf(event.target.value)} />
          </label>

          <div className="module-actions">
            <button className="auth-button" type="submit" disabled={!resolveFeedstockTypeId}>
              Resolve
            </button>
          </div>
        </form>

        {resolvedRate ? (
          <div className="card">
            <h3>Resolved Result</h3>
            <p className="dashboard-meta">
              Party: {resolvedRate.partyType} | {resolvedRate.partyId}
            </p>
            <p className="dashboard-meta">Effective: {formatDate(resolvedRate.effectiveFrom)}</p>
            <p className="dashboard-meta">Rate Per Ton: {resolvedRate.ratePerTon}</p>
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Rate Cards List</h2>
        <ListToolbar
          title="Rate Cards Controls"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          exportRows={exportRows}
          exportFile="rate-cards.csv"
        />
        {isLoading ? <p className="dashboard-meta">Loading rate cards...</p> : null}
        {!isLoading && filteredItems.length === 0 ? <p className="dashboard-meta">No rate cards found.</p> : null}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Party Type</th>
                  <th>Party ID</th>
                  <th>Feedstock Type ID</th>
                  <th>Effective From</th>
                  <th>Rate Per Ton</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.partyType}</td>
                    <td>{item.partyId}</td>
                    <td>{item.feedstockTypeId}</td>
                    <td>
                      <input
                        type="date"
                        className="auth-input"
                        value={editDrafts[item._id]?.effectiveFrom || ''}
                        onChange={(event) =>
                          setEditDrafts((prev) => ({
                            ...prev,
                            [item._id]: {
                              ...(prev[item._id] || {}),
                              effectiveFrom: event.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="auth-input"
                        value={editDrafts[item._id]?.ratePerTon || '0'}
                        onChange={(event) =>
                          setEditDrafts((prev) => ({
                            ...prev,
                            [item._id]: {
                              ...(prev[item._id] || {}),
                              ratePerTon: event.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="table-inline">
                        <button className="secondary-button" type="button" onClick={() => handleUpdate(item._id)}>
                          Save
                        </button>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => handleDeactivate(item._id)}
                          disabled={!item.isActive}
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
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
