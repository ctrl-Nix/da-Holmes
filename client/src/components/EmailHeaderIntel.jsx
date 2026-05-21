import React from 'react';
import { Mail, ShieldAlert, ArrowDown, MapPin, Terminal, AlertTriangle } from 'lucide-react';
import styles from './EmailHeaderIntel.module.css';

export default function EmailHeaderIntel({ results, onInvestigate }) {
  if (!results) return null;

  const {
    from,
    reply_to,
    subject,
    message_id,
    spf_status,
    x_originating_ip,
    reply_to_mismatch,
    msg_id_domain_mismatch,
    hops = []
  } = results;

  // Unicode flag emoji helper from ISO 3166 code
  const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode === 'Unknown') return '🌐';
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  };

  return (
    <div className={styles.container}>
      
      {/* Target summary header */}
      <div className={styles.header}>
        <div className={styles.titleSec}>
          <span className={styles.icon}>✉️</span>
          <span className={styles.titleText}>Email Routing Header Analysis</span>
        </div>
        <div className={styles.spfRow}>
          <span className={`${styles.badge} ${spf_status === 'PASS' ? styles.spfPass : styles.spfFail}`}>
            SPF Verification: {spf_status}
          </span>
        </div>
      </div>

      <div className={styles.body}>

        {/* Anti-Phishing Assessment Block */}
        {(reply_to_mismatch || msg_id_domain_mismatch || spf_status === 'FAIL') && (
          <div className={styles.alertStack}>
            <div className={styles.alertHeader}>
              <AlertTriangle size={16} />
              <span>🚨 SECURITY WARNING: PHISHING SIGNALS IDENTIFIED</span>
            </div>
            
            {reply_to_mismatch && (
              <div className={`${styles.alertItem} ${styles.alertCritical}`}>
                <ShieldAlert size={15} />
                <span>
                  <strong>Sender Mismatch Alert:</strong> Reply-To header (<code>{reply_to}</code>) differs from From header (<code>{from}</code>). High threat signature indicating active attacker redirection.
                </span>
              </div>
            )}

            {msg_id_domain_mismatch && (
              <div className={`${styles.alertItem} ${styles.alertWarning}`}>
                <ShieldAlert size={15} />
                <span>
                  <strong>Message-ID Mismatch:</strong> Message-ID host domain does not align with the sender's From address. Indicates potential spoofed outbound relays.
                </span>
              </div>
            )}

            {spf_status === 'FAIL' && (
              <div className={`${styles.alertItem} ${styles.alertCritical}`}>
                <ShieldAlert size={15} />
                <span>
                  <strong>SPF Check Failure:</strong> The sending IP was not authorized by the domain's SPF record. High spoofing threat.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Envelope Metadata Grid */}
        <div className={styles.infoGrid}>
          <div className={styles.detailRow}>
            <span className={styles.label}>From Address</span>
            <span className={`${styles.val} ${styles.codeFont}`} style={{ fontWeight: 600 }}>{from || 'N/A'}</span>
          </div>
          {reply_to && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Reply-To Redirection</span>
              <span className={`${styles.val} ${styles.codeFont}`} style={{ color: reply_to_mismatch ? '#ca2c2c' : 'inherit' }}>{reply_to}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.label}>Subject Envelope</span>
            <span className={styles.val} style={{ fontStyle: 'italic' }}>"{subject || 'No Subject'}"</span>
          </div>
          {message_id && (
            <div className={styles.detailRow}>
              <span className={styles.label}>Message-ID Reference</span>
              <span className={`${styles.val} ${styles.codeFont}`} style={{ fontSize: '11px' }}>{message_id}</span>
            </div>
          )}
          {x_originating_ip && (
            <div className={styles.detailRow} style={{ borderBottom: 'none' }}>
              <span className={styles.label}>X-Originating IP Header</span>
              <span className={styles.val} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code className={styles.codeFont} style={{ color: 'var(--notion-accent)', fontWeight: 600 }}>{x_originating_ip}</code>
                {onInvestigate && (
                  <button 
                    onClick={() => onInvestigate(x_originating_ip)} 
                    className={styles.pivotBtn}
                  >
                    🔍 Pivot Investigate
                  </button>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Hop-by-Hop delivery routing timeline */}
        <div className={styles.timelineSection}>
          <span className={styles.sectionTitle}>⛓️ Chronological MTA Delivery Routing Timeline</span>
          
          <div className={styles.timelineWrapper}>
            {hops.map((hop, index) => {
              const isLast = index === hops.length - 1;
              return (
                <div key={hop.hop} className={styles.hopRow}>
                  
                  {/* Hop bullet index */}
                  <div className={styles.bulletCol}>
                    <div className={styles.hopBullet}>
                      {hop.hop}
                    </div>
                    {!isLast && <div className={styles.bulletLine}></div>}
                  </div>

                  {/* Hop informational card */}
                  <div className={styles.cardCol}>
                    <div className={styles.hopCard}>
                      <div className={styles.hopCardHeader}>
                        <span className={styles.flagEmoji}>{getFlagEmoji(hop.country_code)}</span>
                        <span className={styles.hopLocation}>{hop.city}, {hop.region}, {hop.country}</span>
                        
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <code className={styles.codeFont} style={{ color: 'var(--notion-accent)', fontWeight: 600 }}>{hop.ip}</code>
                          {onInvestigate && (
                            <button 
                              onClick={() => onInvestigate(hop.ip)}
                              className={styles.pivotBtnSmall}
                            >
                              🔍 Pivot
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={styles.hopCardBody}>
                        <div className={styles.hopDetail}>
                          <span className={styles.detailLabel}>Active ISP/Network:</span>
                          <span className={styles.detailVal}>{hop.org || 'Unknown Operator'}</span>
                        </div>
                        {hop.description && (
                          <div className={styles.terminalDesc}>
                            <Terminal size={11} style={{ opacity: 0.6 }} />
                            <pre className={styles.descriptionText}>{hop.description}</pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isLast && (
                      <div className={styles.arrowConnector}>
                        <ArrowDown size={14} style={{ color: 'rgba(55,53,47,0.3)' }} />
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
