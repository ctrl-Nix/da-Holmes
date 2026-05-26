import React from 'react';
import { Image as ImageIcon, ExternalLink, Globe, Search } from 'lucide-react';

export default function ImageOsint({ results }) {
  if (!results) return null;

  const { source_url, search_links } = results;

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <ImageIcon size={16} /> Reverse Image OSINT Pivot
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Source Image */}
        <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '8px', backgroundColor: 'var(--notion-sidebar)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <img src={source_url} alt="Target" style={{ width: '100%', height: 'auto', borderRadius: '4px', border: '1px solid var(--notion-border)' }} />
            <div style={{ fontSize: '11px', color: 'rgba(55,53,47,0.6)', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {source_url}
            </div>
          </div>
        </div>

        {/* Search Links */}
        <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            Generated Reverse Search Pivots
          </div>
          
          {search_links.map((link, idx) => (
            <div key={idx} style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--notion-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
                  <Search size={14} /> {link.engine}
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
                  Search Now <ExternalLink size={10} />
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
        Intelligence powered by generated Dorks and Image Queries
      </div>
    </div>
  );
}
