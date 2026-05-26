import React, { useState } from 'react';
import { Search, Github, ShieldAlert, AlertTriangle, Loader2, FileCode2 } from 'lucide-react';
import modStyles from '../Modules.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function GitHubScanner() {
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const runScanner = async (e) => {
    e.preventDefault();
    if (!repo.trim()) return;

    setLoading(true);
    setResults(null);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/github/scan?repo_url=${encodeURIComponent(repo.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'error') throw new Error(data.message);
        setResults(data);
      } else {
        throw new Error('Server returned an error');
      }
    } catch (err) {
      setError(err.message || 'Failed to establish connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={modStyles.container}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Github size={20} /> GitHub Secrets & Code Scanner
      </h2>

      <form onSubmit={runScanner} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Enter GitHub Repo (e.g. facebook/react)"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '6px', border: '1px solid var(--notion-border)', fontSize: '14px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 24px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />} Scan
        </button>
      </form>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', border: '1px solid var(--notion-border)', borderRadius: '8px', backgroundColor: 'var(--notion-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode2 size={16} /> Scan Report
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Target: <strong>{results.repo}</strong></p>
            </div>
            <div style={{ padding: '8px 16px', backgroundColor: results.secrets_found.length > 0 ? '#fee2e2' : '#eaf4fc', color: results.secrets_found.length > 0 ? '#b91c1c' : '#2383e2', borderRadius: '6px', fontWeight: 600, fontSize: '14px' }}>
              {results.secrets_found.length} suspicious files
            </div>
          </div>

          {results.secrets_found && results.secrets_found.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.secrets_found.map((r, i) => (
                <div key={i} style={{ padding: '12px 16px', border: '1px solid #ffcdd2', borderRadius: '6px', backgroundColor: '#ffebee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#c62828' }}>{r.file}</div>
                    <div style={{ fontSize: '12px', color: '#d32f2f', fontFamily: 'monospace' }}>{r.path}</div>
                  </div>
                  <span style={{ padding: '4px 8px', backgroundColor: '#ef5350', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {r.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999', border: '1px dashed var(--notion-border)', borderRadius: '8px' }}>
              No highly suspicious files (e.g. .env, id_rsa, credentials) found in the root tree.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
