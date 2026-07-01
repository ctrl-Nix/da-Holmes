import React from 'react';
import dashStyles from '../Dashboard.module.css';
import { getTagColor } from '../utils/tagColors';

const getHistoryBadgeColor = (type) => {
  switch (String(type).toLowerCase()) {
    case 'domain':
      return { bg: 'rgba(35, 131, 226, 0.1)', fg: '#2383e2' }; // Blue
    case 'username':
      return { bg: 'rgba(155, 89, 182, 0.1)', fg: '#9b59b6' }; // Purple
    case 'ip':
    case 'network':
      return { bg: 'rgba(230, 126, 34, 0.1)', fg: '#e67e22' }; // Orange
    case 'email':
      return { bg: 'rgba(241, 196, 15, 0.15)', fg: '#d4ac0d' }; // Yellow
    case 'btc':
      return { bg: 'rgba(46, 204, 113, 0.1)', fg: '#2ecc71' }; // Green
    default:
      return { bg: 'rgba(127, 140, 141, 0.1)', fg: '#7f8c8d' }; // Gray
  }
};

const getNotesList = () => {
  try {
    const savedNotesObj = JSON.parse(localStorage.getItem('holmes-notes') || '{}');
    const savedTagsObj = JSON.parse(localStorage.getItem('holmes-tags') || '{}');
    const history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
    
    return Object.keys(savedNotesObj)
      .filter(queryKey => savedNotesObj[queryKey] && savedNotesObj[queryKey].trim())
      .map(queryKey => {
        const histItem = history.find(h => h.query === queryKey);
        let detectedType = histItem ? histItem.type : 'username';
        if (!histItem) {
          if (/^(1|3|bc1)/.test(queryKey)) detectedType = 'btc';
          else if (queryKey.includes('@')) detectedType = 'email';
          else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(queryKey)) detectedType = 'network';
          else if (queryKey.includes('.')) detectedType = 'domain';
        }
        
        return {
          query: queryKey,
          type: detectedType,
          notes: savedNotesObj[queryKey],
          tags: savedTagsObj[queryKey] || []
        };
      });
  } catch (err) {
    console.error(err);
    return [];
  }
};

export default function NotesPage({ handleHistoryClick }) {
  const notesList = getNotesList();

  return (
    <div className="animate-fade-in">
      <h1 className={dashStyles.title}>Analyst Intelligence Notes</h1>
      <div className={dashStyles.subtitle}>Passive reconnaissance briefs and pivot findings keyed by target node.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
        {notesList.map((noteItem, idx) => {
          const badgeColor = getHistoryBadgeColor(noteItem.type);
          return (
            <div 
              key={idx} 
              style={{
                backgroundColor: 'var(--notion-bg)',
                border: '1px solid var(--notion-border)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                cursor: 'pointer'
              }}
              onClick={() => handleHistoryClick(noteItem.query, noteItem.type)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: 700,
                  backgroundColor: badgeColor.bg,
                  color: badgeColor.fg,
                  textTransform: 'uppercase',
                  flexShrink: 0
                }}>
                  {noteItem.type === 'network' ? 'IP' : noteItem.type}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(55,53,47,0.4)' }}>Recon Note</span>
              </div>
              
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--notion-fg)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {noteItem.query}
              </div>
              
              <div style={{ 
                fontSize: '12.5px', 
                color: 'var(--notion-fg)', 
                backgroundColor: '#fafafa', 
                border: '1px solid var(--notion-border)',
                borderRadius: '6px',
                padding: '8px 10px',
                minHeight: '60px',
                maxHeight: '100px',
                overflowY: 'auto',
                fontStyle: 'italic',
                lineHeight: '1.4'
              }}>
                "{noteItem.notes}"
              </div>
              
              {noteItem.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {noteItem.tags.map(tag => {
                    const colors = getTagColor(tag);
                    return (
                      <span
                        key={tag}
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: colors.bg,
                          color: colors.fg,
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}
              
              <div style={{ 
                marginTop: 'auto', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                fontSize: '11.5px', 
                fontWeight: 600, 
                color: 'var(--notion-accent)',
                paddingTop: '8px'
              }}>
                Pivot to Scan →
              </div>
            </div>
          );
        })}
        
        {notesList.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '48px', 
            backgroundColor: 'var(--notion-sidebar)', 
            borderRadius: '8px', 
            border: '1px dashed var(--notion-border)',
            textAlign: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '32px' }}></div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--notion-fg)' }}>No Analyst Notes Saved</div>
            <div style={{ fontSize: '12px', color: 'rgba(55,53,47,0.5)', maxWidth: '280px' }}>
              Run scans inside the Unified Scanner and add analyst notes to document your investigation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
