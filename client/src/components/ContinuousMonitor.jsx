import React, { useState, useEffect } from 'react';
import { Activity, Plus, Trash2, RefreshCw } from 'lucide-react';
import styles from './ContinuousMonitor.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ContinuousMonitor() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [target, setTarget] = useState('');
  const [checks, setChecks] = useState({ social: true, breach: false, subdomain: false });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookType, setWebhookType] = useState('discord');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMonitors();
  }, []);

  async function fetchMonitors() {
    try {
      const res = await fetch(`${API_BASE}/api/monitor/list`);
      if (res.ok) {
        const data = await res.json();
        setMonitors(data.monitors || []);
      }
    } catch (err) {
      console.error('Failed to fetch monitors:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddMonitor = async (e) => {
    e.preventDefault();
    if (!target) return;
    
    setAdding(true);
    const activeChecks = Object.keys(checks).filter(k => checks[k]);
    
    try {
      const res = await fetch(`${API_BASE}/api/monitor/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          checks: activeChecks,
          webhook_url: webhookUrl,
          webhook_type: webhookType
        })
      });
      
      if (res.ok) {
        setTarget('');
        setWebhookUrl('');
        fetchMonitors();
      } else {
        alert('Failed to add monitor');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding monitor');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this monitor?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/monitor/${id}`, { method: 'DELETE' });
      if (res.ok) fetchMonitors();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>24/7 Continuous Monitoring</h2>
        <p className={styles.subtitle}>Automatically track OSINT targets around the clock and receive instant alerts.</p>
      </div>

      <form className={styles.formCard} onSubmit={handleAddMonitor}>
        <h3 style={{ fontSize: '16px', margin: 0 }}>Add New Monitor</h3>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Target (Username, Domain, or Email)</label>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="e.g. johndoe" 
            value={target}
            onChange={e => setTarget(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Modules to Monitor</label>
          <div className={styles.checksContainer}>
            <label className={styles.checkOption}>
              <input type="checkbox" checked={checks.social} onChange={e => setChecks({...checks, social: e.target.checked})} />
              Social Media Accounts
            </label>
            <label className={styles.checkOption}>
              <input type="checkbox" checked={checks.breach} onChange={e => setChecks({...checks, breach: e.target.checked})} />
              Data Breaches
            </label>
            <label className={styles.checkOption}>
              <input type="checkbox" checked={checks.subdomain} onChange={e => setChecks({...checks, subdomain: e.target.checked})} />
              Subdomains
            </label>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Webhook URL (Optional)</label>
          <input 
            type="url" 
            className={styles.input} 
            placeholder="https://discord.com/api/webhooks/..." 
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
          />
        </div>

        <button type="submit" className={styles.button} disabled={adding || !target}>
          {adding ? <RefreshCw className="spin" size={16} /> : <Plus size={16} />} 
          &nbsp; Add Target to Watchlist
        </button>
      </form>

      <div style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Active Watchlist</h3>
        {loading ? (
          <p>Loading...</p>
        ) : monitors.length === 0 ? (
          <p style={{ color: '#666', fontSize: '14px' }}>No active monitors. Add one above.</p>
        ) : (
          <div className={styles.monitorsList}>
            {monitors.map(m => (
              <div key={m.id} className={styles.monitorCard}>
                <div className={styles.monitorInfo}>
                  <div className={styles.monitorTarget}>
                    <Activity size={14} style={{ color: '#2ecc71', marginRight: '6px' }} />
                    {m.target}
                  </div>
                  <div className={styles.monitorDetails}>
                    <span>Checks: {(Array.isArray(m.checks) ? m.checks : []).join(', ')}</span>
                    <span>•</span>
                    <span>Findings: {m.findings_count || 0}</span>
                    <span>•</span>
                    <span>Last run: {m.last_run ? new Date(m.last_run).toLocaleString() : 'Pending'}</span>
                  </div>
                </div>
                <button className={styles.deleteBtn} onClick={() => handleDelete(m.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
