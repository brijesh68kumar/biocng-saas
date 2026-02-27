import { downloadCsv } from '../utils/csv';

// Reusable toolbar for search/filter and CSV export across module list tables.
export default function ListToolbar({ title = 'List Controls', searchTerm, onSearchTermChange, exportRows, exportFile }) {
  return (
    <div className="list-toolbar">
      <div className="list-toolbar-left">
        <h3>{title}</h3>
        <input
          className="auth-input list-search-input"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Search records..."
        />
      </div>
      <button
        className="secondary-button"
        type="button"
        onClick={() => downloadCsv(exportFile || 'export.csv', exportRows || [])}
        disabled={!exportRows || exportRows.length === 0}
      >
        Export CSV
      </button>
    </div>
  );
}

