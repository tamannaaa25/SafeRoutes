import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, RotateCcw, FileText, CheckCircle2, Download, AlertCircle } from 'lucide-react';
import { normalizeCsvRecord } from '../utils/analytics';

export default function CsvUploader({ currentSource, recordCount, onDataLoaded, onResetSample }) {
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            setUploadError('The uploaded CSV file is empty or formatted incorrectly.');
            return;
          }

          const parsedRecords = results.data
            .filter((row) => Object.values(row).some((val) => val && String(val).trim() !== ''))
            .map((row, idx) => normalizeCsvRecord(row, idx));

          if (parsedRecords.length === 0) {
            setUploadError('Could not find valid accident records in the uploaded file.');
            return;
          }

          onDataLoaded(parsedRecords, file.name);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (err) {
          console.error('CSV Parsing Error:', err);
          setUploadError('Failed to parse CSV file. Please check column format.');
        }
      },
      error: (err) => {
        console.error('PapaParse error:', err);
        setUploadError(`Failed to read CSV: ${err.message}`);
      },
    });
  };

  return (
    <div className="data-controls-bar">
      <div className="data-source-status">
        <FileText size={16} className="text-muted" />
        <span className="source-label">Dataset:</span>
        <span className={`source-pill ${currentSource.isCustom ? 'custom-file' : ''}`}>
          <CheckCircle2 size={12} />
          {currentSource.name} ({recordCount} total records)
        </span>
      </div>

      <div className="data-actions">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          title="Upload a custom Chandigarh accident CSV"
        >
          <UploadCloud size={14} />
          <span>Upload CSV</span>
        </button>

        <a
          href="/sample_accidents.csv"
          download="chandigarh_accidents_sample.csv"
          className="btn btn-outline"
          title="Download baseline Chandigarh CSV dataset"
        >
          <Download size={14} />
          <span>Template CSV</span>
        </a>

        {currentSource.isCustom && (
          <button
            className="btn btn-reset"
            onClick={onResetSample}
            title="Reset to baseline Chandigarh dataset"
          >
            <RotateCcw size={14} />
            <span>Reset Baseline</span>
          </button>
        )}
      </div>

      {uploadError && (
        <div style={{ width: '100%', color: '#dc2626', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
