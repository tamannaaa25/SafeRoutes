import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AccidentTable({ records = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const location = (item.location || '').toLowerCase();
      const sector = (item.sector || '').toLowerCase();
      const corridor = (item.corridor || '').toLowerCase();
      const weather = (item.weatherCondition || '').toLowerCase();
      const road = (item.roadCondition || '').toLowerCase();
      const severity = (item.severity || '').toLowerCase();
      const date = (item.date || '');
      const search = searchTerm.toLowerCase();

      return (
        location.includes(search) ||
        sector.includes(search) ||
        corridor.includes(search) ||
        weather.includes(search) ||
        road.includes(search) ||
        severity.includes(search) ||
        date.includes(search)
      );
    });
  }, [records, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const getSeverityBadgeClass = (severity) => {
    switch (String(severity || '').toLowerCase()) {
      case 'fatal':
        return 'badge-fatal';
      case 'severe':
      case 'high':
        return 'badge-severe';
      case 'moderate':
      case 'medium':
        return 'badge-moderate';
      case 'minor':
      case 'low':
      default:
        return 'badge-minor';
    }
  };

  return (
    <section id="records" className="table-section">
      <div className="table-header-bar">
        <h2 className="section-title">Crash Records Log</h2>

        <div className="table-filters">
          <div className="search-input-wrapper">
            <Search size={14} strokeWidth={1.75} />
            <input
              type="text"
              className="search-input"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Search records"
            />
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="records-table">
          <thead>
            <tr>
              <th>Location & Sector</th>
              <th>Weather</th>
              <th>Surface</th>
              <th>Severity</th>
              <th style={{ textAlign: 'right' }}>Casualties</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="cell-primary">{record.location}</div>
                    {(record.sector || record.corridor) && (
                      <div className="cell-secondary">
                        {[record.sector, record.corridor].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="condition-pill">{record.weatherCondition}</span>
                  </td>
                  <td>
                    <span className="condition-pill">{record.roadCondition}</span>
                  </td>
                  <td>
                    <span className={`badge ${getSeverityBadgeClass(record.severity)}`}>
                      {record.severity}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }} className="cell-casualties">
                    {record.injuries} inj / {record.fatalities} fat
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="table-empty-cell">
                  No accident records match your search criteria.
                  {searchTerm && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        onClick={() => setSearchTerm('')}
                      >
                        Clear Search
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="table-footer">
          <span>
            {filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
            {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
          </span>

          <div className="table-pagination">
            <button
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              title="Previous Page"
            >
              <ChevronLeft size={14} strokeWidth={1.75} />
            </button>
            <span className="page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              title="Next Page"
            >
              <ChevronRight size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
