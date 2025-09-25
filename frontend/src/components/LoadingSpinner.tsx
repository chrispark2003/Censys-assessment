import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Processing..." 
}) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="loading-dots">
          <span className="dot">.</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
        </div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};