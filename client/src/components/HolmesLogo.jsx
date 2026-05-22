import React from 'react';

const HolmesLogo = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ fontWeight: 400, color: 'var(--notion-fg)' }}>da </span>
      <span style={{ fontWeight: 600 }}>H</span>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="var(--notion-accent, #2383e2)" 
        strokeWidth="2.5"
        style={{ width: '1em', height: '1em', background: 'transparent' }}
      >
        <circle cx="10" cy="10" r="7" />
        <line x1="15" y1="15" x2="21" y2="21" strokeLinecap="round" />
      </svg>
      <span style={{ fontWeight: 600 }}>lmes</span>
    </div>
  );
};

export default HolmesLogo;
