import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import ListToolbar from '../components/ListToolbar';
import { formatDate } from '../utils/formatters';

const partyTypes = ['farmer', 'collection-center', 'land-lease', 'supplier'];
const adjustmentOperators = ['lt', 'lte', 'gt', 'gte', 'eq'];

const createEmptyRule = () => ({
  metric: 'moisturePercent',
  operator: 'lte',
  value: '0',
  adjustmentPerTon: '0',
});

// Converts rule editor rows into backend payload with number-safe fields.
const normalizeRules = (rows) =>
  (rows || [])
    .filter((row) => String(row.metric || '').trim())
    .map((row) => ({
      metric: String(row.metric || '').trim(),
      operator: row.operator || 'lte',
      value: Number(row.value || 0),
      adjustmentPerTon: Number(row.adjustmentPerTon || 0),
    }))
    .filter((row) => !Number.isNaN(row.value) && !Number.isNaN(row.adjustmentPerTon));

// Creates frontend draft rows from backend quality adjustment records.
const draftRulesFromPayload = (rows) =>
  (rows || []).map((row) => ({
    metric: row.metric || 'moisturePercent',
    operator: row.operator || 'lte',
    value: String(row.value ?? 0),
    adjustmentPerTon: String(row.adjustmentPerTon ?? 0),
  }));

// Rate cards page: manage effective rate rows and quality adjustment rules.
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
  const [createRules, setCreateRules] = useState([createEmptyRule()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editDrafts, setEditDrafts] = useState({});
  const [selectedRulesRateId, setSelectedRulesRateId] = useState('');
  const [rulesEditorRows, setRulesEditorRows] = useState([createEmptyRule()]);

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
          qualityAdjustments: draftRulesFromPayload(row.qualityAdjustments || []),
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

  // Create new rate card version row with optional quality rules.
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
          qualityAdjustments: normalizeRules(createRules),
        }),
      });

      setPartyId('');
      setEffectiveFrom('');
      setRatePerTon('0');
      setCreateRules([createEmptyRule()]);
      setSuccessText('Rate card created successfully.');
      await loadRateCards();
    } catch (error) {
      setErrorText(error.message || 'Unable to create rate card');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save row update for editable fields including quality rules.
  const handleUpdate = async (rowId, overrideDraft = null) => {
    setErrorText('');
    setSuccessText('');
    try {
      const draft = overrideDraft || editDrafts[rowId];
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
          qualityAdjustments: normalizeRules(draft.qualityAdjustments || []),
        }),
      });

      setSuccessText('Rate card updated successfully.');
      await loadRateCards();
    } catch (error) {
      setErrorText(error.message || 'Unable to update rate card');
    }
  };

  // Opens dedicated rule editor for one selected rate card row.
  const handleOpenRulesEditor = (rowId) => {
    const draft = editDrafts[rowId];
    setSelectedRulesRateId(rowId);
    setRulesEditorRows(
      draft && Array.isArray(draft.qualityAdjustments) && draft.qualityAdjustments.length > 0
        ? draft.qualityAdjustments
        : [createEmptyRule()]
    );
  };

  // Saves selected rule editor rows into row draft and persists to backend.
  const handleSaveRules = async () => {
    if (!selectedRulesRateId) return;

    const mergedDraft = {
      ...(editDrafts[selectedRulesRateId] || {}),
      qualityAdjustments: rulesEditorRows,
    };

    setEditDrafts((prev) => ({
      ...prev,
      [selectedRulesRateId]: mergedDraft,
    }));

    await handleUpdate(selectedRulesRateId, mergedDraft);
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
    qualityRuleCount: (item.qualityAdjustments || []).length,
    isActive: item.isActive ? 'yes' : 'no',
  }));

  return (
    <div>
      <section className="card">
        <h1>Rate Cards</h1>
        <p className="dashboard-meta">Manage effective pricing rows and quality-adjustment rules for procurement.</p>
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
              <strong>Quality Rules (Optional)</strong>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setCreateRules((prev) => [...prev, createEmptyRule()])}
              >
                Add Rule
              </button>
            </div>

            {createRules.map((rule, index) => (
              <div key={`create-rule-${index}`} className="table-inline">
                <input
                  className="auth-input"
                  value={rule.metric}
                  onChange={(event) =>
                    setCreateRules((prev) =>
                      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, metric: event.target.value } : row))
                    )
                  }
                  placeholder="metric (e.g. moisturePercent)"
                />
                <select
                  className="auth-input"
                  value={rule.operator}
                  onChange={(event) =>
                    setCreateRules((prev) =>
                      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, operator: event.target.value } : row))
                    )
                  }
                >
                  {adjustmentOperators.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  className="auth-input"
                  value={rule.value}
                  onChange={(event) =>
                    setCreateRules((prev) =>
                      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, value: event.target.value } : row))
                    )
                  }
                  placeholder="threshold"
                />
                <input
                  type="number"
                  step="0.01"
                  className="auth-input"
                  value={rule.adjustmentPerTon}
                  onChange={(event) =>
                    setCreateRules((prev) =>
                      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, adjustmentPerTon: event.target.value } : row))
                    )
                  }
                  placeholder="adjustmentPerTon"
                />
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    setCreateRules((prev) => {
                      const next = prev.filter((_, rowIndex) => rowIndex !== index);
                      return next.length > 0 ? next : [createEmptyRule()];
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}

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
            <p className="dashboard-meta">Quality Rules: {(resolvedRate.qualityAdjustments || []).length}</p>
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
                  <th>Quality Rules</th>
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
                    <td>{(item.qualityAdjustments || []).length}</td>
                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="table-inline">
                        <button className="secondary-button" type="button" onClick={() => handleUpdate(item._id)}>
                          Save
                        </button>
                        <button className="secondary-button" type="button" onClick={() => handleOpenRulesEditor(item._id)}>
                          Edit Rules
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

      {selectedRulesRateId ? (
        <section className="card">
          <h2>Quality Rules Editor</h2>
          <p className="dashboard-meta">Editing rules for rate card ID: {selectedRulesRateId}</p>

          <div className="module-actions">
            <button className="secondary-button" type="button" onClick={() => setRulesEditorRows((prev) => [...prev, createEmptyRule()])}>
              Add Rule
            </button>
            <button className="auth-button" type="button" onClick={handleSaveRules}>
              Save Rules
            </button>
            <button className="secondary-button" type="button" onClick={() => setSelectedRulesRateId('')}>
              Close Editor
            </button>
          </div>

          {rulesEditorRows.map((rule, index) => (
            <div key={`edit-rule-${index}`} className="table-inline">
              <input
                className="auth-input"
                value={rule.metric}
                onChange={(event) =>
                  setRulesEditorRows((prev) =>
                    prev.map((row, rowIndex) => (rowIndex === index ? { ...row, metric: event.target.value } : row))
                  )
                }
                placeholder="metric (e.g. moisturePercent)"
              />
              <select
                className="auth-input"
                value={rule.operator}
                onChange={(event) =>
                  setRulesEditorRows((prev) =>
                    prev.map((row, rowIndex) => (rowIndex === index ? { ...row, operator: event.target.value } : row))
                  )
                }
              >
                {adjustmentOperators.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                className="auth-input"
                value={rule.value}
                onChange={(event) =>
                  setRulesEditorRows((prev) =>
                    prev.map((row, rowIndex) => (rowIndex === index ? { ...row, value: event.target.value } : row))
                  )
                }
                placeholder="threshold"
              />
              <input
                type="number"
                step="0.01"
                className="auth-input"
                value={rule.adjustmentPerTon}
                onChange={(event) =>
                  setRulesEditorRows((prev) =>
                    prev.map((row, rowIndex) => (rowIndex === index ? { ...row, adjustmentPerTon: event.target.value } : row))
                  )
                }
                placeholder="adjustmentPerTon"
              />
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setRulesEditorRows((prev) => {
                    const next = prev.filter((_, rowIndex) => rowIndex !== index);
                    return next.length > 0 ? next : [createEmptyRule()];
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
