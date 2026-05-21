import React from 'react';
import { ShieldAlert, ShieldAlert as ShieldWarn, ShieldCheck } from 'lucide-react';
import styles from './RiskScoreMeter.module.css';

export default function RiskScoreMeter({ score }) {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine classification and colors
  let status = 'SECURE';
  let statusClass = styles.statusSecure;
  let progressClass = styles.progressSecure;
  let Icon = ShieldCheck;

  if (clampedScore <= 33) {
    status = 'CRITICAL';
    statusClass = styles.statusCritical;
    progressClass = styles.progressCritical;
    Icon = ShieldAlert;
  } else if (clampedScore <= 66) {
    status = 'VULNERABLE';
    statusClass = styles.statusVulnerable;
    progressClass = styles.progressVulnerable;
    Icon = ShieldWarn;
  }

  return (
    <div className={styles.meterContainer}>
      <div className={styles.meterHeader}>
        <div className={styles.labelSection}>
          <Icon size={16} className={statusClass} />
          <span className={styles.title}>System Security Audit Status:</span>
          <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>
        </div>
        <div className={styles.scoreSection}>
          <span className={styles.scoreNumber}>{clampedScore}</span>
          <span className={styles.scoreScale}>/ 100 Score</span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className={styles.progressTrack}>
        <div 
          className={`${styles.progressBar} ${progressClass}`} 
          style={{ width: `${clampedScore}%` }} 
        />
      </div>
    </div>
  );
}
