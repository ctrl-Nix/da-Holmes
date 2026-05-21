import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Key, Globe, Layers, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './SslIntel.module.css';

export default function SslIntel({ results }) {
  const [showSan, setShowSan] = useState(false);

  if (!results || results.status === 'unavailable') {
    return (
      <div className={styles.container} style={{ opacity: 0.65, borderStyle: 'dashed' }}>
        <div className={styles.header} style={{ borderBottom: 'none' }}>
          <div className={styles.titleSec}>
            <span className={styles.icon}>🚫</span>
            <span className={styles.titleText} style={{ color: 'rgba(55, 53, 47, 0.5)' }}>
              SSL/TLS Core Security Certificate: <strong>Module Offline</strong>
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
    subject_cn,
    issuer_org,
    valid_from,
    valid_until,
    san_domains = [],
    serial_number,
    signature_algorithm,
    days_remaining,
    risk_level,
    status_flags = [],
    is_self_signed
  } = results;

  const isExpired = status_flags.includes("EXPIRED") || days_remaining <= 0;
  const isExpiringSoon = status_flags.includes("EXPIRING_SOON");
  const selfSigned = is_self_signed || status_flags.includes("SELF_SIGNED");

  // Determine core styling configurations based on security risk levels
  let cardClass = styles.secureBorder;
  let statusBadgeClass = styles.badgeSecure;
  let statusIcon = <ShieldCheck size={18} />;
  let statusText = "Verified Secure Certificate";

  if (isExpired) {
    cardClass = styles.criticalBorder;
    statusBadgeClass = styles.badgeCritical;
    statusIcon = <ShieldAlert size={18} />;
    statusText = "Certificate Expired / Invalid";
  } else if (isExpiringSoon || selfSigned) {
    cardClass = styles.warnBorder;
    statusBadgeClass = styles.badgeWarn;
    statusIcon = <ShieldAlert size={18} />;
    statusText = selfSigned ? "Untrusted Self-Signed Certificate" : "Certificate Expiring Soon";
  }

  // Format date helper
  const formatDate = (str) => {
    if (!str) return 'N/A';
    try {
      return new Date(str).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return str;
    }
  };

  return (
    <div className={`${styles.container} ${cardClass}`}>
      <div className={styles.header}>
        <div className={styles.titleSec}>
          <span className={styles.icon}>🔒</span>
          <span className={styles.titleText}>SSL/TLS Core Security Certificate: <strong>{domain}</strong></span>
        </div>
        <span className={`${styles.statusBadge} ${statusBadgeClass}`}>
          {statusIcon}
          <span>{statusText}</span>
        </span>
      </div>

      <div className={styles.body}>
        
        {/* Core Validity Parameters */}
        <div className={styles.grid2Col}>
          
          {/* Diagnostic Details */}
          <div className={styles.infoCol}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Common Name (CN)</span>
              <span className={`${styles.val} ${styles.codeFont}`}>{subject_cn}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Authority Issuer</span>
              <span className={styles.val} style={{ fontWeight: 600 }}>{issuer_org}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Signature Algorithm</span>
              <span className={`${styles.val} ${styles.codeFont}`} style={{ fontSize: '11px' }}>{signature_algorithm}</span>
            </div>
            <div className={styles.detailRow} style={{ borderBottom: 'none' }}>
              <span className={styles.label}>Serial Reference</span>
              <span className={`${styles.val} ${styles.codeFont}`} style={{ fontSize: '11px', color: 'rgba(55,53,47,0.6)' }} title={serial_number}>
                {serial_number.length > 20 ? `${serial_number.slice(0, 18)}...` : serial_number}
              </span>
            </div>
          </div>

          {/* Time Remaining Metric & Dates */}
          <div className={styles.metricCol}>
            <div className={styles.metricWrapper}>
              <div className={styles.metricVal}>
                <span className={styles.metricNum}>{days_remaining}</span>
                <span className={styles.metricLabel}>Days Remaining</span>
              </div>
              
              <div className={styles.progressTrack}>
                <div 
                  className={`${styles.progressBar} ${
                    isExpired ? styles.progressRed : 
                    isExpiringSoon ? styles.progressYellow : 
                    styles.progressGreen
                  }`}
                  style={{ width: `${Math.min(100, (days_remaining / 365) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.datesRow}>
              <div className={styles.dateBlock}>
                <Calendar size={13} className={styles.dateIcon} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.dateLabel}>Issued Date</span>
                  <span className={styles.dateVal}>{formatDate(valid_from)}</span>
                </div>
              </div>
              
              <div className={styles.dateBlock}>
                <Calendar size={13} className={styles.dateIcon} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.dateLabel}>Expiry Date</span>
                  <span className={styles.dateVal}>{formatDate(valid_until)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Threat Warning Banners */}
        {status_flags.length > 0 && (
          <div className={styles.alertStack}>
            {isExpired && (
              <div className={`${styles.alert} ${styles.alertRed}`}>
                <ShieldAlert size={15} />
                <span>
                  <strong>CRITICAL VALIDATION FAILURE:</strong> The SSL certificate has expired. Intercepted connections will trigger browser safety warning intercepts.
                </span>
              </div>
            )}
            {isExpiringSoon && !isExpired && (
              <div className={`${styles.alert} ${styles.alertYellow}`}>
                <ShieldAlert size={15} />
                <span>
                  <strong>TLS WARNING:</strong> The certificate is expiring within 30 days. Plan immediate rotation renewal to preserve link reliability.
                </span>
              </div>
            )}
            {selfSigned && (
              <div className={`${styles.alert} ${styles.alertYellow}`}>
                <ShieldAlert size={15} />
                <span>
                  <strong>UNTRUSTED AUTHORITY:</strong> This host uses a self-signed root anchor certificate. Standard web navigations will flag untrusted alerts.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Collapsible SAN List */}
        {san_domains.length > 0 && (
          <div className={styles.sanWrapper}>
            <button 
              onClick={() => setShowSan(!showSan)} 
              className={styles.sanToggle}
            >
              <Layers size={13} />
              <span>Subject Alternative Names (SAN): <strong>{san_domains.length} Domains</strong></span>
              {showSan ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
            </button>
            
            {showSan && (
              <div className={styles.sanBadgeContainer}>
                {san_domains.map((san, idx) => (
                  <span key={idx} className={styles.sanBadge}>
                    <Globe size={10} style={{ marginRight: '4px', opacity: 0.7 }} />
                    {san}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
