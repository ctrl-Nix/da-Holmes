import React from 'react';
import { Plane, ExternalLink, Hash, Navigation } from 'lucide-react';

export default function AviationIntel({ results }) {
  if (!results) return null;

  const { tail_number, search_links } = results;

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Plane size={16} /> Aviation Tracker Pivot
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 700, 
          backgroundColor: 'rgba(35, 131, 226, 0.1)', 
          color: '#2383e2',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          textTransform: 'uppercase'
        }}>
          {tail_number}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Left Side info */}
        <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '16px', backgroundColor: 'var(--notion-sidebar)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: 800 }}>
              <Hash size={24} style={{ color: 'var(--notion-accent)' }} /> {tail_number}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(55,53,47,0.7)', lineHeight: '1.5' }}>
              Aircraft registration numbers (Tail Numbers) uniquely identify civilian and private aircraft globally.
            </div>
          </div>
        </div>

        {/* Search Links */}
        <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            Live Radar & Database Deep-Links
          </div>
          
          {search_links.map((link, idx) => (
            <div key={idx} style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--notion-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
                  <Navigation size={14} /> {link.platform}
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
                  Track <ExternalLink size={10} />
                </a>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(55,53,47,0.6)', fontStyle: 'italic' }}>
                {link.description}
              </div>
            </div>
          ))}
        </div>

      </div>
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--notion-sidebar)', borderTop: '1px solid var(--notion-border)', fontSize: '11px', color: 'rgba(55,53,47,0.5)', textAlign: 'right' }}>
        Intelligence deep-linking powered by Global ADS-B Networks
      </div>
    </div>
  );
}
