import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  MapPin,
  FileSpreadsheet,
  X,
  Search,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';

export default function DataValidationModal({
  isOpen,
  fileName,
  validationResult,
  onClose,
  onConfirmImport
}) {
  const [recordsState, setRecordsState] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (validationResult && validationResult.processedRecords) {
      setRecordsState(validationResult.processedRecords);
    }
  }, [validationResult]);

  if (!isOpen || !validationResult) return null;

  const summary = useMemo(() => {
    const total = recordsState.length;
    const selected = recordsState.filter((r) => r.included).length;
    const valid = recordsState.filter((r) => r.status === 'valid').length;
    const missing = recordsState.filter((r) => r.hasMissingInfo).length;
    const invalid = recordsState.filter((r) => r.status === 'invalid').length;
    const duplicates = recordsState.filter((r) => r.isDuplicate).length;
    const unverifiedLoc = recordsState.filter((r) => r.isLocationUnverified).length;
    const flagged = recordsState.filter((r) => r.status !== 'valid').length;

    return { total, selected, valid, missing, invalid, duplicates, unverifiedLoc, flagged };
  }, [recordsState]);

  const filteredRecords = useMemo(() => {
    return recordsState.filter((item) => {
      if (activeTab === 'valid' && item.status !== 'valid') return false;
      if (activeTab === 'invalid' && item.status !== 'invalid') return false;
      if (activeTab === 'flagged' && item.status === 'valid') return false;
      if (activeTab === 'duplicates' && !item.isDuplicate) return false;
      if (activeTab === 'unverifiedLoc' && !item.isLocationUnverified) return false;

      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const loc = (item.normalized.location || '').toLowerCase();
        const sec = (item.normalized.sector || '').toLowerCase();
        const weather = (item.normalized.weatherCondition || '').toLowerCase();
        const severity = (item.normalized.severity || '').toLowerCase();
        const rowStr = String(item.rowNumber);
        const issuesStr = item.issues.map((i) => i.message).join(' ').toLowerCase();

        return (
          loc.includes(q) ||
          sec.includes(q) ||
          weather.includes(q) ||
          severity.includes(q) ||
          rowStr.includes(q) ||
          issuesStr.includes(q)
        );
      }
      return true;
    });
  }, [recordsState, activeTab, searchTerm]);

  const handleToggleRecord = (rowNumber) => {
    setRecordsState((prev) =>
      prev.map((r) => (r.rowNumber === rowNumber ? { ...r, included: !r.included } : r))
    );
  };

  const handleSelectAll = () => {
    setRecordsState((prev) => prev.map((r) => ({ ...r, included: true })));
  };

  const handleDeselectAll = () => {
    setRecordsState((prev) => prev.map((r) => ({ ...r, included: false })));
  };

  const handleIncludeOnlyValid = () => {
    setRecordsState((prev) =>
      prev.map((r) => ({ ...r, included: r.status === 'valid' }))
    );
  };

  const handleExcludeFlagged = () => {
    setRecordsState((prev) =>
      prev.map((r) => ({ ...r, included: r.status === 'valid' }))
    );
  };

  const handleConfirm = () => {
    const selectedApproved = recordsState
      .filter((r) => r.included)
      .map((r) => r.normalized);

    onConfirmImport(selectedApproved, {
      totalUploaded: summary.total,
      selectedCount: summary.selected,
      validCount: summary.valid,
      invalidCount: summary.invalid,
      duplicateCount: summary.duplicates,
      unverifiedLocCount: summary.unverifiedLoc,
      excludedCount: summary.total - summary.selected
    });
  };

  return (
    <div className="validation-modal-backdrop" onClick={onClose}>
      <div className="validation-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="validation-modal-header">
          <div className="validation-modal-title-box">
            <div className="validation-title-row">
              <FileSpreadsheet size={18} className="validation-header-icon" />
              <h2 className="validation-modal-title">Data Cleaning & Validation Review</h2>
            </div>
            <p className="validation-modal-subtitle">
              Source file: <strong>{fileName}</strong> • Preprocessing records before analytics engine ingestion
            </p>
          </div>
          <button className="validation-modal-close" onClick={onClose} aria-label="Close review dialog">
            <X size={18} />
          </button>
        </div>

        <div className="validation-summary-grid">
          <div className="validation-stat-card">
            <div className="stat-card-label">Total Records</div>
            <div className="stat-card-value">{summary.total}</div>
            <div className="stat-card-sub">Parsed CSV rows</div>
          </div>

          <div className="validation-stat-card stat-valid">
            <div className="stat-card-label">Valid Records</div>
            <div className="stat-card-value text-emerald">{summary.valid}</div>
            <div className="stat-card-sub">Zero validation errors</div>
          </div>

          <div className="validation-stat-card stat-missing">
            <div className="stat-card-label">Missing Info</div>
            <div className="stat-card-value text-amber">{summary.missing}</div>
            <div className="stat-card-sub">Incomplete fields</div>
          </div>

          <div className="validation-stat-card stat-invalid">
            <div className="stat-card-label">Invalid Records</div>
            <div className="stat-card-value text-rose">{summary.invalid}</div>
            <div className="stat-card-sub">Errors in dates/numbers</div>
          </div>

          <div className="validation-stat-card stat-duplicate">
            <div className="stat-card-label">Potential Duplicates</div>
            <div className="stat-card-value text-orange">{summary.duplicates}</div>
            <div className="stat-card-sub">Matching incident keys</div>
          </div>

          <div className="validation-stat-card stat-location">
            <div className="stat-card-label">Location Verification</div>
            <div className="stat-card-value text-sky">{summary.unverifiedLoc}</div>
            <div className="stat-card-sub">Outside/unverified Chandigarh</div>
          </div>
        </div>

        <div className="validation-toolbar">
          <div className="validation-tabs">
            <button
              className={`validation-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Records ({summary.total})
            </button>
            <button
              className={`validation-tab ${activeTab === 'flagged' ? 'active' : ''}`}
              onClick={() => setActiveTab('flagged')}
            >
              Flagged Issues ({summary.flagged})
            </button>
            <button
              className={`validation-tab ${activeTab === 'valid' ? 'active' : ''}`}
              onClick={() => setActiveTab('valid')}
            >
              Valid ({summary.valid})
            </button>
            <button
              className={`validation-tab ${activeTab === 'invalid' ? 'active' : ''}`}
              onClick={() => setActiveTab('invalid')}
            >
              Invalid ({summary.invalid})
            </button>
            <button
              className={`validation-tab ${activeTab === 'duplicates' ? 'active' : ''}`}
              onClick={() => setActiveTab('duplicates')}
            >
              Duplicates ({summary.duplicates})
            </button>
            <button
              className={`validation-tab ${activeTab === 'unverifiedLoc' ? 'active' : ''}`}
              onClick={() => setActiveTab('unverifiedLoc')}
            >
              Unverified Location ({summary.unverifiedLoc})
            </button>
          </div>

          <div className="validation-filter-actions">
            <div className="validation-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Filter table rows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="validation-batch-buttons">
              <button
                className="btn-batch"
                onClick={handleIncludeOnlyValid}
                title="Select only records without any errors or warnings"
              >
                Include Only Valid
              </button>
              <button
                className="btn-batch"
                onClick={handleExcludeFlagged}
                title="Exclude all records with errors, duplicates, or warnings"
              >
                Exclude Flagged
              </button>
              <button className="btn-batch-subtle" onClick={handleSelectAll}>
                Select All
              </button>
              <button className="btn-batch-subtle" onClick={handleDeselectAll}>
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="validation-table-container">
          <table className="validation-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>Import</th>
                <th style={{ width: '60px' }}>Row #</th>
                <th style={{ width: '90px' }}>Status</th>
                <th style={{ minWidth: '220px' }}>Validation Flags & Diagnostics</th>
                <th>Date</th>
                <th>Location & Sector</th>
                <th>Weather</th>
                <th>Severity</th>
                <th style={{ textAlign: 'right' }}>Casualties</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((item) => {
                  const hasIssues = item.issues && item.issues.length > 0;
                  return (
                    <tr
                      key={`preview-row-${item.rowNumber}`}
                      className={`validation-row ${!item.included ? 'row-excluded' : ''} ${item.status === 'invalid' ? 'row-invalid' : ''}`}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="validation-checkbox"
                          checked={item.included}
                          onChange={() => handleToggleRecord(item.rowNumber)}
                          aria-label={`Toggle row ${item.rowNumber}`}
                        />
                      </td>
                      <td className="row-num">#{item.rowNumber}</td>
                      <td>
                        {item.status === 'valid' && (
                          <span className="val-badge badge-valid">
                            <CheckCircle2 size={12} /> Valid
                          </span>
                        )}
                        {item.status === 'warning' && (
                          <span className="val-badge badge-warning">
                            <AlertTriangle size={12} /> Flagged
                          </span>
                        )}
                        {item.status === 'invalid' && (
                          <span className="val-badge badge-invalid">
                            <AlertCircle size={12} /> Invalid
                          </span>
                        )}
                      </td>
                      <td>
                        {hasIssues ? (
                          <div className="validation-issues-list">
                            {item.issues.map((iss, i) => (
                              <div
                                key={i}
                                className={`issue-tag ${iss.severity === 'error' ? 'issue-error' : 'issue-warn'}`}
                              >
                                {iss.severity === 'error' ? (
                                  <AlertCircle size={11} />
                                ) : (
                                  <AlertTriangle size={11} />
                                )}
                                <span>{iss.message}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="clean-label">No issues detected</span>
                        )}
                      </td>
                      <td className="cell-date">{item.normalized.date || '—'}</td>
                      <td>
                        <div className="val-cell-primary">{item.normalized.location}</div>
                        {(item.normalized.sector || item.normalized.corridor) && (
                          <div className="val-cell-secondary">
                            {[item.normalized.sector, item.normalized.corridor].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="condition-pill">{item.normalized.weatherCondition}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${item.normalized.severity.toLowerCase()}`}>
                          {item.normalized.severity}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="val-casualties">
                        {item.normalized.injuries} inj / {item.normalized.fatalities} fat
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="validation-empty-cell">
                    No records found matching the active filter tab or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="validation-modal-footer">
          <div className="footer-status-text">
            <span>
              <strong>{summary.selected}</strong> of <strong>{summary.total}</strong> records selected for import.
            </span>
            {summary.total - summary.selected > 0 && (
              <span className="text-muted" style={{ marginLeft: '6px' }}>
                ({summary.total - summary.selected} records will be excluded)
              </span>
            )}
          </div>

          <div className="footer-buttons">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-import-confirm"
              disabled={summary.selected === 0}
              onClick={handleConfirm}
            >
              <Check size={14} />
              <span>Import {summary.selected} Approved Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
