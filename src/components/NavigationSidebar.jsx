import React from 'react';
import { navigationIcons } from './navigationIcons';

const NavigationSidebar = ({ onViewChange, currentView }) => {
  const handleNavigation = (viewName) => {
    if (viewName) {
      onViewChange(viewName);
    }
  };

  return (
    <nav className="navigation-sidebar">
      <div className="nav-content">
        {navigationIcons.map((icon) => (
          <svg 
            key={icon.id}
            className={`nav-icon ${currentView === icon.viewName ? 'active' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
            onClick={() => handleNavigation(icon.viewName)}
            style={{ cursor: icon.viewName ? 'pointer' : 'default' }}
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
