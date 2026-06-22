import React, { useState } from 'react';
import { ShieldCheck, ShieldX, AlertTriangle, Loader2, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const StatusBadge = ({ label, status }) => {
  const isFound = status === 'Found';
  const isMissing = status === 'Not Found';
  const color = isFound ? '#27ae60' : isMissing ? '#e74c3c' : '#7f8c8d';
  const bg = isFound ? 'rgba(39,174,96,0.08)' : isMissing ? 'rgba(231,76,60,0.08)' : 'rgba(127,140,141,0.08)';
  const Icon = isFound ? ShieldCheck : isMissing ? ShieldX : AlertTriangle;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '14px 16px',
      backgroundColor: bg,
      border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '8px',
    }}>
      <Icon size={18} color={color} style={{ marginTop: '1px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-fg)' }}>
          {status}
        </div>
      </div>
    </div>
  );
};

const SpoofingWidget = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const run = async (e) => {
    e.preventDefault();
    const q = domain.trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!q) return;

    setLoading(true);
    setResults(null);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/spoofing/validate?domain=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Spoofing check failed');
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to spoofing intelligence servers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--notion-sidebar)',
      border: '1px solid var(--notion-border)',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldCheck size={20} color="#2383e2" />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--notion-fg)' }}>Email Spoofing Audit</div>
          <div style={{ fontSize: '12px', color: '#888' }}>SPF · DMARC · DKIM validation</div>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={run} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }} />
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="e.g. google.com"
            style={{
              width: '100%', padding: '9px 10px 9px 32px',
              borderRadius: '6px', border: '1px solid var(--notion-border)',
              backgroundColor: 'var(--notion-bg)', color: 'var(--notion-fg)',
              fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          style={{
            padding: '9px 16px', borderRadius: '6px', border: 'none',
            backgroundColor: loading || !domain.trim() ? '#ccc' : '#2383e2',
            color: '#fff', fontWeight: 600, fontSize: '13px', cursor: loading || !domain.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
          }}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <ShieldCheck size={14} />}
          {loading ? 'Checking...' : 'Audit'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ fontSize: '13px', color: '#e74c3c', padding: '10px 12px', backgroundColor: 'rgba(231,76,60,0.06)', borderRadius: '6px', border: '1px solid rgba(231,76,60,0.2)' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <StatusBadge label="SPF Record" status={results.spf?.status || 'Not Found'} />
          <StatusBadge label="DMARC Record" status={results.dmarc?.status || 'Not Found'} />
          {results.dkim && <StatusBadge label="DKIM Record" status={results.dkim?.status || 'Not Found'} />}

          {results.spf?.record && (
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#888', padding: '8px 12px', backgroundColor: 'var(--notion-bg)', borderRadius: '6px', border: '1px solid var(--notion-border)', wordBreak: 'break-all' }}>
              {results.spf.record}
            </div>
          )}
          {results.dmarc?.record && (
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#888', padding: '8px 12px', backgroundColor: 'var(--notion-bg)', borderRadius: '6px', border: '1px solid var(--notion-border)', wordBreak: 'break-all' }}>
              {results.dmarc.record}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
};

export default SpoofingWidget;
