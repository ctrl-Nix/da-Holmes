import React, { useState } from 'react';
import { Calendar, ShieldAlert, FileText, ChevronDown, ChevronUp, RefreshCw, Globe, HelpCircle } from 'lucide-react';
import styles from './WhoisIntel.module.css';

export default function WhoisIntel({ results }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!results || results.status === 'unavailable') {
    return (
      <div className={styles.container} style={{ opacity: 0.65, borderStyle: 'dashed' }}>
        <div className={styles.header} style={{ borderBottom: 'none' }}>
          <div className={styles.titleGroup}>
            <span className={styles.icon}></span>
            <span className={styles.titleText} style={{ color: 'rgba(55, 53, 47, 0.5)' }}>
              Domain WHOIS Lifecycle: <strong>Module Offline</strong>
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#ca2c2c', backgroundColor: '#fdf2f2', padding: '2px 6px', borderRadius: '4px' }}>
            OFFLINE
          </span>
        </div>
      </div>
    );
  }

  const {
    domain,
    registrar,
    creation_date,
    expiry_date,
    updated_date,
    name_servers,
    registrant_country,
    status,
    risk_indicators = [],
    raw_whois
  } = results;

  const isNew = risk_indicators.includes("NEW_DOMAIN");
  const isExpiring = risk_indicators.includes("EXPIRING_SOON");

  // Format date strings to readable formats
  const formatDateReadable = (str) => {
    if (!str) return 'N/A';
    try {
      const date = new Date(str);
      if (isNaN(date.getTime())) return str;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return str;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.icon}></span>
          <span className={styles.titleText}>Domain WHOIS Lifecycle: <strong>{domain}</strong></span>
        </div>
        <div className={styles.badgeRow}>
          {isNew && (
            <span className={`${styles.riskBadge} ${styles.riskNew}`}>
               NEW REGISTRY
            </span>
          )}
          {isExpiring && (
            <span className={`${styles.riskBadge} ${styles.riskExpiry}`}>
               EXPIRING SOON
            </span>
          )}
        </div>
      </div>

      <div className={styles.body}>
        
        {/* Visual Lifecycle Timeline */}
        <div className={styles.timelineSection}>
          <span className={styles.sectionHeader}> Registry Life Cycle Timeline</span>
          <div className={styles.timelineContainer}>
            
            {/* Creation node */}
            <div className={styles.timelineNode}>
              <div className={`${styles.nodeBullet} ${styles.bulletCreate}`}>
                <Calendar size={14} />
              </div>
              <div className={styles.nodeLabels}>
                <span className={styles.nodeTitle}>Registered</span>
                <span className={styles.nodeDate}>{formatDateReadable(creation_date)}</span>
              </div>
            </div>

            <div className={styles.timelineConnector}></div>

            {/* Update node */}
            <div className={styles.timelineNode}>
              <div className={`${styles.nodeBullet} ${styles.bulletUpdate}`}>
                <RefreshCw size={14} />
              </div>
              <div className={styles.nodeLabels}>
                <span className={styles.nodeTitle}>Last Updated</span>
                <span className={styles.nodeDate}>{formatDateReadable(updated_date)}</span>
              </div>
            </div>

            <div className={styles.timelineConnector}></div>

            {/* Expiry node */}
            <div className={`${styles.timelineNode} ${isExpiring ? styles.nodeWarning : ''}`}>
              <div className={`${styles.nodeBullet} ${isExpiring ? styles.bulletExpireWarning : styles.bulletExpire}`}>
                <Calendar size={14} />
              </div>
              <div className={styles.nodeLabels}>
                <span className={styles.nodeTitle}>Expiration</span>
                <span className={styles.nodeDate}>{formatDateReadable(expiry_date)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Informational Alerts */}
        {(isNew || isExpiring) && (
          <div className={styles.alertsContainer}>
            {isNew && (
              <div className={`${styles.alertBox} ${styles.alertOrange}`}>
                <ShieldAlert size={15} />
                <span>
                  <strong>Suspicious Age Detected:</strong> This domain was registered within the last 180 days. High correlation with temporary phishing campaigns or lookalike targets.
                </span>
              </div>
            )}
            {isExpiring && (
              <div className={`${styles.alertBox} ${styles.alertRed}`}>
                <ShieldAlert size={15} />
                <span>
                  <strong>Impending Expiration Warning:</strong> Expiry date occurs in less than 30 days. High hijacking risk or abandonment sign.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Detailed Metadata Grid */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCol}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Registrar Org</span>
              <span className={styles.detailVal} style={{ fontWeight: 600 }}>{registrar}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Registrant Country</span>
              <span className={styles.detailVal}>{registrant_country || 'Unknown'}</span>
            </div>
            <div className={styles.detailRow} style={{ borderBottom: 'none' }}>
              <span className={styles.detailLabel}>Registry Status</span>
              <span className={`${styles.detailVal} ${styles.codeFont}`} style={{ fontSize: '11px', color: '#2b7a3e' }}>{status || 'active'}</span>
            </div>
          </div>

          <div className={styles.infoCol} style={{ borderLeft: '1px solid var(--notion-border)' }}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel} style={{ paddingLeft: '16px' }}>Configured Name Servers</span>
              <span className={styles.detailVal} style={{ maxWidth: '100%' }}></span>
            </div>
            <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
              {name_servers && name_servers.length > 0 ? (
                name_servers.map((ns, idx) => (
                  <span key={idx} className={`${styles.nsBadge} ${styles.codeFont}`}>
                    <Globe size={11} /> {ns}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'rgba(55,53,47,0.5)' }}>No name servers listed.</span>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible raw details */}
        {raw_whois && (
          <div className={styles.collapsibleWrapper}>
            <button 
              onClick={() => setShowRaw(!showRaw)} 
              className={styles.collapseToggle}
            >
              <FileText size={13} />
              <span>{showRaw ? 'Hide Raw WHOIS Ledger Dump' : 'Inspect Raw WHOIS Ledger Dump'}</span>
              {showRaw ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
            </button>
            {showRaw && (
              <div className={styles.rawConsole}>
                <pre className={styles.codeBlock}>{raw_whois}</pre>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
