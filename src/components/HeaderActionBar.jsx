import React, { useRef } from 'react';
import Papa from 'papaparse';
import {
  Filter,
  Download,
  Menu,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { processCsvDataset } from '../utils/dataProcessing';

export default function HeaderActionBar({
  severityFilter,
  onSeverityFilterChange,
  onResetFilters,
  onExportCSV,
  onOpenMobileMenu,
  filteredCount,
  totalCount,
  currentSource,
  onInitiateValidation,
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

          const validationResult = processCsvDataset(results.data);

          if (validationResult.totalRecords === 0) {
            alert('No valid record rows found in the uploaded CSV file.');
            return;
          }

          onInitiateValidation(validationResult, file.name);

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
            <span className="breadcrumb-active">Road Safety & Decision Support</span>
            <span className="breadcrumb-separator">/</span>
            <span className={`dataset-status-tag ${currentSource.isCustom ? 'tag-custom' : ''}`}>
              {currentSource.isCustom
                ? `Custom: ${currentSource.name}`
                : 'CTP Baseline (Demo)'} ({totalCount} active)
            </span>
            {currentSource.isCustom && (
              <button
                className="btn-link-reset"
                onClick={onResetSample}
                title="Reset to CTP baseline dataset"
              >
                Reset Baseline
              </button>
            )}
          </div>
          <h1 className="action-bar-title">Road Safety Analytics & Decision Support</h1>
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
            <option value="Fatal">Fatal</option>
            <option value="High">High / Severe</option>
            <option value="Medium">Medium / Moderate</option>
            <option value="Low">Low / Minor</option>
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
          title="Upload and validate CSV dataset"
        >
          <Upload size={14} strokeWidth={1.75} />
          <span>Upload CSV</span>
        </button>

        <button
          className="btn-action btn-action-primary"
          onClick={onExportCSV}
          title="Export active records to CSV"
        >
          <Download size={14} strokeWidth={1.75} />
          <span>Export CSV</span>
        </button>
      </div>
    </header>
  );
}
