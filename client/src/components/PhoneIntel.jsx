import React from 'react';
import { Phone, ShieldAlert, ShieldCheck, MapPin, Hash, UserCheck } from 'lucide-react';
import styles from './PhoneIntel.module.css';

export default function PhoneIntel({ results }) {
  if (!results) return null;

  const { number, carrier, country, line_type, risk_level, source } = results;

  const isHighRisk = risk_level === 'HIGH_RISK';
  
  // Custom styles for line types & risk badges
  const isVoipOrBurner = 
    line_type.toLowerCase().includes('voip') || 
    line_type.toLowerCase().includes('burner') || 
    line_type.toLowerCase().includes('virtual');

  const isVerifiedMobile = 
    line_type.toLowerCase() === 'mobile' || 
    line_type.toLowerCase().includes('wireless');

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}></span> Phone Intelligence Scan: <strong className={styles.phoneHighlight}>+{number}</strong>
        </span>
        <span className={`${styles.riskBadge} ${isHighRisk ? styles.riskHigh : styles.riskLow}`}>
          {isHighRisk ? (
            <>
              <ShieldAlert size={12} style={{ marginRight: '4px' }} /> High Risk
            </>
          ) : (
            <>
              <ShieldCheck size={12} style={{ marginRight: '4px' }} /> Verified Low Risk
            </>
          )}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoGrid}>
          
          {/* Carrier block */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <UserCheck size={14} className={styles.blockIcon} />
              <span>Network Operator</span>
            </div>
            <div className={styles.blockValue}>{carrier || 'Unknown'}</div>
          </div>

          {/* Country block */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <MapPin size={14} className={styles.blockIcon} />
              <span>Registered Country</span>
            </div>
            <div className={styles.blockValue}>{country || 'Unknown'}</div>
          </div>

          {/* Line Type block */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <Hash size={14} className={styles.blockIcon} />
              <span>Line Configuration</span>
            </div>
            <div className={styles.blockValue}>
              <span className={`${styles.lineBadge} ${
                isVoipOrBurner ? styles.lineVoip : 
                isVerifiedMobile ? styles.lineMobile : 
                styles.lineDefault
              }`}>
                {line_type}
              </span>
            </div>
          </div>

        </div>

        <div className={styles.footer}>
          <span>Scan Metadata Telemetry: <strong>{source}</strong></span>
        </div>
      </div>
    </div>
  );
}
