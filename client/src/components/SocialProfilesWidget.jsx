import React, { useState } from 'react';
import { User, CheckCircle2, XCircle, AlertCircle, Loader2, Search, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const PLATFORM_ICONS = {
  GitHub: '',
  Twitter: '',
  Reddit: '',
  Instagram: '',
  Pinterest: '',
  ProtonMail: '',
  Keybase: '',
  Medium: '',
  DockerHub: '',
  Steam: '',
};

const ProfileCard = ({ platform, url, status }) => {
  const isFound = status === 'found';
  const isError = status === 'error';
  const icon = PLATFORM_ICONS[platform] || '';

  const color = isFound ? '#27ae60' : isError ? '#888' : '#e74c3c';
  const StatusIcon = isFound ? CheckCircle2 : isError ? AlertCircle : XCircle;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px',
      backgroundColor: isFound ? 'rgba(39,174,96,0.05)' : 'var(--notion-bg)',
      border: `1px solid ${isFound ? 'rgba(39,174,96,0.2)' : 'var(--notion-border)'}`,
      borderRadius: '8px',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-fg)' }}>{platform}</div>
        {isFound && (
          <div style={{ fontSize: '11px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <StatusIcon size={16} color={color} />
        {isFound && (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#2383e2' }}>
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
};

const SocialProfilesWidget = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const run = async (e) => {
    e.preventDefault();
    const q = username.trim().replace(/^@/, '');
    if (!q) return;

    setLoading(true);
    setResults(null);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/social?username=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Social footprinting failed');
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to social intelligence servers.');
    } finally {
      setLoading(false);
    }
  };

  const profiles = results?.profiles || [];
  const foundCount = profiles.filter(p => p.status === 'found').length;

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
        <User size={20} color="#9b59b6" />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--notion-fg)' }}>Social Profiles</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Username footprint across 10 platforms</div>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={run} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }} />
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. torvalds"
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
          disabled={loading || !username.trim()}
          style={{
            padding: '9px 16px', borderRadius: '6px', border: 'none',
            backgroundColor: loading || !username.trim() ? '#ccc' : '#9b59b6',
            color: '#fff', fontWeight: 600, fontSize: '13px', cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
          }}
        >
          {loading ? <Loader2 size={14} className="social-spin" /> : <Search size={14} />}
          {loading ? 'Scanning...' : 'Search'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ fontSize: '13px', color: '#e74c3c', padding: '10px 12px', backgroundColor: 'rgba(231,76,60,0.06)', borderRadius: '6px', border: '1px solid rgba(231,76,60,0.2)' }}>
          {error}
        </div>
      )}

      {/* Stats bar */}
      {results && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(155,89,182,0.06)', border: '1px solid rgba(155,89,182,0.15)', borderRadius: '8px' }}>
          <User size={15} color="#9b59b6" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-fg)' }}>
            @{results.username}
          </span>
          <span style={{ fontSize: '12px', color: '#888', marginLeft: 'auto' }}>
            <span style={{ color: '#27ae60', fontWeight: 700 }}>{foundCount}</span>/{profiles.length} found
          </span>
        </div>
      )}

      {/* Results grid */}
      {profiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
          {/* Found first */}
          {[...profiles].sort((a, b) => (a.status === 'found' ? -1 : 1)).map(p => (
            <ProfileCard key={p.platform} platform={p.platform} url={p.url} status={p.status} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes social-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .social-spin { animation: social-spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
};

export default SocialProfilesWidget;
