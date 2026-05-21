import React from 'react';

export default function HolmesLogo({ style = {}, className = '' }) {
  return (
    <span 
      className={className} 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        fontFamily: 'Inter, sans-serif',
        fontSize: 'inherit',
        fontWeight: 'normal',
        color: 'var(--notion-fg)',
        lineHeight: 1,
        userSelect: 'none',
        ...style 
      }}
    >
      <span style={{ fontWeight: 400 }}>da&nbsp;</span>
      <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
        H
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          style={{ 
            height: '0.85em', 
            width: '0.85em', 
            display: 'inline-block', 
            verticalAlign: '-0.05em', 
            margin: '0 0.02em',
            flexShrink: 0
          }}
        >
          <circle cx="10" cy="10" r="7" stroke="var(--notion-accent, #2383e2)" strokeWidth="2.5" fill="none"/>
          <line x1="15" y1="15" x2="21" y2="21" stroke="var(--notion-accent, #2383e2)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        lmes
      </span>
    </span>
  );
}
