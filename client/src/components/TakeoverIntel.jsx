import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, Info, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import styles from './TakeoverIntel.module.css';

export default function TakeoverIntel({ results }) {
  const [expanded, setExpanded] = useState(false);

  if (!results || results.status === 'unavailable' || results.length === 0) {
    if (results && results.status === 'unavailable') {
      return (
        <div className={styles.container} style={{ opacity: 0.65, borderStyle: 'dashed' }}>
          <div className={styles.header} style={{ borderBottom: 'none' }}>
            <div className={styles.headerTitleSec}>
              <span className={styles.icon}>🚫</span>
              <span className={styles.headerText} style={{ color: 'rgba(55, 53, 47, 0.5)' }}>
                Subdomain Takeover vulnerability Audit: <strong>Module Offline</strong>
              </span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#ca2c2c', backgroundColor: '#fdf2f2', padding: '2px 6px', borderRadius: '4px' }}>
              OFFLINE
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  const vulnerableList = results.filter(r => r.vulnerable);
  const secureList = results.filter(r => !r.vulnerable);

  return (
    <div className={styles.container}>
      
      {/* Header Info Banner */}
      <div className={styles.header}>
        <div className={styles.headerTitleSec}>
          <span className={styles.icon}>🎯</span>
          <span className={styles.headerText}>Subdomain Takeover vulnerability Audit</span>
        </div>
        <span className={`${styles.riskBadge} ${vulnerableList.length > 0 ? styles.riskCritical : styles.riskSecure}`}>
          {vulnerableList.length > 0 ? `🚨 ${vulnerableList.length} TAKEOVER DETECTED` : '🛡️ NO TAKEOVER RISK'}
        </span>
      </div>

      <div className={styles.body}>
        
        {/* Critical Warnings Stack */}
        {vulnerableList.length > 0 ? (
          <div className={styles.warningBox}>
            <div className={styles.warningHeader}>
              <AlertOctagon size={16} />
              <span>HIGH THREAT EXPOSURE: DANGLED ALIAS DNS ENTRIES FOUND</span>
            </div>
            <div className={styles.warningList}>
              {vulnerableList.map((item, idx) => (
                <div key={idx} className={styles.vulnerableItem}>
                  <div className={styles.subLabel}>
                    <code className={styles.subCode}>{item.subdomain}</code>
                    <span className={styles.takeoverServiceLabel}>{item.service} Takeover</span>
                  </div>
                  <div className={styles.fingerprintRow}>
                    <Terminal size={11} className={styles.terminalIcon} />
                    <span className={styles.fpText}>Fingerprint: "{item.fingerprint}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.secureBox}>
            <ShieldCheck size={16} />
            <span>All monitored subdomains are strictly pointing to active resources or do not match dangled CNAME signature models.</span>
          </div>
        )}

        {/* Accordion list of all checked subdomains */}
        <div className={styles.accordionHeader} onClick={() => setExpanded(!expanded)}>
          <div className={styles.accordionTitle}>
            <Info size={14} style={{ opacity: 0.7 }} />
            <span>Monitored Host Telemetry ({results.length} Subdomains audited)</span>
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {expanded && (
          <div className={styles.accordionContent}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th>Host Subdomain</th>
                  <th>DNS Status</th>
                  <th>Service Link</th>
                  <th>Vulnerability</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => (
                  <tr key={idx} className={item.vulnerable ? styles.tableVulnerableRow : ''}>
                    <td>
                      <code className={styles.subCodeTable}>{item.subdomain}</code>
                    </td>
                    <td>
                      <span className={styles.statusSpan}>
                        {item.fingerprint === 'Does not resolve' ? '🔴 Unresolved' : '🟢 Resolves'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.serviceSpan}>
                        {item.service !== 'None' ? item.service : 'Active Resource'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.takeoverBadge} ${item.vulnerable ? styles.takeoverBadgeYes : styles.takeoverBadgeNo}`}>
                        {item.vulnerable ? '🚨 Vulnerable' : '🛡️ Secure'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
