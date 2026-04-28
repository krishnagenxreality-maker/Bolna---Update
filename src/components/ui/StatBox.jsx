import React from 'react';

export const StatBox = ({ num, label, cls }) => {
  return (
    <div className="stat-box">
      <div className={`stat-num ${cls}`}>{num}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
};
