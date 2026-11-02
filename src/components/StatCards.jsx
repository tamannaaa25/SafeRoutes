import React from 'react';
import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

export default function StatCards({ stats }) {
  const {
    totalAccidents = 0,
    totalInjuries = 0,
    totalFatalities = 0,
    topLocation = 'N/A',
    topLocationCount = 0,
    uniqueLocationsCount = 0,
  } = stats;

  return (
    <section id="overview" className="stat-cards-grid">
      <div className="card stat-card">
        <div className="stat-header">
          <span className="stat-label">Total Accidents</span>
        </div>
        <div className="stat-value">{totalAccidents.toLocaleString()}</div>
        <div className="stat-meta">
          <span>vs. previous monitoring cycle</span>
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-header">
          <span className="stat-label">Total Injuries</span>
        </div>
        <div className="stat-value">{totalInjuries.toLocaleString()}</div>
        <div className="stat-meta">
          <span>Non-fatal casualties recorded</span>
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-header">
          <span className="stat-label">Total Fatalities</span>
        </div>
        <div className="stat-value">{totalFatalities.toLocaleString()}</div>
        <div className="stat-meta">
          <span>Fatal casualties recorded</span>
        </div>
      </div>

      <div className="card stat-card stat-card-blackspot">
        <div className="stat-header">
          <span className="stat-label">Top Incident Corridor</span>
        </div>
        <div className="stat-value-location" title={topLocation}>
          {topLocation}
        </div>
        <div className="stat-meta">
          {topLocationCount > 0 ? (
            <span>
              <strong>{topLocationCount} crashes</strong> recorded
            </span>
          ) : (
            <span>No location data available</span>
          )}
        </div>
      </div>
    </section>
  );
}
