import React from 'react';
import { ArrowRight, Globe } from 'lucide-react';
import styles from './ReverseIP.module.css';

export default function ReverseIP({ results, onInvestigate }) {
  if (!results) return null;

  const { ip, domains, count, message } = results;

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}></span> Reverse IP Domain Resolution: <strong className={styles.ipHighlight}>{ip}</strong>
        </span>
        <span className={styles.cardBadge}>
          {count} Associated {count === 1 ? 'Host' : 'Hosts'}
        </span>
      </div>
      <div className={styles.cardBody}>
        {message && (
          <div className={styles.warningMessage}>
             {message}
          </div>
        )}

        {domains && domains.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th>
                    <div className={styles.thContent}>
                      <Globe size={12} style={{ color: 'rgba(55, 53, 47, 0.45)' }} />
                      <span>Domain Name</span>
                    </div>
                  </th>
                  <th style={{ textAlign: 'right' }}>Telemetry Action</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain, index) => (
                  <tr key={index}>
                    <td className={styles.domainName}>{domain}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => onInvestigate(domain)}
                        className={styles.investigateBtn}
                        title={`Feed ${domain} back into scanner`}
                      >
                        Investigate <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.noResults}>
            No virtual hosts or subdomains were mapped to this IP address in passive DNS history.
          </div>
        )}
      </div>
    </div>
  );
}
