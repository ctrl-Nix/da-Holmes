import React, { useState, useEffect } from 'react';
import { Save, FileText, Download } from 'lucide-react';

export default function InvestigationNotebook({ target }) {
  const [notes, setNotes] = useState('');
  
  // Load notes from local storage
  useEffect(() => {
    if (target) {
      const saved = localStorage.getItem(`holmes_notes_${target}`);
      if (saved) {
        setNotes(saved);
      } else {
        setNotes(`# Investigation Notes: ${target}\n\n*Write your findings here...*\n`);
      }
    }
  }, [target]);

  const saveNotes = () => {
    if (target) {
      localStorage.setItem(`holmes_notes_${target}`, notes);
    }
  };

  const exportNotes = () => {
    const blob = new Blob([notes], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_notes_${target}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      backgroundColor: 'var(--notion-bg)',
      border: '1px solid var(--notion-border)',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '24px',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <FileText size={18} color="#2383e2" /> Analyst Notebook
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={saveNotes}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--notion-border)', color: '#ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            <Save size={14} /> Save
          </button>
          <button 
            onClick={exportNotes}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2383e2', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            <Download size={14} /> Export MD
          </button>
        </div>
      </div>
      
      <textarea 
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={saveNotes}
        style={{
          width: '100%',
          height: '300px',
          backgroundColor: '#191A1A',
          color: '#e0e0e0',
          border: '1px solid #333',
          borderRadius: '4px',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '14px',
          resize: 'vertical'
        }}
        placeholder="Document your findings..."
      />
    </div>
  );
}
