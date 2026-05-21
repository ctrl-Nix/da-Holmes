import React from 'react';
import { ArrowRight, Globe, Shield, Activity } from 'lucide-react';
import styles from './DNSHistory.module.css';

export default function DNSHistory({ results, onInvestigate }) {
  if (!results) return null;

  const { domain, a_records = [], mx_records = [], ns_records = [], hosts = [] } = results;

  const hasDnsRecords = a_records.length > 0 || mx_records.length > 0 || ns_records.length > 0;
  const hasHosts = hosts.length > 0;

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>🌐</span> DNS & Host History Profile: <strong className={styles.domainHighlight}>{domain}</strong>
        </span>
        <span className={styles.cardBadge}>
          Active Reconnaissance
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.twoColumnGrid}>
          
          {/* Left Column: DNS Records Table */}
          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <Shield size={14} className={styles.columnIcon} style={{ color: 'var(--notion-accent)' }} />
              <h3>Passive DNS Resolution</h3>
            </div>
            
            <div className={styles.tableWrapper}>
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Record Type</th>
                    <th>Resolved Value</th>
                  </tr>
                </thead>
                <tbody>
                  {/* A Records */}
                  {a_records.map((rec, i) => (
                    <tr key={`a-${i}`}>
                      <td className={`${styles.recordType} ${styles.typeA}`}>A (IPv4)</td>
                      <td className={styles.codeFont}>
                        <div className={styles.valueRow}>
                          <span>{rec}</span>
                          <button 
                            className={styles.rowInvestigate} 
                            onClick={() => onInvestigate(rec)}
                            title={`Scan IP ${rec}`}
                          >
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* MX Records */}
                  {mx_records.map((rec, i) => (
                    <tr key={`mx-${i}`}>
                      <td className={`${styles.recordType} ${styles.typeMx}`}>MX (Mail)</td>
                      <td className={styles.codeFont}>{rec}</td>
                    </tr>
                  ))}
                  {/* NS Records */}
                  {ns_records.map((rec, i) => (
                    <tr key={`ns-${i}`}>
                      <td className={`${styles.recordType} ${styles.typeNs}`}>NS (Nameserver)</td>
                      <td className={styles.codeFont}>{rec}</td>
                    </tr>
                  ))}
                  {!hasDnsRecords && (
                    <tr>
                      <td colSpan="2" className={styles.noData}>
                        No DNS records discovered for this host.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Host List Table */}
          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <Activity size={14} className={styles.columnIcon} style={{ color: '#2b7a3e' }} />
              <h3>Passive Host Enumeration ({hosts.length})</h3>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>Subdomain / Host</th>
                    <th>Mapped IP</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.map((hostEntry, i) => (
                    <tr key={`host-${i}`}>
                      <td className={styles.codeFont} style={{ fontWeight: 500 }}>
                        {hostEntry.host}
                      </td>
                      <td className={styles.codeFont} style={{ fontSize: '11.5px', color: 'rgba(55, 53, 47, 0.65)' }}>
                        {hostEntry.ip}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => onInvestigate(hostEntry.host)}
                          className={styles.investigateBtn}
                          title={`Investigate host ${hostEntry.host}`}
                        >
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!hasHosts && (
                    <tr>
                      <td colSpan="3" className={styles.noData}>
                        No historical hosts detected in search index.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
