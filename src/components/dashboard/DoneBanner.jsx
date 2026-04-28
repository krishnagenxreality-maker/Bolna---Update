import React from 'react';

export const DoneBanner = ({ showDone, doneSummary }) => {
  if (!showDone) return null;

  return (
    <div className="done-banner">
      <div className="done-icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" stroke="white" strokeWidth="1.5" strokeOpacity=".3"/>
          <path d="M13 20.5l5 5 9-10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="done-title">All Calls Completed</div>
      <div className="done-sub">{doneSummary}</div>
    </div>
  );
};
