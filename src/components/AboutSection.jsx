import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="about-section">
      <div className="card about-card">
        <div className="about-header">
          <HelpCircle size={15} strokeWidth={1.75} className="about-icon" />
          <h2 className="section-title">System Methodology & Data Provenance</h2>
        </div>

        <p className="about-description">
         SafeRoutes studies Chandigarh’s accident patterns, weather-related risks and accident-prone locations to help understand road safety across the city.</p>

        <div className="about-meta-grid">
          <div className="about-meta-item">
            <span className="about-meta-label">Geographical Scope</span>
            <span className="about-meta-value">Chandigarh (UT), India</span>
          </div>
          <div className="about-meta-item">
            <span className="about-meta-label">Blackspot Framework</span>
            <span className="about-meta-value">MoRTH 500m / 5+ Casualty Protocol</span>
          </div>
          <div className="about-meta-item">
            <span className="about-meta-label">Execution Environment</span>
            <span className="about-meta-value">Client-Side (Zero Server Ingestion)</span>
          </div>
          <div className="about-meta-item">
            <span className="about-meta-label">Baseline Source</span>
            <span className="about-meta-value">Chandigarh Traffic Police Assessments</span>
          </div>
        </div>
      </div>
    </section>
  );
}
