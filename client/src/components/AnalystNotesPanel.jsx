import React, { useState, useEffect } from 'react';
import styles from './AnalystNotesPanel.module.css';

export default function AnalystNotesPanel({ query }) {
  const [isOpen, setIsOpen] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Load saved notes and tags for the target query from localStorage
  useEffect(() => {
    try {
      const savedNotesObj = JSON.parse(localStorage.getItem('holmes-notes') || '{}');
      setNotes(savedNotesObj[query] || '');

      const savedTagsObj = JSON.parse(localStorage.getItem('holmes-tags') || '{}');
      setSelectedTags(savedTagsObj[query] || []);
    } catch (err) {
      console.error("Failed to load notes/tags:", err);
    }
  }, [query]);

  // Handle note change & autosave
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    try {
      const savedNotesObj = JSON.parse(localStorage.getItem('holmes-notes') || '{}');
      if (val.trim()) {
        savedNotesObj[query] = val;
      } else {
        delete savedNotesObj[query];
      }
      localStorage.setItem('holmes-notes', JSON.stringify(savedNotesObj));
      
      // Update history list item if present
      let history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
      history = history.map(item => {
        if (item.query === query) {
          return { ...item, notes: val };
        }
        return item;
      });
      localStorage.setItem('holmes-history', JSON.stringify(history));

      // Trigger global update
      window.dispatchEvent(new CustomEvent('holmes-history-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Tag selection
  const handleTagToggle = (tag) => {
    let updatedTags;
    if (selectedTags.includes(tag)) {
      updatedTags = selectedTags.filter(t => t !== tag);
    } else {
      updatedTags = [...selectedTags, tag];
    }
    setSelectedTags(updatedTags);

    try {
      // 1. Update tags dictionary
      const savedTagsObj = JSON.parse(localStorage.getItem('holmes-tags') || '{}');
      if (updatedTags.length > 0) {
        savedTagsObj[query] = updatedTags;
      } else {
        delete savedTagsObj[query];
      }
      localStorage.setItem('holmes-tags', JSON.stringify(savedTagsObj));

      // 2. Update the history item tags
      let history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
      history = history.map(item => {
        if (item.query === query) {
          return { ...item, tags: updatedTags };
        }
        return item;
      });
      localStorage.setItem('holmes-history', JSON.stringify(history));

      // 3. Dispatch update event
      window.dispatchEvent(new CustomEvent('holmes-history-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const allTags = ['#fraud', '#phishing', '#malware', '#tracking', '#research'];

  if (!isOpen) {
    return (
      <div 
        className={styles.notesPanelCollapsed} 
        onClick={() => setIsOpen(true)}
        title="Expand Analyst Notes"
      >
        <span style={{ fontSize: '14px' }}>📝</span>
        <div style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', fontSize: '11px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.5)', marginTop: '8px' }}>
          ANALYST NOTES
        </div>
      </div>
    );
  }

  return (
    <div className={styles.notesPanel}>
      <div className={styles.notesPanelHeader}>
        <div className={styles.notesPanelTitle}>
          <span>📝 Analyst Notes</span>
        </div>
        <button className={styles.notesCollapseBtn} onClick={() => setIsOpen(false)} title="Collapse Notes">
          ✕
        </button>
      </div>

      <textarea
        className={styles.notesTextarea}
        placeholder="Document investigation brief, active indicators, pivot findings, or intelligence logs..."
        value={notes}
        onChange={handleNotesChange}
      />

      <div className={styles.tagsSection}>
        <div className={styles.tagsLabel}>Investigation Categorization</div>
        <div className={styles.tagsGrid}>
          {allTags.map(tag => {
            const isSelected = selectedTags.includes(tag);
            const colors = getTagColor(tag);
            return (
              <span
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`${styles.tagPill} ${!isSelected ? styles.tagPillInactive : ''}`}
                style={isSelected ? {
                  backgroundColor: colors.bg,
                  color: colors.fg,
                  borderColor: colors.border,
                  borderStyle: 'solid',
                  borderWidth: '1px'
                } : {}}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const getTagColor = (tag) => {
  switch (tag) {
    case '#fraud':
      return { bg: 'rgba(231, 76, 60, 0.1)', fg: '#e74c3c', border: 'rgba(231, 76, 60, 0.2)' };
    case '#phishing':
      return { bg: 'rgba(230, 126, 34, 0.1)', fg: '#e67e22', border: 'rgba(230, 126, 34, 0.2)' };
    case '#malware':
      return { bg: 'rgba(155, 89, 182, 0.1)', fg: '#9b59b6', border: 'rgba(155, 89, 182, 0.2)' };
    case '#tracking':
      return { bg: 'rgba(52, 152, 219, 0.1)', fg: '#3498db', border: 'rgba(52, 152, 219, 0.2)' };
    case '#research':
      return { bg: 'rgba(46, 204, 113, 0.1)', fg: '#2ecc71', border: 'rgba(46, 204, 113, 0.2)' };
    default:
      return { bg: '#eaeaea', fg: '#666666', border: '#dddddd' };
  }
};
