import React from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  BarChart2,
  AlertTriangle,
  FileSpreadsheet,
  MapPin,
  ChevronDown,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({ activeNav, onNavSelect, isOpen, onClose, currentSource }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'blackspots', label: 'Blackspots', icon: AlertTriangle },
    { id: 'records', label: 'Crash Records', icon: FileSpreadsheet },
    { id: 'quality', label: 'Data Quality', icon: ShieldCheck },
  ];

  const handleNavClick = (id) => {
    onNavSelect(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-title-wrapper">
              <span className="sidebar-title">SafeRoutes</span>
            </div>
          </div>

          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close navigation">
            <X size={16} />
          </button>
        </div>

        <div className="workspace-container">
          <div className="workspace-switcher" title="Geographical Scope: Chandigarh, India">
            <div className="workspace-info">
              <MapPin size={14} strokeWidth={1.75} className="workspace-icon" />
              <div className="workspace-details">
                <span className="workspace-name">Chandigarh UT</span>
                <span className="workspace-scope">Road Safety Grid</span>
              </div>
            </div>
            <ChevronDown size={14} strokeWidth={1.75} className="workspace-chevron" />
          </div>
        </div>

        <div className="sidebar-nav-section">
          <div className="nav-section-title">Navigation</div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon size={16} strokeWidth={1.75} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="dataset-status-box">
            <div className={`status-indicator-dot ${currentSource?.isVerified ? 'dot-verified' : ''}`} />
            <div className="status-text-stack">
              <span className="status-title">
                {currentSource?.isCustom ? 'Custom Verified Dataset' : 'MoRTH Baseline Active'}
              </span>
              <span className="status-subtitle">
                {currentSource?.isCustom ? currentSource.name : 'Demonstration Data'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
