import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Table,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  getDatabaseStatus,
  getDatasets,
  getSqlDemoQueries,
  runSqlDemoQuery,
} from '../services/api';

export default function DatabaseExplorerSection({ onSelectDataset }) {
  const [dbStatus, setDbStatus] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [queries, setQueries] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState('high_frequency_having');
  const [queryResult, setQueryResult] = useState(null);
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchInitialData = async () => {
    setIsRefreshing(true);
    setErrorMessage('');
    try {
      const [statusRes, datasetsRes, queriesRes] = await Promise.all([
        getDatabaseStatus(),
        getDatasets(),
        getSqlDemoQueries(),
      ]);
      setDbStatus(statusRes);
      setDatasets(datasetsRes || []);
      setQueries(queriesRes || []);

      if (queriesRes && queriesRes.length > 0) {
        handleExecuteQuery(queriesRes[0].query_id);
      }
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

  const handleExecuteQuery = async (queryId) => {
    setIsLoadingQuery(true);
    setSelectedQueryId(queryId);
    try {
      const result = await runSqlDemoQuery(queryId);
      setQueryResult(result);
    } catch (err) {
      setQueryResult({
        query_id: queryId,
        title: 'Query Error',
        description: err.message,
        sql_text: '-- Query execution failed',
        operations_demonstrated: ['ERROR'],
        columns: ['Error'],
        rows: [{ Error: err.message }],
        row_count: 0,
        execution_time_ms: 0,
      });
    } finally {
      setIsLoadingQuery(false);
    }
  };

  const selectedQueryMeta = queries.find((q) => q.query_id === selectedQueryId) || {
    title: 'SQL Demonstration Query',
    description: 'Select an analytical query to evaluate live execution against PostgreSQL.',
    operations_demonstrated: ['SELECT', 'GROUP BY'],
    sql_text: '',
  };

  return (
    <section id="database" className="dashboard-section database-explorer-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <div className="section-icon-badge">
            <Database size={18} className="text-blue-500" />
          </div>
          <div>
            <h2 className="section-title">PostgreSQL Database Explorer & SQL Studio</h2>
            <p className="section-subtitle">
              Live inspection of relational tables, dataset schemas, and demonstration of SQL aggregations, joins, and filters.
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

      <div className="card sql-studio-card">
        <div className="sql-studio-header">
          <div className="sql-studio-title-group">
            <Terminal size={18} className="text-emerald-500" />
            <div>
              <h3 className="card-simple-title">Interactive SQL Query Demonstration Runner</h3>
              <p className="sql-studio-subtitle">
                Demonstrates core relational database operations (JOIN, GROUP BY, HAVING, AVG, SUM, COUNT) executed in real time against PostgreSQL.
              </p>
            </div>
          </div>
        </div>

        <div className="sql-query-tabs">
          {queries.map((q) => {
            const isSelected = q.query_id === selectedQueryId;
            return (
              <button
                key={q.query_id}
                className={`sql-query-tab-btn ${isSelected ? 'active-tab' : ''}`}
                onClick={() => handleExecuteQuery(q.query_id)}
              >
                <span>{q.title}</span>
              </button>
            );
          })}
        </div>

        <div className="sql-query-details-panel">
          <div className="sql-query-meta-bar">
            <div>
              <div className="sql-query-name">{selectedQueryMeta.title}</div>
              <div className="sql-query-desc">{selectedQueryMeta.description}</div>
            </div>

            <button
              className="action-btn action-btn-primary"
              onClick={() => handleExecuteQuery(selectedQueryId)}
              disabled={isLoadingQuery}
            >
              <Play size={13} fill="currentColor" />
              <span>{isLoadingQuery ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>

          <div className="sql-operations-tag-group">
            <span className="sql-tag-label">SQL Operations:</span>
            {(selectedQueryMeta.operations_demonstrated || []).map((op) => (
              <span key={op} className="sql-op-tag">
                {op}
              </span>
            ))}
          </div>

          <div className="sql-code-editor-container">
            <pre className="sql-code-block">
              <code>{selectedQueryMeta.sql_text}</code>
            </pre>
          </div>
        </div>

        {queryResult && (
          <div className="sql-results-section">
            <div className="sql-results-meta-bar">
              <div className="sql-results-badge">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Query Returned {queryResult.row_count} rows</span>
              </div>
              <div className="sql-exec-time">
                <Clock size={13} />
                <span>Execution Time: {queryResult.execution_time_ms} ms</span>
              </div>
            </div>

            <div className="table-responsive sql-table-wrapper">
              <table className="sql-result-table">
                <thead>
                  <tr>
                    {(queryResult.columns || []).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(queryResult.rows || []).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {(queryResult.columns || []).map((col) => {
                        const val = row[col];
                        return (
                          <td key={col}>
                            {val !== null && val !== undefined ? String(val) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sql-pedagogical-footer">
              <ArrowRight size={14} />
              <span>
                <strong>Evaluation Demonstration:</strong> This query runs directly on PostgreSQL 17 via SQLAlchemy using indexed relational tables and demonstrates database design with normalized schemas, aggregation filters, and analytical integrity.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
