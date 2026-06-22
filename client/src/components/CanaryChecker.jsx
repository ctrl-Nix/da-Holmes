import React, { useState } from 'react';
import { ShieldAlert, Search } from 'lucide-react';

export default function CanaryChecker() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkCanary = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/canary/detect?text=${encodeURIComponent(text)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error("Canary check failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--notion-border)' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#fff' }}>
          <ShieldAlert size={18} color="#e83e8c" /> Canary Token & Honeypot Detector
        </h3>
        <p style={{ color: '#aaa', fontSize: '12px', margin: '4px 0 0 0' }}>
          Paste suspicious URLs, emails, or text blocks here before clicking them to detect embedded tracking pixels, IP loggers, or canary tokens.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste URL or text to analyze..."
          onKeyDown={(e) => e.key === 'Enter' && checkCanary()}
          style={{ flexGrow: 1, backgroundColor: '#191A1A', border: '1px solid #333', color: '#fff', padding: '10px 12px', borderRadius: '6px' }}
        />
        <button 
          onClick={checkCanary}
          disabled={loading || !text.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e83e8c', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Checking...' : <><Search size={16} /> Analyze</>}
        </button>
      </div>

      {result && (
        <div style={{ backgroundColor: '#191A1A', padding: '16px', borderRadius: '8px', border: result.is_canary ? '1px solid #e83e8c' : '1px solid #20c997' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              backgroundColor: result.is_canary ? 'rgba(232, 62, 140, 0.2)' : 'rgba(32, 201, 151, 0.2)',
              color: result.is_canary ? '#e83e8c' : '#20c997' 
            }}>
              {result.is_canary ? 'THREAT DETECTED' : 'CLEAN'}
            </span>
            <span style={{ color: '#ccc', fontSize: '14px' }}>Risk Level: {result.risk_level}</span>
          </div>
          
          {result.findings.length > 0 ? (
            <ul style={{ color: '#e0e0e0', paddingLeft: '20px', margin: 0, fontSize: '14px' }}>
              {result.findings.map((f, i) => (
                <li key={i} style={{ marginBottom: '8px' }}>
                  <strong>{f.type}</strong>: {f.description}
                  {f.pattern && <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Matched signature: <code>{f.pattern}</code></div>}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: '#aaa', fontSize: '14px' }}>No known canary patterns or suspicious parameters detected in this text.</div>
          )}
        </div>
      )}
    </div>
  );
}
