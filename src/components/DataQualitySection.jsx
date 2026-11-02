import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  Search,
  RotateCcw,
  Info,
  SlidersHorizontal,
  Layers
} from 'lucide-react';

export default function DataQualitySection({
  qualityReport,
  onToggleRecordExclusion,
  onBatchExcludeInvalid,
  onBatchRestoreAll,
  onBatchIncludeOnlyValid,
  currentSource,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    totalRecords = 0,
    validRecords = 0,
    warningRecords = 0,
    invalidRecords = 0,
    duplicateRecords = 0,
    missingFieldCount = 0,
    qualityPercentage = 100,
    processedRecords = []
  } = qualityReport || {};

  const excludedCount = useMemo(() => {
    return processedRecords.filter((r) => r.isExcluded).length;
  }, [processedRecords]);

  const activeRecordsInEngine = totalRecords - excludedCount;

  const filteredRecords = useMemo(() => {
    return processedRecords.filter((item) => {
      if (activeFilter === 'flagged' && item.status === 'valid') return false;
      if (activeFilter === 'invalid' && item.status !== 'invalid') return false;
      if (activeFilter === 'warnings' && item.status !== 'warning') return false;
      if (activeFilter === 'duplicates' && !item.isDuplicate) return false;
      if (activeFilter === 'excluded' && !item.isExcluded) return false;
      if (activeFilter === 'active' && item.isExcluded) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const loc = (item.cleaned.location || '').toLowerCase();
        const sec = (item.cleaned.sector || '').toLowerCase();
        const rowStr = String(item.rowNumber);
        const issuesStr = item.issues.map((i) => i.message).join(' ').toLowerCase();

        return (
          loc.includes(q) ||
          sec.includes(q) ||
          rowStr.includes(q) ||
          issuesStr.includes(q)
        );
      }
      return true;
    });
  }, [processedRecords, activeFilter, searchTerm]);

  return (
    <section id="quality" className="data-quality-section">
      <div className="section-header quality-section-header">
        <div>
          <div className="quality-header-title-row">
           
            <h2 className="section-title">Data Quality & Validation Audit</h2>
          </div>
          <div className="quality-provenance-bar">
            
            <span className="formula-explanation">
              Quality Score Formula: ((Valid × 1.0 + Warnings × 0.5) / Total) × 100%
            </span>
          </div>
        </div>
      </div>

      <div className="stat-cards-grid quality-stat-grid">
        <div className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Records</span>
          </div>
          <div className="stat-value">{totalRecords}</div>
          <div className="stat-meta">
            <span>Evaluated rows</span>
          </div>
        </div>

        <div className="card stat-card stat-card-valid">
          <div className="stat-header">
            <span className="stat-label">Valid Records</span>
          </div>
          <div className="stat-value text-emerald">{validRecords}</div>
          <div className="stat-meta">
            <span>Zero errors or flags</span>
          </div>
        </div>

        <div className="card stat-card stat-card-warning">
          <div className="stat-header">
            <span className="stat-label">Records w/ Warnings</span>
          </div>
          <div className="stat-value text-amber">{warningRecords}</div>
          <div className="stat-meta">
            <span>Non-critical issues</span>
          </div>
        </div>

        <div className="card stat-card stat-card-invalid">
          <div className="stat-header">
            <span className="stat-label">Invalid Records</span>
          </div>
          <div className="stat-value text-rose">{invalidRecords}</div>
          <div className="stat-meta">
            <span>Critical data errors</span>
          </div>
        </div>

        <div className="card stat-card stat-card-duplicate">
          <div className="stat-header">
            <span className="stat-label">Possible Duplicates</span>
          </div>
          <div className="stat-value text-orange">{duplicateRecords}</div>
          <div className="stat-meta">
            <span>Matching incident keys</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">Missing Fields</span>
          </div>
          <div className="stat-value">{missingFieldCount}</div>
          <div className="stat-meta">
            <span>Across all rows</span>
          </div>
        </div>

        <div className="card stat-card stat-card-score">
          <div className="stat-header">
            <span className="stat-label">Data Quality Score</span>
          </div>
          <div className="stat-value text-blue">{qualityPercentage}%</div>
          <div className="stat-meta">
            <span>Objective audit index</span>
          </div>
        </div>
      </div>

      <div className="card quality-review-card">
        <div className="quality-review-header">
          <div className="review-title-group">
            <h3 className="chart-title">Record Review & Analytics Inclusion</h3>
          
          </div>

          <div className="quality-batch-actions">
            <button
              className="btn-batch"
              onClick={onBatchExcludeInvalid}
              title="Exclude all records containing critical validation errors"
            >
              Exclude All Invalid
            </button>
            <button
              className="btn-batch"
              onClick={onBatchIncludeOnlyValid}
              title="Only include 100% clean records with zero warnings or errors"
            >
              Include Only Clean
            </button>
            <button
              className="btn-batch-subtle"
              onClick={onBatchRestoreAll}
              title="Restore all records back into analytics engine"
            >
              <RotateCcw size={12} />
              <span>Restore All</span>
            </button>
          </div>
        </div>

        <div className="quality-filter-toolbar">
          <div className="quality-tabs">
            <button
              className={`quality-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({totalRecords})
            </button>
            <button
              className={`quality-tab ${activeFilter === 'flagged' ? 'active' : ''}`}
              onClick={() => setActiveFilter('flagged')}
            >
              Flagged ({warningRecords + invalidRecords})
            </button>
            <button
              className={`quality-tab ${activeFilter === 'invalid' ? 'active' : ''}`}
              onClick={() => setActiveFilter('invalid')}
            >
              Invalid ({invalidRecords})
            </button>
            <button
              className={`quality-tab ${activeFilter === 'warnings' ? 'active' : ''}`}
              onClick={() => setActiveFilter('warnings')}
            >
              Warnings ({warningRecords})
            </button>
            <button
              className={`quality-tab ${activeFilter === 'duplicates' ? 'active' : ''}`}
              onClick={() => setActiveFilter('duplicates')}
            >
              Duplicates ({duplicateRecords})
            </button>
            <button
              className={`quality-tab ${activeFilter === 'excluded' ? 'active' : ''}`}
              onClick={() => setActiveFilter('excluded')}
            >
              Excluded ({excludedCount})
            </button>
          </div>

          <div className="quality-search-wrapper">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search records or issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="quality-table-wrapper">
          <table className="quality-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Row</th>
                <th style={{ width: '120px' }}>Audit Status</th>
                <th style={{ minWidth: '240px' }}>Validation Diagnostics</th>
                <th style={{ width: '110px' }}>Date</th>
                <th style={{ minWidth: '240px' }}>Location & Sector</th>
                <th style={{ width: '100px' }}>Severity</th>
                <th style={{ width: '120px' }}>Casualties</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((item) => {
                  const isExcluded = item.isExcluded;

                  return (
                    <tr
                      key={item.id}
                      className={`quality-row ${isExcluded ? 'row-is-excluded' : ''} ${item.status === 'invalid' ? 'row-is-invalid' : ''}`}
                    >
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
                        {item.issues.length > 0 ? (
                          <div className="quality-issues-stack">
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
                      <td className="cell-date">{item.cleaned.date || '—'}</td>
                      <td>
                        <div className="val-cell-primary">{item.cleaned.location}</div>
                        {(item.cleaned.sector !== 'Unknown' || item.cleaned.corridor !== 'Unknown') && (
                          <div className="val-cell-secondary">
                            {[item.cleaned.sector, item.cleaned.corridor].filter((v) => v && v !== 'Unknown').join(' • ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${item.cleaned.severity.toLowerCase()}`}>
                          {item.cleaned.severity}
                        </span>
                      </td>
                      <td className="val-casualties">
                        {item.cleaned.injuries} inj / {item.cleaned.fatalities} fat
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="validation-empty-cell">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

