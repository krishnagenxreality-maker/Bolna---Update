import React from 'react';
import { EducationTopbar } from './EducationTopbar';
import { SmokeBackground } from '../../layout/SmokeBackground';

export const EducationLayout = ({ children }) => {
  return (
    <div className="app">
      <SmokeBackground />
      <EducationTopbar />
      <main className="main" style={{ padding: '20px' }}>
        {children}
      </main>
    </div>
  );
};
