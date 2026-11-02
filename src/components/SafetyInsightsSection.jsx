import React, { useState } from 'react';
import {
  Lightbulb,
  MapPin,
  Activity,
  Calendar,
  Cloud,
  AlertTriangle,
  Info,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getAiSafetyInsights } from '../services/api';

export default function SafetyInsightsSection({ insights }) {
  const {
    hasData = false,
    totalCount = 0,
    observations = [],
    recommendations = [],
  } = insights || {};

  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  const handleFetchAiInsights = async () => {
    setIsLoadingAi(true);
    setAiError('');
    try {
      const data = await getAiSafetyInsights();
      setAiInsights(data);
      setIsAiExpanded(true);
    } catch (err) {
      setAiError('Could not fetch live AI insights. Ensure backend is running.');
    } finally {
      setIsLoadingAi(false);
    }
  };

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
    switch (String(priority).toLowerCase()) {
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
          <p className="section-subtitle">
            Rule-based empirical safety patterns and Gemini-powered road safety engineering recommendations.
          </p>
        </div>

        <div className="section-actions">
          <button
            className="action-btn action-btn-primary"
            onClick={handleFetchAiInsights}
            disabled={isLoadingAi}
          >
            <Sparkles size={14} className={isLoadingAi ? 'spin-icon' : ''} />
            <span>{isLoadingAi ? 'Synthesizing AI Insights...' : 'Generate AI Safety Analysis'}</span>
          </button>
        </div>
      </div>

      {aiError && (
        <div className="warning-banner" style={{ marginBottom: '1rem' }}>
          <Info size={15} />
          <span>{aiError}</span>
        </div>
      )}

      {aiInsights && (
        <div className="card ai-insights-card" style={{ marginBottom: '1.5rem', border: '1px solid #3b82f6' }}>
          <div
            className="card-header-simple"
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
            onClick={() => setIsAiExpanded(!isAiExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} className="text-blue-500" />
              <h3 className="card-simple-title">
                AI Decision-Support Report ({aiInsights.source})
              </h3>
            </div>
            <button className="icon-btn-ghost">
              {isAiExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {isAiExpanded && (
            <div className="ai-insights-body" style={{ marginTop: '1rem' }}>
              <div className="ai-summary-box" style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', borderLeft: '3px solid #3b82f6' }}>
                <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#60a5fa' }}>Executive Safety Summary</strong>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {aiInsights.executive_summary}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: '#18181b', padding: '1rem', borderRadius: '6px', border: '1px solid #27272a' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#f59e0b' }}>Key Observed Data Patterns</strong>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#d4d4d8', lineHeight: 1.6 }}>
                    {(aiInsights.key_observations || []).map((obs, idx) => (
                      <li key={idx}>{obs}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: '#18181b', padding: '1rem', borderRadius: '6px', border: '1px solid #27272a' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#38bdf8' }}>High-Risk Corridors & Visibility Impact</strong>
                  <p style={{ fontSize: '0.85rem', color: '#d4d4d8', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                    {aiInsights.high_risk_corridors_analysis}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    {aiInsights.weather_and_visibility_impact}
                  </p>
                </div>
              </div>

              {aiInsights.recommended_interventions && aiInsights.recommended_interventions.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#10b981' }}>Targeted Engineering Interventions</strong>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {aiInsights.recommended_interventions.map((item, idx) => (
                      <div key={idx} style={{ background: '#18181b', border: '1px solid #27272a', padding: '0.75rem 1rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#f1f5f9', fontSize: '0.875rem' }}>{item.location}</strong>
                          <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.825rem' }}>
                            {item.action || item.recommendation}
                          </p>
                        </div>
                        <span className={`badge ${getPriorityBadgeClass(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: '#71717a', borderTop: '1px solid #27272a', paddingTop: '0.75rem' }}>
                <ShieldCheck size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                <span>{aiInsights.caveat_note}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasData || totalCount === 0 ? (
        <div className="card empty-state-box">
          Insufficient data records under the current filter criteria to generate decision-support insights.
        </div>
      ) : (
        <div className="insights-grid">
          <div className="card insight-card">
            <div className="insight-card-header">
              <h3 className="chart-title">Observed Empirical Patterns</h3>
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
