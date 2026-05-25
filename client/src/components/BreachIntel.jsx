import React from 'react';
import { AlertCircle, ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './BreachIntel.module.css';

export default function BreachIntel({ results, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>🕵️‍♂️</span>
            <div>
              <h3 className={styles.title}>Data Breach Exposure Telemetry</h3>
            </div>
          </div>
        </div>
        <div className={styles.body}>
          <div className="skeleton" style={{ height: '70px', marginBottom: '16px', borderRadius: '6px' }}></div>
          <div className="skeleton" style={{ height: '40px', marginBottom: '12px', borderRadius: '6px' }}></div>
          <div className="skeleton" style={{ height: '40px', marginBottom: '12px', borderRadius: '6px' }}></div>
          <div className="skeleton" style={{ height: '40px', borderRadius: '6px' }}></div>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const { email, breach_count, breaches = [], most_recent_breach, exposed_data_types = [], status, error } = results;

  // Custom coloring chips helper
  const getBadgeClass = (dataType) => {
    const dt = dataType.toLowerCase();
    if (dt.includes('password') || dt.includes('credential')) return styles.badgeRed;
    if (dt.includes('email') || dt.includes('username')) return styles.badgeOrange;
    if (dt.includes('phone') || dt.includes('mobile')) return styles.badgeYellow;
    return styles.badgeNeutral;
  };

  // Error State Handling
  if (status === 'api_error' || error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>🕵️‍♂️</span>
            <div>
              <h3 className={styles.title}>Data Breach Exposure Telemetry</h3>
              <div className={styles.subtitle}>Compromise monitoring for target: <strong style={{ color: 'var(--notion-fg)' }}>{email}</strong></div>
            </div>
          </div>
          <span className={`${styles.countBadge} ${styles.countError}`}>
            ⚠️ SCAN FAILED
          </span>
        </div>
        <div className={styles.body}>
          <div className={styles.errorBox}>
            <AlertCircle className={styles.errorIcon} size={24} />
            <div className={styles.errorContent}>
              <strong>Breach Database Unreachable</strong>
              <div className={styles.errorText}>
                {error || "The third-party breach database API (xposedornot) is currently down or timed out. We could not verify exposure for this email."}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* Overview Block */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>🕵️‍♂️</span>
          <div>
            <h3 className={styles.title}>Data Breach Exposure Telemetry</h3>
            <div className={styles.subtitle}>Compromise monitoring for target: <strong style={{ color: 'var(--notion-fg)' }}>{email}</strong></div>
          </div>
        </div>
        <span className={`${styles.countBadge} ${breach_count > 0 ? styles.countCritical : styles.countSecure}`}>
          {breach_count > 0 ? `🚨 ${breach_count} BREACHES RECORDED` : '🛡️ TARGET SECURE'}
        </span>
      </div>

      <div className={styles.body}>
        {breach_count > 0 ? (
          <>
            {/* Warning overview */}
            <div className={styles.riskOverview}>
              <AlertTriangle className={styles.warningIcon} size={24} />
              <div>
                <strong>Active Credential Exposure Detected!</strong>
                <div className={styles.overviewText}>
                  This email has been identified in <strong>{breach_count}</strong> data breach archives. 
                  Most recent incident: <strong>{most_recent_breach}</strong>. 
                  Immediate credential rotation is strongly advised if identical passwords are shared across accounts.
                </div>
              </div>
            </div>

            {/* Exposed Types Grid */}
            {exposed_data_types && exposed_data_types.length > 0 && (
              <div className={styles.typesBlock}>
                <span className={styles.sectionTitle}>Identified Compromised Data Vectors</span>
                <div className={styles.typesGrid}>
                  {exposed_data_types.map((type, idx) => (
                    <span key={idx} className={`${styles.dataTypeChip} ${getBadgeClass(type)}`}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vertical Timeline */}
            {breaches.length > 0 && (
              <>
                <span className={styles.sectionTitle} style={{ marginTop: '12px' }}>Chronological Leak History</span>
                <div className={styles.timeline}>
                  {breaches.map((item, idx) => {
                    // Parse year cleanly from breach date string (e.g. 2019-05-24 or raw 2019)
                    const year = item.date ? item.date.split('-')[0] : 'Unknown';
                    return (
                      <div key={idx} className={styles.timelineItem}>
                        <div className={styles.timelineLine}></div>
                        <div className={styles.timelineMarker}>
                          <ShieldAlert size={12} />
                        </div>
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineHeader}>
                            <h4 className={styles.breachName}>{item.name}</h4>
                            <span className={styles.breachYear}>🗓️ {year}</span>
                          </div>
                          <div className={styles.exposedChipsRow}>
                            {(item.data_classes || []).map((cls, cIdx) => (
                              <span key={cIdx} className={`${styles.miniChip} ${getBadgeClass(cls).className}`}>
                                {getBadgeClass(cls).icon} {cls}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <div className={styles.secureBox}>
            <ShieldCheck className={styles.secureIcon} size={24} />
            <div>
              <strong>Target email is clean!</strong>
              <div className={styles.secureText}>
                No verified records found in compromised leaks databases or dangled credentials repositories. Keep up safe security hygiene!
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

