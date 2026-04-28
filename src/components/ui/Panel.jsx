import React from 'react';

export const Panel = ({ children, className = "", label }) => {
  return (
    <section className={`panel ${className}`}>
      {label && (
        <div className="panel-label">
          <span className="label-dot" />
          {label}
        </div>
      )}
      {children}
    </section>
  );
};

export const PanelHead = ({ children }) => (
  <div className="panel-head">{children}</div>
);
