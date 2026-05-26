import React, { useState } from 'react';
import { Search, Globe, Mail, Phone, Users, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import modStyles from '../Modules.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function WebScraper() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const runScraper = async (e) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setResults(null);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/scraper/live?url=${encodeURIComponent(target.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setResults(data);
        } else {
          setError(data.message || 'Scraping failed');
        }
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
        <Globe size={20} color="var(--notion-accent)" /> Live Web Scraper & NLP Extractor
      </h2>

      <form onSubmit={runScraper} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Enter URL to scrape (e.g. https://example.com)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
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
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />} Extract
        </button>
      </form>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', border: '1px solid var(--notion-border)', borderRadius: '8px', backgroundColor: 'var(--notion-bg)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#27ae60" /> Scraping Complete
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Target:</strong> {results.target}</p>
            <p style={{ margin: '0', fontSize: '14px' }}><strong>Page Title:</strong> {results.title}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--notion-border)', borderRadius: '8px', backgroundColor: 'var(--notion-sidebar)' }}>
              <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><Mail size={16} /> Extracted Emails ({results.emails.length})</h4>
              {results.emails.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--notion-fg)' }}>
                  {results.emails.map((email, i) => <li key={i}>{email}</li>)}
                </ul>
              ) : <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>No emails found.</p>}
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--notion-border)', borderRadius: '8px', backgroundColor: 'var(--notion-sidebar)' }}>
              <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><Phone size={16} /> Extracted Phones ({results.phones.length})</h4>
              {results.phones.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--notion-fg)' }}>
                  {results.phones.map((phone, i) => <li key={i}>{phone}</li>)}
                </ul>
              ) : <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>No phone numbers found.</p>}
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--notion-border)', borderRadius: '8px', backgroundColor: 'var(--notion-sidebar)', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><Users size={16} /> Extracted Socials</h4>
              {Object.keys(results.socials).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(results.socials).map(([platform, handles]) => (
                    handles.map((handle, i) => (
                      <span key={`${platform}-${i}`} style={{ padding: '4px 8px', backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                        {platform}: {handle}
                      </span>
                    ))
                  ))}
                </div>
              ) : <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>No social media profiles found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
