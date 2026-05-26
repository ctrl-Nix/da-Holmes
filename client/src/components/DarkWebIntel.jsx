import React from 'react';
import { EyeOff, AlertTriangle, ShieldAlert, Link } from 'lucide-react';

export default function DarkWebIntel({ results }) {
  if (!results) return null;

  const { query, findings, count, message } = results;
  const hasFindings = count > 0;

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <EyeOff size={16} /> Tor Network & Dark Web Scan
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 700, 
          backgroundColor: hasFindings ? 'rgba(202, 44, 44, 0.1)' : 'rgba(43, 122, 62, 0.1)', 
          color: hasFindings ? '#ca2c2c' : '#2b7a3e',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {hasFindings ? <><ShieldAlert size={12}/> {count} HITS FOUND</> : <><ShieldAlert size={12}/> CLEAR</>}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {message && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--notion-sidebar)', borderRadius: '6px', fontSize: '13px', fontStyle: 'italic', color: 'rgba(55,53,47,0.7)' }}>
            {message}
          </div>
        )}

        {hasFindings ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {findings.map((item, idx) => (
              <div key={idx} style={{ padding: '12px', border: '1px solid rgba(202, 44, 44, 0.2)', borderRadius: '6px', backgroundColor: 'rgba(202, 44, 44, 0.02)' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#ca2c2c', marginBottom: '4px' }}>
                  {item.title || "Untitled Onion Site"}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--notion-accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Link size={12} /> {item.onion_url}
                </div>
                {item.snippet && (
                  <div style={{ fontSize: '13px', color: 'rgba(55, 53, 47, 0.8)', fontStyle: 'italic' }}>
                    "{item.snippet}"
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--notion-border)', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🕵️</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>No public dark web mentions found</div>
            <div style={{ fontSize: '12px', color: 'rgba(55, 53, 47, 0.6)', marginTop: '4px' }}>
              Target '{query}' does not appear in known Tor network indices (via Ahmia).
            </div>
          </div>
        )}

      </div>
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--notion-sidebar)', borderTop: '1px solid var(--notion-border)', fontSize: '11px', color: 'rgba(55,53,47,0.5)', textAlign: 'right' }}>
        Intelligence powered by Ahmia Tor Index (Free, Public)
      </div>
    </div>
  );
}
