import React, { useState, useEffect } from 'react';
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

export default function SafetyInsightsSection({ insights, datasetId = null, severityFilter = 'All' }) {
  const {
    hasData = false,
    totalCount = 0,
    observations = [],
  } = insights || {};

  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isAiExpanded, setIsAiExpanded] = useState(true);

  useEffect(() => {
    setAiInsights(null);
    setAiError('');
  }, [datasetId, severityFilter]);

  const handleFetchAiInsights = async () => {
    setIsLoadingAi(true);
    setAiError('');
    try {
      const data = await getAiSafetyInsights(datasetId, severityFilter);
      if (data && data.success === false) {
        setAiError(data.error || 'Gemini API is not configured. Please set GEMINI_API_KEY in backend/.env.');
        setAiInsights(null);
      } else if (data && data.recommendations && data.recommendations.length > 0) {
        setAiInsights(data);
        setIsAiExpanded(true);
      } else {
        setAiError('No recommendations could be generated from the current dataset.');
        setAiInsights(null);
      }
    } catch (err) {
      setAiError('Could not connect to the backend AI service. Ensure FastAPI backend is running.');
      setAiInsights(null);
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

  const aiRecommendations = aiInsights?.recommendations || [];

  return (
    <section id="insights" className="insights-section">
      <div className="section-header">
        <div>
          <div className="quality-header-title-row">
            <Lightbulb size={18} className="text-amber" />
            <h2 className="section-title">Safety Insights & Decision Support</h2>
          </div>
         
        </div>

        
      </div>

      {aiError && (
        <div className="warning-banner" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={16} />
          <span>{aiError}</span>
        </div>
      )}

      {aiInsights && aiInsights.executive_summary && (
        <div className="card ai-insights-card" style={{ marginBottom: '1.5rem', border: '1px solid #3b82f6' }}>
          <div
            className="card-header-simple"
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
            onClick={() => setIsAiExpanded(!isAiExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} className="text-blue-500" />
              <h3 className="card-simple-title">
                Gemini AI-Generated Safety Recommendations
              </h3>
            </div>
            <button className="icon-btn-ghost">
              {isAiExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {isAiExpanded && (
            <div className="ai-insights-body" style={{ marginTop: '0.75rem' }}>
              <div
                className="ai-summary-box"
                style={{
                  background: '#0f172a',
                  padding: '1rem',
                  borderRadius: '6px',
                  borderLeft: '3px solid #3b82f6',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#60a5fa' }}>
                  Executive Safety Summary
                </strong>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {aiInsights.executive_summary}
                </p>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#71717a',
                  marginTop: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
               
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
              <h3 className="chart-title">Gemini AI-Generated Investigation Recommendations</h3>
            </div>

            <div className="recommendations-list">
              {isLoadingAi ? (
                <div className="empty-sub-state" style={{ padding: '36px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={22} className="spin-icon text-primary" />
                  <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                    Synthesizing contextual road-safety engineering recommendations with Gemini AI...
                  </span>
                </div>
              ) : aiRecommendations.length > 0 ? (
                aiRecommendations.map((rec) => (
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

                    {rec.evidence && (
                      <div className="rec-evidence-line" style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                        <span>Evidence: {rec.evidence}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-sub-state" style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <Sparkles size={24} className="text-primary" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                    Click <strong>Generate AI Safety Analysis</strong> to have Google Gemini analyze verified crash data and generate contextual, natural-language safety engineering recommendations.
                  </p>
                  <button
                    className="action-btn action-btn-secondary"
                    onClick={handleFetchAiInsights}
                    disabled={isLoadingAi}
                    style={{ margin: '0 auto' }}
                  >
                    <Sparkles size={13} />
                    <span>Generate with Gemini</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
