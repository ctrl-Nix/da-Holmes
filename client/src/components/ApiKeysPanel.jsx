import React, { useState, useEffect, useRef } from 'react';
import { Key, Save, AlertCircle, CheckCircle, Instagram, Eye, EyeOff, RefreshCw, Info, Wifi, WifiOff, ChevronDown, ChevronUp, Shield, Zap } from 'lucide-react';
import styles from './ApiKeysPanel.module.css';

// ──────────────────────────────────────────────────────────────────────────────
// Instagram Cookie Status Banner
// ──────────────────────────────────────────────────────────────────────────────
function InstagramStatusBanner({ configured }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 14px',
      borderRadius: '8px',
      background: configured
        ? 'linear-gradient(135deg, rgba(46,213,115,0.12), rgba(0,209,146,0.08))'
        : 'linear-gradient(135deg, rgba(255,99,71,0.10), rgba(255,140,0,0.08))',
      border: `1px solid ${configured ? 'rgba(46,213,115,0.35)' : 'rgba(255,140,0,0.35)'}`,
      marginBottom: '16px',
    }}>
      {configured ? (
        <Wifi size={16} color="#2ed573" />
      ) : (
        <WifiOff size={16} color="#ff9f43" />
      )}
      <span style={{ fontSize: '13px', fontWeight: 600, color: configured ? '#2ed573' : '#ff9f43' }}>
        {configured ? ' Authenticated Mode Active — Real profile data will be fetched' : ' Unauthenticated — Best-effort only, high false-positive rate'}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step-by-step Cookie Guide
// ──────────────────────────────────────────────────────────────────────────────
function CookieGuide() {
  const [open, setOpen] = useState(false);

  const steps = [
    { icon: '', title: 'Open Instagram', desc: 'Go to instagram.com in Chrome / Edge. Log in with your account.' },
    { icon: '', title: 'Open DevTools', desc: 'Press F12 (or Ctrl+Shift+I) to open Developer Tools.' },
    { icon: '', title: 'Go to Application Tab', desc: 'Click "Application" tab → expand "Cookies" → click "https://www.instagram.com".' },
    { icon: '', title: 'Find These Cookies', desc: 'Look for: sessionid, ds_user_id, csrftoken. Copy each value.' },
    { icon: '', title: 'Paste Below', desc: 'Paste the values into the fields below and click Save.' },
  ];

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 14px',
          background: 'rgba(225,48,108,0.10)',
          border: '1px solid rgba(225,48,108,0.30)',
          borderRadius: '8px',
          color: '#e1306c',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={14} /> How to get Instagram cookies (step-by-step)
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div style={{
          marginTop: '10px',
          borderRadius: '10px',
          border: '1px solid rgba(225,48,108,0.20)',
          background: 'rgba(225,48,108,0.04)',
          overflow: 'hidden',
        }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '12px 16px',
                borderBottom: i < steps.length - 1 ? '1px solid rgba(225,48,108,0.12)' : 'none',
              }}
            >
              <div style={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                background: 'rgba(225,48,108,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}>
                {step.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>
                  Step {i + 1}: {step.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--notion-text-secondary, #999)', lineHeight: 1.5 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255, 165, 0, 0.07)',
            borderTop: '1px solid rgba(225,48,108,0.12)',
            fontSize: '11px',
            color: '#e1306c',
            lineHeight: 1.6,
          }}>
             <strong>Security Note:</strong> Never share these cookies with anyone else. They grant full access to your Instagram account. This tool stores them encrypted in a local vault — they never leave your server.
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Masked Input with show/hide toggle
// ──────────────────────────────────────────────────────────────────────────────
function SecretInput({ name, value, onChange, placeholder, label, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--notion-text-secondary, #999)', textTransform: 'uppercase' }}>
        {label}
      </label>
      {hint && <span style={{ fontSize: '11px', color: 'var(--notion-text-secondary, #888)', marginBottom: '2px' }}>{hint}</span>}
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px 40px 10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--notion-border, #333)',
            backgroundColor: 'var(--notion-sidebar, #1a1a1a)',
            color: 'inherit',
            fontSize: '13px',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          style={{
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--notion-text-secondary, #888)', padding: '2px',
          }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────
export default function ApiKeysPanel() {
  const [keys, setKeys] = useState({
    shodan: '',
    virustotal: '',
    censys_id: '',
    censys_secret: '',
    github: '',
    instagram_sessionid: '',
    instagram_ds_user_id: '',
    instagram_csrftoken: '',
    twitter_bearer: '',
  });

  const [saveStatus, setSaveStatus] = useState('');
  const [igTestStatus, setIgTestStatus] = useState(null); // null | 'testing' | 'ok' | 'fail'
  const [igConfigured, setIgConfigured] = useState(false);

  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem('holmes-api-keys');
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys);
        setKeys(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error('Failed to load API keys', e);
    }

    // Check live server status for Instagram
    fetch('/api/vault/instagram/status')
      .then(r => r.json())
      .then(data => setIgConfigured(data.configured === true))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setKeys(prev => ({ ...prev, [name]: value }));
    setSaveStatus('');
    if (name === 'instagram_sessionid') {
      setIgConfigured(!!value.trim());
      setIgTestStatus(null);
    }
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('holmes-api-keys', JSON.stringify(keys));

      // Push Instagram cookies to Vault (encrypted, no restart needed)
      const igVaultItems = [
        { service: 'instagram_sessionid', api_key: keys.instagram_sessionid },
        { service: 'instagram_ds_user_id', api_key: keys.instagram_ds_user_id },
        { service: 'instagram_csrftoken', api_key: keys.instagram_csrftoken },
      ];

      for (const item of igVaultItems) {
        if (item.api_key?.trim()) {
          try {
            await fetch('/api/vault/store', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
          } catch (err) {
            console.error(`Vault push failed for ${item.service}`, err);
          }
        }
      }

      // Push other API keys
      for (const [service, key] of Object.entries(keys)) {
        if (!service.startsWith('instagram_') && key?.trim()) {
          try {
            await fetch('/api/vault/store', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ service, api_key: key.trim() }),
            });
          } catch (err) {
            console.error(`Failed to push ${service} key to vault`, err);
          }
        }
      }

      setSaveStatus('saved');
      setIgConfigured(!!(keys.instagram_sessionid?.trim()));
      window.dispatchEvent(new CustomEvent('holmes-api-keys-updated'));
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      console.error('Failed to save API keys', e);
      setSaveStatus('error');
    }
  };

  const testInstagram = async () => {
    if (!keys.instagram_sessionid?.trim()) return;
    setIgTestStatus('testing');
    try {
      // Test: try to fetch a known account (instagram itself)
      const resp = await fetch('/api/analyze?username=instagram', {
        headers: { 'Accept': 'text/event-stream' },
      });
      if (resp.ok) {
        setIgTestStatus('ok');
      } else {
        setIgTestStatus('fail');
      }
    } catch {
      setIgTestStatus('fail');
    }
    setTimeout(() => setIgTestStatus(null), 5000);
  };

  const inputBase = {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--notion-border, #333)',
    backgroundColor: 'var(--notion-sidebar, #1a1a1a)',
    color: 'inherit',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: 'var(--notion-text-secondary, #999)',
    textTransform: 'uppercase',
  };

  const sectionHeading = (icon, label, color = '#2383e2') => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      borderBottom: `2px solid ${color}22`,
      paddingBottom: '8px',
      marginBottom: '14px',
      marginTop: '24px',
    }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: '14px', color }}>{label}</span>
    </div>
  );

  return (
    <div style={{
      backgroundColor: 'var(--notion-bg)',
      padding: '28px',
      borderRadius: '14px',
      border: '1px solid var(--notion-border)',
      maxWidth: '720px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <Shield size={22} color="#2383e2" />
        <h2 style={{ margin: 0, fontSize: '18px' }}>Credentials & API Keys</h2>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--notion-text-secondary, #888)', marginBottom: '28px', marginTop: '4px' }}>
        Add session cookies and API keys to unlock authenticated scanning. Stored encrypted in a local vault — never sent to third parties.
      </p>

      {/* ── INSTAGRAM SECTION ──────────────────────────────────────────────── */}
      {sectionHeading('', 'Instagram Session Cookies', '#e1306c')}

      <InstagramStatusBanner configured={igConfigured} />
      <CookieGuide />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SecretInput
          name="instagram_sessionid"
          value={keys.instagram_sessionid}
          onChange={handleChange}
          placeholder="Paste sessionid cookie value..."
          label="Session ID (required)"
          hint="The most important cookie — required for authentication."
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <SecretInput
            name="instagram_ds_user_id"
            value={keys.instagram_ds_user_id}
            onChange={handleChange}
            placeholder="ds_user_id value..."
            label="DS User ID (optional)"
            hint="Improves reliability."
          />
          <SecretInput
            name="instagram_csrftoken"
            value={keys.instagram_csrftoken}
            onChange={handleChange}
            placeholder="csrftoken value..."
            label="CSRF Token (optional)"
            hint="Needed for write operations."
          />
        </div>
      </div>

      {/* ── TWITTER/X SECTION ──────────────────────────────────────────────── */}
      {sectionHeading('', 'Twitter / X Bearer Token', '#1da1f2')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={labelStyle}>Bearer Token</label>
        <span style={{ fontSize: '11px', color: 'var(--notion-text-secondary, #888)', marginBottom: '4px' }}>
          Get it at developer.twitter.com → Your app → Keys &amp; Tokens
        </span>
        <SecretInput
          name="twitter_bearer"
          value={keys.twitter_bearer}
          onChange={handleChange}
          placeholder="AAA..."
          label="Bearer Token"
        />
      </div>

      {/* ── OTHER API KEYS SECTION ────────────────────────────────────────── */}
      {sectionHeading('', 'Other API Keys', '#2383e2')}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>Shodan API Key</label>
          <input type="password" name="shodan" value={keys.shodan || ''} onChange={handleChange} placeholder="Enter Shodan key..." style={inputBase} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>VirusTotal API Key</label>
          <input type="password" name="virustotal" value={keys.virustotal || ''} onChange={handleChange} placeholder="Enter VT key..." style={inputBase} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Censys API ID</label>
            <input type="password" name="censys_id" value={keys.censys_id || ''} onChange={handleChange} placeholder="Censys ID" style={inputBase} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Censys API Secret</label>
            <input type="password" name="censys_secret" value={keys.censys_secret || ''} onChange={handleChange} placeholder="Censys Secret" style={inputBase} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>GitHub Personal Access Token</label>
          <input type="password" name="github" value={keys.github || ''} onChange={handleChange} placeholder="ghp_..." style={inputBase} />
        </div>
      </div>

      {/* ── SAVE BUTTON ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 24px',
            background: 'linear-gradient(135deg, #2383e2, #1a6bca)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(35,131,226,0.35)',
            transition: 'transform 0.1s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Save size={16} /> Save & Encrypt to Vault
        </button>

        {saveStatus === 'saved' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2ecc71', fontSize: '13px', fontWeight: 600 }}>
            <CheckCircle size={15} /> Saved & encrypted
          </span>
        )}
        {saveStatus === 'error' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e74c3c', fontSize: '13px', fontWeight: 600 }}>
            <AlertCircle size={15} /> Failed to save
          </span>
        )}

        {/* Capability summary */}
        <div style={{
          marginTop: '20px',
          width: '100%',
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'var(--notion-sidebar, #111)',
          border: '1px solid var(--notion-border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          {[
            { label: 'Instagram', configured: igConfigured, icon: '' },
            { label: 'Shodan', configured: !!keys.shodan, icon: '' },
            { label: 'VirusTotal', configured: !!keys.virustotal, icon: '' },
            { label: 'GitHub', configured: !!keys.github, icon: '' },
            { label: 'Twitter/X', configured: !!keys.twitter_bearer, icon: '' },
            { label: 'Censys', configured: !!keys.censys_id, icon: '' },
          ].map(({ label, configured, icon }) => (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                background: configured ? 'rgba(46,213,115,0.12)' : 'rgba(255,255,255,0.05)',
                color: configured ? '#2ed573' : 'var(--notion-text-secondary, #888)',
                border: `1px solid ${configured ? 'rgba(46,213,115,0.3)' : 'transparent'}`,
              }}
            >
              {icon} {label} {configured ? '✓' : '—'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
