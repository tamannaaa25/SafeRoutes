import React, { useRef } from 'react';
import Papa from 'papaparse';
import {
  Filter,
  Download,
  Menu,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { normalizeCsvRecord } from '../utils/analytics';

export default function HeaderActionBar({
  severityFilter,
  onSeverityFilterChange,
  onResetFilters,
  onExportCSV,
  onOpenMobileMenu,
  filteredCount,
  totalCount,
  currentSource,
  onDataLoaded,
  onResetSample,
}) {
  const fileInputRef = useRef(null);
  const hasActiveFilters = severityFilter !== 'All';

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            alert('The uploaded CSV file is empty.');
            return;
          }

          const parsedRecords = results.data
            .filter((row) => Object.values(row).some((val) => val && String(val).trim() !== ''))
            .map((row, idx) => normalizeCsvRecord(row, idx));

          if (parsedRecords.length === 0) {
            alert('No valid accident records found in the uploaded file.');
            return;
          }

          onDataLoaded(parsedRecords, file.name);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (err) {
          console.error('CSV Parsing Error:', err);
          alert('Failed to parse CSV file. Please check column format.');
        }
      },
      error: (err) => {
        console.error('PapaParse error:', err);
        alert(`Failed to read CSV: ${err.message}`);
      },
    });
  };

  return (
    <header className="action-bar">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <div className="action-bar-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={16} strokeWidth={1.75} />
        </button>

        <div className="action-bar-titles">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-muted">SafeRoutes</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Chandigarh Analytics</span>
            <span className="breadcrumb-separator">/</span>
            <span className={`dataset-status-tag ${currentSource.isCustom ? 'tag-custom' : ''}`}>
              {currentSource.isCustom ? currentSource.name : 'CTP Baseline'} ({totalCount} recs)
            </span>
            {currentSource.isCustom && (
              <button
                className="btn-link-reset"
                onClick={onResetSample}
                title="Reset to CTP baseline dataset"
              >
                Reset
              </button>
            )}
          </div>
          <h1 className="action-bar-title">Road Safety Overview</h1>
        </div>
      </div>

      <div className="action-bar-right">
        <div className="filter-item severity-filter-wrapper" title="Filter by crash severity">
          <Filter size={14} strokeWidth={1.75} className="filter-icon" />
          <select
            className="action-select"
            value={severityFilter}
            onChange={(e) => onSeverityFilterChange(e.target.value)}
            aria-label="Severity Filter"
          >
            <option value="All">All Severities</option>
            <option value="Minor">Minor</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
            <option value="Fatal">Fatal</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            className="btn-icon-action"
            onClick={onResetFilters}
            title="Reset active filters"
          >
            <RotateCcw size={14} strokeWidth={1.75} />
          </button>
        )}

        <button
          className="btn-action btn-action-subtle"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          title="Import CSV dataset to analyze"
        >
          <Upload size={14} strokeWidth={1.75} />
          <span>Import CSV</span>
        </button>

        <button
          className="btn-action btn-action-primary"
          onClick={onExportCSV}
          title="Export filtered records to CSV"
        >
          <Download size={14} strokeWidth={1.75} />
          <span>Export CSV</span>
        </button>
      </div>
    </header>
  );
}
