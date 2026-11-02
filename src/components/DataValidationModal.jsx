import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  FileSpreadsheet,
  X,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  HelpCircle
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
  const [expandedRawRowId, setExpandedRawRowId] = useState(null);

  useEffect(() => {
    if (validationResult && validationResult.processedRecords) {
      setRecordsState(validationResult.processedRecords);
    } else {
      setRecordsState([]);
    }
  }, [validationResult]);

  const summary = useMemo(() => {
    const total = recordsState.length;
    const included = recordsState.filter((r) => !r.isExcluded).length;
    const valid = recordsState.filter((r) => r.status === 'valid').length;
    const warnings = recordsState.filter((r) => r.status === 'warning').length;
    const invalid = recordsState.filter((r) => r.status === 'invalid').length;
    const duplicates = recordsState.filter((r) => r.isDuplicate).length;
    const missing = recordsState.reduce((acc, r) => acc + (r.missingFields ? r.missingFields.length : 0), 0);
    const flagged = warnings + invalid;

    const qualityPercentage = total > 0
      ? Math.max(0, Math.min(100, Math.round(((valid * 1.0 + warnings * 0.5) / total) * 100)))
      : 100;

    return { total, included, valid, warnings, invalid, duplicates, missing, flagged, qualityPercentage };
  }, [recordsState]);

  const filteredRecords = useMemo(() => {
    return recordsState.filter((item) => {
      if (activeTab === 'valid' && item.status !== 'valid') return false;
      if (activeTab === 'invalid' && item.status !== 'invalid') return false;
      if (activeTab === 'flagged' && item.status === 'valid') return false;
      if (activeTab === 'warnings' && item.status !== 'warning') return false;
      if (activeTab === 'duplicates' && !item.isDuplicate) return false;
      if (activeTab === 'excluded' && !item.isExcluded) return false;

      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const loc = (item.cleaned?.location || '').toLowerCase();
        const sec = (item.cleaned?.sector || '').toLowerCase();
        const weather = (item.cleaned?.weatherCondition || '').toLowerCase();
        const severity = (item.cleaned?.severity || '').toLowerCase();
        const rowStr = String(item.rowNumber || '');
        const issuesStr = Array.isArray(item.issues) ? item.issues.map((i) => i.message || '').join(' ').toLowerCase() : '';

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

  if (!isOpen || !validationResult) return null;

  const handleToggleRecord = (id) => {
    setRecordsState((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isExcluded: !r.isExcluded } : r))
    );
  };

  const handleSelectAll = () => {
    setRecordsState((prev) => prev.map((r) => ({ ...r, isExcluded: false })));
  };

  const handleDeselectAll = () => {
    setRecordsState((prev) => prev.map((r) => ({ ...r, isExcluded: true })));
  };

  const handleIncludeOnlyValid = () => {
    setRecordsState((prev) =>
      prev.map((r) => ({ ...r, isExcluded: r.status !== 'valid' }))
    );
  };

  const handleExcludeFlagged = () => {
    setRecordsState((prev) =>
      prev.map((r) => ({ ...r, isExcluded: r.status !== 'valid' }))
    );
  };

  const handleExcludeInvalid = () => {
    setRecordsState((prev) =>
      prev.map((r) => ({ ...r, isExcluded: r.status === 'invalid' || r.isDuplicate }))
    );
  };

  const toggleRaw = (id) => {
    setExpandedRawRowId((prev) => (prev === id ? null : id));
  };

  const handleConfirm = () => {
    const updatedDataset = {
      ...validationResult,
      totalRecords: summary.total,
      validRecords: summary.valid,
      warningRecords: summary.warnings,
      invalidRecords: summary.invalid,
      duplicateRecords: summary.duplicates,
      missingFieldCount: summary.missing,
      qualityPercentage: summary.qualityPercentage,
      processedRecords: recordsState
    };

    onConfirmImport(updatedDataset);
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
            <div className="stat-card-sub">Zero errors or flags</div>
          </div>

          <div className="validation-stat-card stat-missing">
            <div className="stat-card-label">Warnings</div>
            <div className="stat-card-value text-amber">{summary.warnings}</div>
            <div className="stat-card-sub">Non-fatal issues</div>
          </div>

          <div className="validation-stat-card stat-invalid">
            <div className="stat-card-label">Invalid Records</div>
            <div className="stat-card-value text-rose">{summary.invalid}</div>
            <div className="stat-card-sub">Critical data errors</div>
          </div>

          <div className="validation-stat-card stat-duplicate">
            <div className="stat-card-label">Possible Duplicates</div>
            <div className="stat-card-value text-orange">{summary.duplicates}</div>
            <div className="stat-card-sub">Matching incident keys</div>
          </div>

          <div className="validation-stat-card">
            <div className="stat-card-label">Missing Fields</div>
            <div className="stat-card-value">{summary.missing}</div>
            <div className="stat-card-sub">Across all rows</div>
          </div>

          <div className="validation-stat-card stat-location">
            <div className="stat-card-label">Quality Score</div>
            <div className="stat-card-value text-sky">{summary.qualityPercentage}%</div>
            <div className="stat-card-sub">Objective formula</div>
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
              className={`validation-tab ${activeTab === 'warnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('warnings')}
            >
              Warnings ({summary.warnings})
            </button>
            <button
              className={`validation-tab ${activeTab === 'duplicates' ? 'active' : ''}`}
              onClick={() => setActiveTab('duplicates')}
            >
              Duplicates ({summary.duplicates})
            </button>
            <button
              className={`validation-tab ${activeTab === 'excluded' ? 'active' : ''}`}
              onClick={() => setActiveTab('excluded')}
            >
              Excluded ({summary.total - summary.included})
            </button>
          </div>

          <div className="validation-filter-actions">
            <div className="validation-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search rows or issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="validation-batch-buttons">
              <button
                className="btn-batch"
                onClick={handleExcludeInvalid}
                title="Exclude invalid records and duplicates from analytics"
              >
                Exclude Invalid
              </button>
              <button
                className="btn-batch"
                onClick={handleIncludeOnlyValid}
                title="Include only records with zero errors and zero warnings"
              >
                Include Only Clean
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
                <th style={{ width: '50px', textAlign: 'center' }}>Include</th>
                <th style={{ width: '55px' }}>Row</th>
                <th style={{ width: '85px' }}>Status</th>
                <th>Validation Diagnostics & Reasons</th>
                <th>Date</th>
                <th>Location & Sector</th>
                <th>Severity</th>
                <th>Casualties</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Original Raw</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((item) => {
                  const hasIssues = item.issues && item.issues.length > 0;
                  const isExpanded = expandedRawRowId === item.id;
                  const isIncluded = !item.isExcluded;

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`validation-row ${!isIncluded ? 'row-excluded' : ''} ${item.status === 'invalid' ? 'row-invalid' : ''}`}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className="validation-checkbox"
                            checked={isIncluded}
                            onChange={() => handleToggleRecord(item.id)}
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
                              <AlertTriangle size={12} /> Warning
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
                        <td className="cell-date">{item?.cleaned?.date || '—'}</td>
                        <td>
                          <div className="val-cell-primary">{item?.cleaned?.location || 'Unknown Location'}</div>
                          {((item?.cleaned?.sector && item.cleaned.sector !== 'Unknown') || (item?.cleaned?.corridor && item.cleaned.corridor !== 'Unknown')) && (
                            <div className="val-cell-secondary">
                              {[item?.cleaned?.sector, item?.cleaned?.corridor].filter((v) => v && v !== 'Unknown').join(' • ')}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${String(item?.cleaned?.severity || 'unknown').toLowerCase()}`}>
                            {item?.cleaned?.severity || 'Unknown'}
                          </span>
                        </td>
                        <td className="val-casualties">
                          {item?.cleaned?.injuries ?? 0} inj / {item?.cleaned?.fatalities ?? 0} fat
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-view-raw"
                            onClick={() => toggleRaw(item.id)}
                            title="Inspect raw values from source CSV"
                          >
                            <span>{isExpanded ? 'Hide Raw' : 'View Raw'}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="raw-viewer-row">
                          <td colSpan={9}>
                            <div className="raw-viewer-box">
                              <div className="raw-viewer-header">
                                <strong>Original Raw CSV Values for Row #{item.rowNumber} (Unmodified)</strong>
                              </div>
                              <div className="raw-viewer-grid">
                                {Object.entries(item.raw).map(([key, val]) => (
                                  <div key={key} className="raw-field-item">
                                    <span className="raw-field-key">{key}:</span>
                                    <span className="raw-field-val">
                                      {val !== undefined && val !== null && String(val).trim() !== ''
                                        ? String(val)
                                        : <em className="text-muted">(empty / null)</em>}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              <strong>{summary.included}</strong> of <strong>{summary.total}</strong> records approved for analytics.
            </span>
            {summary.total - summary.included > 0 && (
              <span className="text-muted" style={{ marginLeft: '6px' }}>
                ({summary.total - summary.included} records excluded from analytics engine)
              </span>
            )}
          </div>

          <div className="footer-buttons">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-import-confirm"
              disabled={summary.included === 0}
              onClick={handleConfirm}
            >
              <Check size={14} />
              <span>Import {summary.included} Approved Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
