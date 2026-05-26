import React, { useState } from 'react';
import { Search, Server, Activity, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import modStyles from '../Modules.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function SubdomainBrute() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const runBruteforce = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setResults(null);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/subdomain/bruteforce?domain=${encodeURIComponent(domain.trim())}`);
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
        <Server size={20} color="var(--notion-accent)" /> Active Subdomain Bruteforcer
      </h2>

      <form onSubmit={runBruteforce} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Enter target domain (e.g. example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '6px', border: '1px solid var(--notion-border)', fontSize: '14px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 24px', backgroundColor: 'var(--notion-accent)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />} Bruteforce
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
                <CheckCircle2 size={16} color="#27ae60" /> Bruteforce Complete
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Target: <strong>{results.domain}</strong></p>
            </div>
            <div style={{ padding: '8px 16px', backgroundColor: '#eaf4fc', color: '#2383e2', borderRadius: '6px', fontWeight: 600, fontSize: '14px' }}>
              {results.found} subdomains resolved
            </div>
          </div>

          {results.results && results.results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.results.map((r, i) => (
                <div key={i} style={{ padding: '12px 16px', border: '1px solid var(--notion-border)', borderRadius: '6px', backgroundColor: 'var(--notion-sidebar)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.subdomain}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {r.ips.map((ip, j) => (
                      <span key={j} style={{ padding: '2px 8px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999', border: '1px dashed var(--notion-border)', borderRadius: '8px' }}>
              No active subdomains resolved from the dictionary.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
