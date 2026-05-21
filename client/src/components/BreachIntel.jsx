import React from 'react';
import { AlertCircle, ShieldCheck, Calendar, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';
import styles from './BreachIntel.module.css';

export default function BreachIntel({ results }) {
  if (!results) return null;

  const { email, breach_count, breaches = [], most_recent_breach, exposed_data_types = [] } = results;

  // Custom coloring chips helper
  const getBadgeClass = (dataType) => {
    const dt = dataType.toLowerCase();
    if (dt.includes('password')) return styles.badgeRed;
    if (dt.includes('email')) return styles.badgeOrange;
    if (dt.includes('phone') || dt.includes('mobile')) return styles.badgeYellow;
    return styles.badgeNeutral;
  };

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
          {breach_count > 0 ? `🚨 ${breach_count} BREACHES RESOLVED` : '🛡️ TARGET SECURE'}
        </span>
      </div>

      <div className={styles.body}>
        {breach_count > 0 ? (
          <>
            {/* Warning overview */}
            <div className={styles.riskOverview}>
              <AlertTriangle className={styles.warningIcon} size={20} />
              <div>
                <strong>Active Credential Exposure Detected!</strong>
                <div className={styles.overviewText}>
                  This email has been leaked in <strong>{breach_count}</strong> data breach archives. 
                  Most recent incident: <strong>{most_recent_breach}</strong>. 
                  Immediate credential rotation is strongly advised if identical passwords are shared.
                </div>
              </div>
            </div>

            {/* Exposed Types Grid */}
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

            {/* Vertical Timeline */}
            <span className={styles.sectionTitle}>Chronological Leak History</span>
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
                        {item.data_classes.map((cls, cIdx) => (
                          <span key={cIdx} className={`${styles.miniChip} ${getBadgeClass(cls)}`}>
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
