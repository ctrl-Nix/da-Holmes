import React from 'react';
import { ShieldAlert, Server, Network, ShieldCheck, Database, Tag, Key, AlertTriangle } from 'lucide-react';

export default function IotScanner({ results }) {
  if (!results) return null;

  const { ip, ports, cpes, hostnames, tags, vulns, message } = results;

  const hasVulns = vulns && vulns.length > 0;
  const isExposed = ports && ports.length > 0;

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Server size={16} /> InternetDB IoT Scanner: {ip}
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 700, 
          backgroundColor: hasVulns ? 'rgba(202, 44, 44, 0.1)' : 'rgba(43, 122, 62, 0.1)', 
          color: hasVulns ? '#ca2c2c' : '#2b7a3e',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {hasVulns ? <><ShieldAlert size={12}/> VULNERABILITIES DETECTED</> : <><ShieldCheck size={12}/> NO KNOWN VULNS</>}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {message && message !== "Successfully retrieved IoT intelligence." && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--notion-sidebar)', borderRadius: '6px', fontSize: '13px', fontStyle: 'italic', color: 'rgba(55,53,47,0.7)' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Open Ports */}
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Network size={14} /> Open Ports
            </div>
            {ports && ports.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ports.map(port => (
                  <span key={port} style={{ backgroundColor: 'var(--notion-sidebar)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, border: '1px solid var(--notion-border)' }}>
                    {port}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'rgba(55,53,47,0.6)' }}>No open ports detected.</span>
            )}
          </div>

          {/* Hostnames */}
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Database size={14} /> Hostnames
            </div>
            {hostnames && hostnames.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {hostnames.map((h, i) => (
                  <span key={i} style={{ fontSize: '13px', fontWeight: 500, wordBreak: 'break-all' }}>{h}</span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'rgba(55,53,47,0.6)' }}>No hostnames resolved.</span>
            )}
          </div>

          {/* Tags */}
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Tag size={14} /> System Tags
            </div>
            {tags && tags.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tags.map((t, i) => (
                  <span key={i} style={{ backgroundColor: 'rgba(35, 131, 226, 0.1)', color: '#2383e2', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'rgba(55,53,47,0.6)' }}>No tags available.</span>
            )}
          </div>
        </div>

        {/* CPEs (Products) */}
        {cpes && cpes.length > 0 && (
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Key size={14} /> Identified Products (CPEs)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {cpes.map((cpe, i) => {
                const parts = cpe.split(':');
                const cleanCpe = parts.length > 4 ? `${parts[3]} ${parts[4]}` : cpe;
                return (
                  <span key={i} style={{ backgroundColor: 'var(--notion-sidebar)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--notion-border)' }}>
                    {cleanCpe.replace(/_/g, ' ')}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Vulnerabilities */}
        {hasVulns && (
          <div style={{ border: '1px solid rgba(202, 44, 44, 0.2)', backgroundColor: 'rgba(202, 44, 44, 0.02)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#ca2c2c', marginBottom: '8px', textTransform: 'uppercase' }}>
              <AlertTriangle size={14} /> Known CVEs ({vulns.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {vulns.map((v, i) => (
                <a 
                  key={i} 
                  href={`https://nvd.nist.gov/vuln/detail/${v}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    backgroundColor: '#ca2c2c', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    textDecoration: 'none' 
                  }}
                >
                  {v}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--notion-sidebar)', borderTop: '1px solid var(--notion-border)', fontSize: '11px', color: 'rgba(55,53,47,0.5)', textAlign: 'right' }}>
        Intelligence powered by Shodan InternetDB (Free, No Auth Required)
      </div>
    </div>
  );
}
