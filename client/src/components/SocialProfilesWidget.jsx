import React from 'react';
import { Terminal } from 'lucide-react';
import styles from './UnifiedScanner.module.css';

export default function SocialProfilesWidget({ social, singleRes, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.resultContainer}>
        <div className={styles.resultHeader}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={12} /> SOCIAL FOOTPRINT ANALYSIS
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 0' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: '36px', borderRadius: '6px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  if (!social) return null;

  return (
    <div className={styles.resultContainer}>
      <div className={styles.resultHeader}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={12} /> SOCIAL FOOTPRINT ANALYSIS
        </span>
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: social.level === 'SECURE' ? 'rgba(14,159,110,0.1)' : social.level === 'VULNERABLE' ? 'rgba(201,117,29,0.1)' : 'rgba(202,44,44,0.1)',
          color: social.level === 'SECURE' ? '#0e9f6e' : social.level === 'VULNERABLE' ? '#c9751d' : '#ca2c2c'
        }}>
          {social.level} — Score: {social.score}/100
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 0' }}>
        {social.platforms?.map((p, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: p.status === 'found' ? 'rgba(14,159,110,0.06)' : 'rgba(127,140,141,0.06)',
            border: `1px solid ${p.status === 'found' ? 'rgba(14,159,110,0.15)' : 'var(--notion-border)'}`,
            fontSize: '13px'
          }}>
            <span style={{ fontWeight: 600 }}>{p.platform}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {p.url && p.status === 'found' && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#2383e2' }}>
                  Open →
                </a>
              )}
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '3px',
                textTransform: 'uppercase',
                backgroundColor: p.status === 'found' ? 'rgba(14,159,110,0.12)' : p.status === 'not_found' ? 'rgba(127,140,141,0.12)' : 'rgba(201,117,29,0.12)',
                color: p.status === 'found' ? '#0e9f6e' : p.status === 'not_found' ? '#7f8c8d' : '#c9751d'
              }}>
                {p.status === 'found' ? '✓ FOUND' : p.status === 'not_found' ? '✗ NOT FOUND' : '⚠ UNAVAILABLE'}
              </span>
            </div>
          </div>
        ))}
      </div>
      {singleRes?.leaks && singleRes.leaks.length > 0 && (
        <div style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: 'rgba(202,44,44,0.04)', borderRadius: '6px', border: '1px solid rgba(202,44,44,0.1)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#ca2c2c', marginBottom: '4px', textTransform: 'uppercase' }}>Leak Intelligence</div>
          {singleRes.leaks.map((leak, idx) => (
            <div key={idx} style={{ fontSize: '12px', color: 'var(--notion-fg-secondary)' }}>
              <strong>{leak.source}:</strong> {leak.match}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
