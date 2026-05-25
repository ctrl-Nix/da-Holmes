import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/api';

const FriendshipWidget = () => {
  const [target1, setTarget1] = useState('');
  const [target2, setTarget2] = useState('');
  const [platform, setPlatform] = useState('github');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!target1 || !target2) {
      setError('Please enter both targets');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/friendship/graph?target1=${target1}&target2=${target2}&platform=${platform}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.icon}>🤝</span>
        <h3 style={styles.title}>Friendship Graph</h3>
      </div>
      
      <div style={styles.platformSelector}>
        {['github', 'twitter', 'instagram'].map(p => (
          <button 
            key={p}
            onClick={() => setPlatform(p)}
            style={{
              ...styles.platformBtn,
              ...(platform === p ? styles.platformBtnActive : {})
            }}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.inputGroup}>
        <input 
          style={styles.input} 
          placeholder="Target 1" 
          value={target1} 
          onChange={(e) => setTarget1(e.target.value)} 
        />
        <input 
          style={styles.input} 
          placeholder="Target 2" 
          value={target2} 
          onChange={(e) => setTarget2(e.target.value)} 
        />
        <button style={styles.button} onClick={handleScan} disabled={loading}>
          {loading ? 'Scanning...' : 'Find Common'}
        </button>
      </div>
      
      {error && <p style={styles.error}>{error}</p>}
      
      {data && (
        <div style={styles.results}>
          <div style={styles.stats}>
            <div style={styles.statPill}>
              <span style={styles.statLabel}>{target1}</span>
              <span style={styles.statValue}>{data.target1_count}</span>
            </div>
            <div style={styles.statPill}>
              <span style={styles.statLabel}>{target2}</span>
              <span style={styles.statValue}>{data.target2_count}</span>
            </div>
            <div style={styles.statPillHighlight}>
              <span style={styles.statLabel}>Common</span>
              <span style={styles.statValue}>{data.common_count}</span>
            </div>
          </div>
          
          <h4 style={styles.subTitle}>Common Connections ({data.platform})</h4>
          <div style={styles.grid}>
            {data.nodes.filter(n => n.type === 'common').length > 0 ? (
              data.nodes.filter(n => n.type === 'common').map((node, idx) => (
                <div key={idx} style={styles.techBadge}>
                  <span style={styles.techName}>{node.label}</span>
                </div>
              ))
            ) : (
              <p style={styles.noData}>No common connections found on the first page.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: { 
    background: '#fff', 
    border: '4px solid #000', 
    boxShadow: '8px 8px 0px #000',
    borderRadius: '0px', 
    padding: '1.5rem', 
    color: '#000' 
  },
  header: { display: 'flex', alignItems: 'center', marginBottom: '1rem' },
  icon: { fontSize: '1.5rem', marginRight: '0.75rem' },
  title: { margin: 0, fontSize: '1.2rem', fontWeight: '600', color: '#f59e0b' },
  platformSelector: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  platformBtn: {
    padding: '0.35rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.2)',
    color: '#94a3b8',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  platformBtnActive: {
    background: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b',
    color: '#f59e0b'
  },
  inputGroup: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
  input: { 
    flex: 1, 
    minWidth: '150px',
    background: '#fff', 
    border: '4px solid #000', 
    borderRadius: '0px', 
    padding: '0.75rem', 
    color: '#000',
    fontSize: '0.85rem',
    fontWeight: '700'
  },
  button: { 
    background: '#f59e0b', 
    color: '#000', 
    fontWeight: '900',
    border: '4px solid #000', 
    boxShadow: '4px 4px 0px #000',
    padding: '0.75rem 1.5rem', 
    borderRadius: '0px', 
    cursor: 'pointer',
    transition: 'all 0.1s',
    textTransform: 'uppercase'
  },
  results: { marginTop: '1.5rem' },
  stats: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
  statPill: { 
    background: 'rgba(255,255,255,0.05)', 
    border: '1px solid rgba(255,255,255,0.1)', 
    padding: '0.5rem 1rem', 
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    minWidth: '80px'
  },
  statPillHighlight: { 
    background: 'rgba(245, 158, 11, 0.1)', 
    border: '1px solid rgba(245, 158, 11, 0.3)', 
    padding: '0.5rem 1rem', 
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    minWidth: '80px'
  },
  statLabel: { fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' },
  statValue: { fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' },
  subTitle: { fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  grid: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.5rem' },
  techBadge: { 
    background: 'rgba(245, 158, 11, 0.1)', 
    border: '1px solid rgba(245, 158, 11, 0.2)', 
    padding: '0.35rem 0.75rem', 
    borderRadius: '20px', 
    display: 'flex', 
    alignItems: 'center' 
  },
  techName: { fontSize: '0.8rem', color: '#f59e0b' },
  error: { color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' },
  noData: { color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }
};

export default FriendshipWidget;
