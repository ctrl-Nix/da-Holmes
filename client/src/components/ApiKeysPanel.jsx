import React, { useState, useEffect } from 'react';
import { Key, Save, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './ApiKeysPanel.module.css';

export default function ApiKeysPanel() {
  const [keys, setKeys] = useState({
    shodan: '',
    virustotal: '',
    censys_id: '',
    censys_secret: '',
    github: ''
  });
  
  const [status, setStatus] = useState('');

  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem('holmes-api-keys');
      if (savedKeys) {
        setKeys(JSON.parse(savedKeys));
      }
    } catch (e) {
      console.error("Failed to load API keys", e);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setKeys(prev => ({ ...prev, [name]: value }));
    setStatus('');
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('holmes-api-keys', JSON.stringify(keys));
      
      // Push to backend Enterprise Vault for background tasks
      for (const [service, key] of Object.entries(keys)) {
        if (key.trim()) {
          try {
            await fetch('/api/vault/store', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ service, api_key: key.trim() })
            });
          } catch (err) {
            console.error(`Failed to push ${service} key to vault`, err);
          }
        }
      }

      setStatus('saved');
      window.dispatchEvent(new CustomEvent('holmes-api-keys-updated'));
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      console.error("Failed to save API keys", e);
      setStatus('error');
    }
  };

  return (
    <div className={styles.container} style={{ backgroundColor: 'var(--notion-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--notion-border)' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
        <Key size={20} color="#2383e2" /> Bring Your Own Key (BYOK)
      </h2>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>
        Add your own enterprise API keys to avoid public rate-limits and access premium intelligence endpoints. Keys are stored locally in your browser.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Shodan API Key</label>
          <input
            type="password"
            name="shodan"
            value={keys.shodan || ''}
            onChange={handleChange}
            placeholder="Enter Shodan key..."
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>VirusTotal API Key</label>
          <input
            type="password"
            name="virustotal"
            value={keys.virustotal || ''}
            onChange={handleChange}
            placeholder="Enter VT key..."
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Censys API ID</label>
            <input
              type="password"
              name="censys_id"
              value={keys.censys_id || ''}
              onChange={handleChange}
              placeholder="Censys ID"
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Censys API Secret</label>
            <input
              type="password"
              name="censys_secret"
              value={keys.censys_secret || ''}
              onChange={handleChange}
              placeholder="Censys Secret"
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>GitHub Personal Access Token (for GodMode)</label>
          <input
            type="password"
            name="github"
            value={keys.github || ''}
            onChange={handleChange}
            placeholder="ghp_..."
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}
          />
        </div>

      </div>

      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
        >
          <Save size={16} /> Save Keys to LocalStorage
        </button>
        
        {status === 'saved' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2ecc71', fontSize: '13px', fontWeight: 600 }}>
            <CheckCircle size={14} /> Saved securely
          </span>
        )}
        {status === 'error' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontSize: '13px', fontWeight: 600 }}>
            <AlertCircle size={14} /> Failed to save
          </span>
        )}
      </div>
    </div>
  );
}
