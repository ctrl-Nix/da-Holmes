import React, { useState } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import modStyles from '../Modules.module.css';
import dashStyles from '../Dashboard.module.css';
import EmailHeaderIntel from '../components/EmailHeaderIntel';
import AnalystNotesPanel from '../components/AnalystNotesPanel';

export default function EmailHeadersPage({ apiBase, onInvestigate }) {
  const [emailHeadersText, setEmailHeadersText] = useState('');
  const [emailHeadersLoading, setEmailHeadersLoading] = useState(false);
  const [emailHeadersResults, setEmailHeadersResults] = useState(null);
  const [emailHeadersError, setEmailHeadersError] = useState('');

  const runEmailHeadersAudit = async (e) => {
    if (e) e.preventDefault();
    if (!emailHeadersText.trim()) return;
    setEmailHeadersLoading(true);
    setEmailHeadersResults(null);
    setEmailHeadersError('');

    try {
      const response = await fetch(`${apiBase}/api/email/headers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: emailHeadersText
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned status: ${response.status}`);
      }

      const data = await response.json();
      setEmailHeadersResults(data);
    } catch (err) {
      console.error('Email headers audit failed:', err);
      setEmailHeadersError(err.message || 'Inspection connection failed.');
      
      // Fallback mockup
      setEmailHeadersResults({
        from: "Secure Alert <alerts@phish-security-update.net>",
        reply_to: "hacker-support@protonmail.com",
        subject: "Security Alert: Verify Your Corporate Access Credentials",
        message_id: "<20260517120000.4124673@phish-security-update.net>",
        spf_status: "FAIL",
        x_originating_ip: "185.220.101.4",
        reply_to_mismatch: true,
        msg_id_domain_mismatch: false,
        hops: [
          {
            hop: 1,
            ip: "185.220.101.4",
            city: "Berlin",
            region: "Berlin",
            country: "Germany",
            country_code: "DE",
            org: "Tor Exit Node Relay",
            latitude: 52.5200,
            longitude: 13.4050,
            description: "from phishing-origin.local (185.220.101.4) by relay.tor-node.de..."
          },
          {
            hop: 2,
            ip: "82.165.229.41",
            city: "Karlsruhe",
            region: "Baden-Wurttemberg",
            country: "Germany",
            country_code: "DE",
            org: "1&1 Ionos SE",
            latitude: 49.0069,
            longitude: 8.4037,
            description: "from relay.tor-node.de (82.165.229.41) by mx.google.com..."
          },
          {
            hop: 3,
            ip: "209.85.219.45",
            city: "Mountain View",
            region: "California",
            country: "United States",
            country_code: "US",
            org: "Google LLC",
            latitude: 37.3860,
            longitude: -122.0838,
            description: "from mail-lj1-f172.google.com (209.85.219.45) by mail.recipient..."
          }
        ]
      });
    } finally {
      setEmailHeadersLoading(false);
    }
  };

  return (
    <div className={modStyles.container}>
      <div>
        <h1 className={dashStyles.title}>Email Header Forensic Inspector</h1>
        <div className={dashStyles.subtitle}>Paste the raw SMTP/MTA delivery headers of any email to trace routes and verify legitimacy.</div>
      </div>

      <form onSubmit={runEmailHeadersAudit} className={modStyles.inputGroup}>
        <label className={modStyles.inputLabel}>Raw SMTP Header Payload</label>
        <div className={modStyles.actionRow} style={{ flexDirection: 'column', gap: '14px', alignItems: 'stretch' }}>
          <textarea 
            className={modStyles.inputField} 
            style={{ height: '140px', fontFamily: 'monospace', fontSize: '12px', padding: '12px', resize: 'vertical' }}
            placeholder="Paste SMTP headers here... (e.g. Received: from ...)"
            value={emailHeadersText}
            onChange={(e) => setEmailHeadersText(e.target.value)}
          />
          <button 
            type="submit" 
            className={`${modStyles.btn} ${modStyles.btnPrimary} ${emailHeadersLoading ? modStyles.btnLoading : ''}`}
            disabled={emailHeadersLoading}
            style={{ alignSelf: 'flex-end' }}
          >
            {emailHeadersLoading ? 'Analyzing Hops...' : 'Analyze Header Delivery Hops'}
          </button>
        </div>
      </form>

      {emailHeadersLoading && (
        <div className={modStyles.resultsContainer}>
          <div className={modStyles.resultsHeader}>
            <div className="skeletonPulse skeletonTitle" style={{ margin: 0, height: '20px', width: '35%' }}></div>
          </div>
          <div className={modStyles.resultsBody} style={{ padding: '20px' }}>
            <div className="skeletonPulse skeletonTitle" style={{ width: '30%', height: '18px', marginBottom: '14px' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="skeletonCard" style={{ margin: 0, height: '80px' }}></div>
              <div className="skeletonCard" style={{ margin: 0, height: '80px' }}></div>
            </div>
          </div>
        </div>
      )}

      {emailHeadersError && (
        <div className={modStyles.resultsContainer} style={{ border: '1px solid #ca2c2c', padding: '20px', color: '#ca2c2c', borderRadius: '6px' }}>
          <strong>Error:</strong> {emailHeadersError}
        </div>
      )}

      {emailHeadersResults && !emailHeadersLoading && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'start', width: '100%', marginTop: '20px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <EmailHeaderIntel 
              results={emailHeadersResults} 
              onInvestigate={onInvestigate} 
            />
          </div>
          <AnalystNotesPanel query={emailHeadersResults.from || 'email_headers'} />
        </div>
      )}
    </div>
  );
}
