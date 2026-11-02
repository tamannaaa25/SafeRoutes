import React from 'react';
import { ShieldAlert, MapPin } from 'lucide-react';

export default function Navbar({ activeSection, onNavigate }) {
  const handleScroll = (id) => {
    onNavigate(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="#home" className="navbar-brand" onClick={(e) => { e.preventDefault(); handleScroll('home'); }}>
          <div className="brand-icon-box">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="brand-title">
              Safe<span>Routes</span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#0284c7',
                marginLeft: '8px',
                backgroundColor: '#e0f2fe',
                padding: '2px 7px',
                borderRadius: '10px',
                verticalAlign: 'middle',
              }}
            >
              <MapPin size={10} />
              Chandigarh, India
            </span>
          </div>
        </a>

        <ul className="navbar-links">
          <li>
            <button
              className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => handleScroll('home')}
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleScroll('dashboard')}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => handleScroll('about')}
            >
              About
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
