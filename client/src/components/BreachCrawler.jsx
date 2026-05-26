import React, { useState } from 'react';
import { Search, Skull, AlertTriangle, Loader2, Database, Link } from 'lucide-react';
import modStyles from '../Modules.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function BreachCrawler() {
  const [email, setEmail] = useState('');
  const [dumpUrl, setDumpUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const runCrawler = async (e) => {
    e.preventDefault();
    if (!email.trim() || !dumpUrl.trim()) return;

    setLoading(true);
    setResults(null);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/breach/crawler?target_email=${encodeURIComponent(email.trim())}&dump_url=${encodeURIComponent(dumpUrl.trim())}`);
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
        <Skull size={20} color="#e74c3c" /> Automated Breach Dump Crawler
      </h2>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
        Actively scrape a raw text URL (like a pastebin or public text dump) searching for the target email footprint.
      </p>

      <form onSubmit={runCrawler} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Target Email (e.g. user@example.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '6px', border: '1px solid var(--notion-border)', fontSize: '14px' }}
            />
          </div>
          <div style={{ position: 'relative', flex: 2 }}>
            <Link size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Dump URL (e.g. https://pastebin.com/raw/...)"
              value={dumpUrl}
              onChange={(e) => setDumpUrl(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '6px', border: '1px solid var(--notion-border)', fontSize: '14px' }}
            />
          </div>
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 24px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} Crawl Dump
          </button>
        </div>
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
                <Skull size={16} color="#c0392b" /> Crawl Results
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Target: <strong>{results.target}</strong> in {results.dump_url}</p>
            </div>
            <div style={{ padding: '8px 16px', backgroundColor: results.count > 0 ? '#fee2e2' : '#eaf4fc', color: results.count > 0 ? '#b91c1c' : '#2383e2', borderRadius: '6px', fontWeight: 600, fontSize: '14px' }}>
              {results.count} matches found
            </div>
          </div>

          {results.matches && results.matches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.matches.map((m, i) => (
                <div key={i} style={{ padding: '12px 16px', border: '1px solid #ffcdd2', borderRadius: '6px', backgroundColor: '#ffebee', display: 'flex', alignItems: 'center', fontFamily: 'monospace', fontSize: '14px', color: '#c62828' }}>
                  {m}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999', border: '1px dashed var(--notion-border)', borderRadius: '8px' }}>
              No matches found for the target email in this dump.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
