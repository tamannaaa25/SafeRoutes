import React from 'react';
import {
  Lightbulb,
  MapPin,
  Activity,
  Calendar,
  Cloud,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function SafetyInsightsSection({ insights }) {
  const {
    hasData = false,
    totalCount = 0,
    observations = [],
    recommendations = [],
  } = insights || {};

  const getObservationIcon = (type) => {
    switch (type) {
      case 'location':
        return <MapPin size={15} className="text-primary" />;
      case 'severity':
        return <Activity size={15} className="text-amber" />;
      case 'day':
        return <Calendar size={15} className="text-blue" />;
      case 'weather':
        return <Cloud size={15} className="text-sky" />;
      case 'fatal':
        return <AlertTriangle size={15} className="text-rose" />;
      default:
        return <Info size={15} className="text-muted" />;
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'critical':
        return 'badge-fatal';
      case 'high':
        return 'badge-severe';
      case 'medium':
      default:
        return 'badge-moderate';
    }
  };

  return (
    <section id="insights" className="insights-section">
      <div className="section-header">
        <div>
          <div className="quality-header-title-row">
            <Lightbulb size={18} className="text-amber" />
            <h2 className="section-title">Safety Insights & Decision Support</h2>
          </div>
          <div className="morth-disclaimer-note">
            <Info size={13} className="disclaimer-icon" />
            <span>
              Rule-based empirical pattern identification and candidate targets for formal engineering safety investigations ({totalCount} records analyzed).
            </span>
          </div>
        </div>
      </div>

      {!hasData || totalCount === 0 ? (
        <div className="card empty-state-box">
          Insufficient data records under the current filter criteria to generate decision-support insights.
        </div>
      ) : (
        <div className="insights-grid">
          <div className="card insight-card">
            <div className="insight-card-header">
              <h3 className="chart-title">Observed Empirical Patterns</h3>
              <span className="review-subtitle">Dynamically identified from active records</span>
            </div>

            <div className="observations-list">
              {observations.map((obs) => (
                <div key={obs.id} className="observation-item">
                  <div className="observation-icon-box">
                    {getObservationIcon(obs.type)}
                  </div>
                  <div className="observation-content">
                    <div className="observation-top-line">
                      <span className="observation-title">{obs.title}</span>
                      <span className="observation-metric-chip">{obs.metric}</span>
                    </div>
                    <p className="observation-text">{obs.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card insight-card">
            <div className="insight-card-header">
              <h3 className="chart-title">Investigation Recommendations</h3>
              <span className="review-subtitle">Evidence-based candidate actions for safety planning</span>
            </div>

            <div className="recommendations-list">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <div key={rec.id} className="recommendation-item">
                    <div className="rec-header-row">
                      <span className={`badge ${getPriorityBadgeClass(rec.priority)}`}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="rec-category-tag">{rec.category}</span>
                    </div>

                    <div className="rec-target-row">
                      <MapPin size={12} className="text-muted" />
                      <strong className="rec-target-name">{rec.target}</strong>
                    </div>

                    <p className="rec-text">{rec.text}</p>
                  </div>
                ))
              ) : (
                <div className="empty-sub-state">
                  No critical intervention thresholds triggered for the current dataset selection.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
