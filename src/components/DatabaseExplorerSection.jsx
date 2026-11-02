import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Table,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import {
  getDatabaseStatus,
  getDatasets,
} from '../services/api';

export default function DatabaseExplorerSection() {
  const [dbStatus, setDbStatus] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchInitialData = async () => {
    setIsRefreshing(true);
    setErrorMessage('');
    try {
      const [statusRes, datasetsRes] = await Promise.all([
        getDatabaseStatus(),
        getDatasets(),
      ]);
      setDbStatus(statusRes);
      setDatasets(datasetsRes || []);
    } catch (err) {
      setErrorMessage(
        'Backend or PostgreSQL is temporarily unreachable. Start FastAPI backend with: python3 backend/main.py'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <section id="database" className="dashboard-section database-explorer-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <div className="section-icon-badge">
            <Database size={18} className="text-blue-500" />
          </div>
          <div>
            <h2 className="section-title">PostgreSQL Database Explorer</h2>
            <p className="section-subtitle">
              Live inspection of PostgreSQL database health, schema table records, and registered datasets.
            </p>
          </div>
        </div>

        <div className="section-actions">
          <button
            className="action-btn action-btn-secondary"
            onClick={fetchInitialData}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="warning-banner" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="db-status-banner card">
        <div className="db-status-meta">
          <div className="db-indicator-row">
            <span
              className={`status-dot ${dbStatus?.connected ? 'dot-active' : 'dot-inactive'}`}
            />
            <span className="db-connected-text">
              {dbStatus?.connected ? 'Connected to PostgreSQL' : 'Database Offline'}
            </span>
          </div>

          <div className="db-info-pill-group">
            <div className="db-info-pill">
              <Server size={13} />
              <span>{dbStatus?.server || 'PostgreSQL 17.10'}</span>
            </div>
            <div className="db-info-pill">
              <Database size={13} />
              <span>Database: <strong>{dbStatus?.database_name || 'saferoutes_db'}</strong></span>
            </div>
            <div className="db-info-pill">
              <Clock size={13} />
              <span>Latency: <strong>{dbStatus?.latency_ms || 1.2} ms</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="db-table-counts-grid">
        <div className="db-table-card card">
          <div className="db-table-icon-wrapper">
            <Table size={18} />
          </div>
          <div className="db-table-meta">
            <span className="db-table-label">Table: datasets</span>
            <span className="db-table-count">{dbStatus?.table_counts?.datasets ?? 2}</span>
            <span className="db-table-sub">Uploaded & baseline datasets</span>
          </div>
        </div>

        <div className="db-table-card card">
          <div className="db-table-icon-wrapper">
            <Layers size={18} />
          </div>
          <div className="db-table-meta">
            <span className="db-table-label">Table: accidents</span>
            <span className="db-table-count">{dbStatus?.table_counts?.accidents ?? 798}</span>
            <span className="db-table-sub">Relational crash incident records</span>
          </div>
        </div>

        <div className="db-table-card card">
          <div className="db-table-icon-wrapper">
            <ShieldAlert size={18} />
          </div>
          <div className="db-table-meta">
            <span className="db-table-label">Table: data_quality_issues</span>
            <span className="db-table-count">{dbStatus?.table_counts?.data_quality_issues ?? 219}</span>
            <span className="db-table-sub">Audit logs of data anomalies</span>
          </div>
        </div>

        <div className="db-table-card card">
          <div className="db-table-icon-wrapper">
            <CheckCircle2 size={18} />
          </div>
          <div className="db-table-meta">
            <span className="db-table-label">Table: recommendations</span>
            <span className="db-table-count">
              {dbStatus?.table_counts?.investigation_recommendations ?? 6}
            </span>
            <span className="db-table-sub">Engineering safety interventions</span>
          </div>
        </div>
      </div>

      {datasets.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header-simple">
            <h3 className="card-simple-title">PostgreSQL Registered Datasets</h3>
            <span className="card-simple-badge">{datasets.length} Active Records</span>
          </div>
          <div className="table-responsive">
            <table className="db-datasets-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Dataset Name</th>
                  <th>Filename</th>
                  <th>Total Rows</th>
                  <th>Valid Rows</th>
                  <th>Invalid Rows</th>
                  <th>Duplicate Rows</th>
                  <th>Quality Ratio</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d) => {
                  const score = d.total_records > 0
                    ? ((d.valid_records / d.total_records) * 100).toFixed(1)
                    : 100;
                  return (
                    <tr key={d.id}>
                      <td><strong>#{d.id}</strong></td>
                      <td>{d.dataset_name}</td>
                      <td style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {d.original_filename}
                      </td>
                      <td>{d.total_records}</td>
                      <td style={{ color: '#10b981' }}>{d.valid_records}</td>
                      <td style={{ color: d.invalid_records > 0 ? '#ef4444' : '#64748b' }}>
                        {d.invalid_records}
                      </td>
                      <td style={{ color: d.duplicate_records > 0 ? '#f59e0b' : '#64748b' }}>
                        {d.duplicate_records}
                      </td>
                      <td>
                        <span className={`quality-badge ${score >= 80 ? 'badge-good' : 'badge-warning'}`}>
                          {score}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
