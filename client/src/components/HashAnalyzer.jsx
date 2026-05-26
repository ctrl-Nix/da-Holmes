import React from 'react';
import { Key, Unlock, AlertTriangle, Fingerprint, ExternalLink, ShieldAlert } from 'lucide-react';

export default function HashAnalyzer({ results }) {
  if (!results) return null;

  const { hash, length, possible_algorithms, search_links } = results;

  const isUnknown = possible_algorithms.some(algo => algo.name === 'Unknown');

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Fingerprint size={16} /> Cryptographic Hash Analyzer
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 700, 
          backgroundColor: isUnknown ? 'rgba(202, 44, 44, 0.1)' : 'rgba(35, 131, 226, 0.1)', 
          color: isUnknown ? '#ca2c2c' : '#2383e2',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          textTransform: 'uppercase'
        }}>
          {isUnknown ? 'UNRECOGNIZED HASH' : 'ALGORITHM IDENTIFIED'}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--notion-fg)', fontFamily: 'monospace', wordBreak: 'break-all', backgroundColor: 'var(--notion-sidebar)', padding: '12px', borderRadius: '6px', border: '1px solid var(--notion-border)' }}>
          {hash}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(55,53,47,0.6)', marginTop: '-12px' }}>
          Length: {length} characters
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          {/* Possible Algorithms */}
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '12px', textTransform: 'uppercase' }}>
              <Key size={14} /> Potential Algorithms
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {possible_algorithms.map((algo, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {algo.name === 'Unknown' ? <AlertTriangle size={16} color="#ca2c2c" style={{ marginTop: '2px' }}/> : <ShieldAlert size={16} color="#2b7a3e" style={{ marginTop: '2px' }}/>}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{algo.name}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(55,53,47,0.7)', fontStyle: 'italic' }}>{algo.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pivot Links */}
          {!isUnknown && (
            <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '12px', textTransform: 'uppercase' }}>
                <Unlock size={14} /> Decryption & Cracking Pivots
              </div>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {search_links.map((link, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--notion-sidebar)', flex: '1 1 200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>
                        {link.platform}
                      </div>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          backgroundColor: 'var(--notion-accent)', 
                          color: 'white', 
                          padding: '4px 10px', 
                          borderRadius: '4px', 
                          fontSize: '11px', 
                          fontWeight: 600, 
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Crack Hash <ExternalLink size={10} />
                      </a>
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(55,53,47,0.6)', fontStyle: 'italic' }}>
                      {link.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--notion-sidebar)', borderTop: '1px solid var(--notion-border)', fontSize: '11px', color: 'rgba(55,53,47,0.5)', textAlign: 'right' }}>
        Intelligence powered by Regex Length Analysis
      </div>
    </div>
  );
}
