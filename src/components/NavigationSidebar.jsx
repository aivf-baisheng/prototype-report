import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NavigationSidebar.css';
import { navigationIcons } from './navigationIcons';

const NavigationSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (route) => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <nav className="navigation-sidebar">
      <div className="nav-content">
        {navigationIcons.map((icon) => (
          <svg 
            key={icon.id}
            className={`nav-icon ${location.pathname === icon.route ? 'active' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
            onClick={() => handleNavigation(icon.route)}
            style={{ cursor: icon.route ? 'pointer' : 'default' }}
          >
            {icon.clipPath && (
              <g clipPath="url(#clip0_1_515)">
                {icon.paths.map((path, index) => (
                  <path
                    key={`${icon.id}-path-${index}`}
                    d={path}
                    stroke="#475569"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            )}
            {!icon.clipPath && icon.paths.map((path, index) => (
              <path
                key={`${icon.id}-path-${index}`}
                d={path}
                stroke="#475569"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {icon.clipPath && (
              <defs>
                <clipPath id="clip0_1_515">
                  <rect width="16" height="16" fill="white"/>
                </clipPath>
              </defs>
            )}
          </svg>
        ))}
      </div>
    </nav>
  );
};

export default NavigationSidebar;
