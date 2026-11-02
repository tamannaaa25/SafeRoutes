import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SafeRoutes UI Component Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="card error-boundary-card"
          style={{
            padding: '24px',
            margin: '16px 0',
            border: '1px solid #fecaca',
            background: '#fff5f5',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#b91c1c',
              marginBottom: '8px',
            }}
          >
            <AlertTriangle size={20} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
              {this.props.sectionTitle ? `${this.props.sectionTitle} Display Error` : 'Section Display Error'}
            </h3>
          </div>
          <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred in this module.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="action-btn action-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={13} />
            <span>Retry Section</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

