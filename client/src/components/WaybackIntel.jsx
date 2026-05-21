import React from 'react';
import { Calendar, Globe, ExternalLink, Clock, FileText } from 'lucide-react';
import styles from './WaybackIntel.module.css';

export default function WaybackIntel({ results }) {
  if (!results) return null;

  const { domain, latest_snapshot, history = [] } = results;

  // Format YYYYMMDDhhmmss into a beautiful, human-readable date string
  const formatTimestamp = (ts) => {
    if (!ts || ts.length < 8) return ts;
    const year = ts.substring(0, 4);
    const monthIndex = parseInt(ts.substring(4, 6), 10) - 1;
    const day = parseInt(ts.substring(6, 8), 10);
    const hour = ts.substring(8, 10) || "00";
    const min = ts.substring(10, 12) || "00";

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const safeMonth = monthIndex >= 0 && monthIndex < 12 ? months[monthIndex] : "Unknown";
    return `${safeMonth} ${day}, ${year} at ${hour}:${min}`;
  };

  const hasHistory = history.length > 0;

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>🕰️</span> Wayback Archival Vault: <strong className={styles.domainHighlight}>{domain}</strong>
        </span>
        <span className={styles.cardBadge}>
          Time Machine Index
        </span>
      </div>

      <div className={styles.cardBody}>
        {/* Latest Snapshot Section */}
        <div className={styles.snapshotBox}>
          <div className={styles.snapshotHeader}>
            <Globe size={14} className={styles.icon} />
            <span>Latest Resolved Archive Snapshot</span>
          </div>
          {latest_snapshot ? (
            <a 
              href={latest_snapshot} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.snapshotLink}
            >
              <span>{latest_snapshot}</span>
              <ExternalLink size={12} style={{ flexShrink: 0 }} />
            </a>
          ) : (
            <div className={styles.noSnapshot}>
              No immediate snapshot available in Wayback Registry.
            </div>
          )}
        </div>

        {/* Timeline Section */}
        <div className={styles.timelineSection}>
          <div className={styles.timelineHeader}>
            <Clock size={14} className={styles.icon} />
            <h3>Historical Timeline Indexes ({history.length})</h3>
          </div>

          {hasHistory ? (
            <div className={styles.timelineWrapper}>
              <div className={styles.timelineLine} />
              
              <div className={styles.timelineList}>
                {history.map((item, index) => {
                  const snapshotUrl = `https://web.archive.org/web/${item.timestamp}/${domain}`;
                  const isSuccess = item.status.startsWith('2');
                  const isRedirect = item.status.startsWith('3');
                  
                  return (
                    <div key={`${item.timestamp}-${index}`} className={styles.timelineItem}>
                      {/* Node Indicator */}
                      <div className={`${styles.timelineNode} ${
                        isSuccess ? styles.nodeSuccess :
                        isRedirect ? styles.nodeRedirect :
                        styles.nodeDefault
                      }`}>
                        <Calendar size={10} style={{ color: 'white' }} />
                      </div>

                      {/* Content Card */}
                      <div className={styles.timelineCard}>
                        <div className={styles.cardMeta}>
                          <span className={styles.dateText}>
                            {formatTimestamp(item.timestamp)}
                          </span>
                          <div className={styles.badgeRow}>
                            <span className={`${styles.statusBadge} ${
                              isSuccess ? styles.statusSuccess :
                              isRedirect ? styles.statusRedirect :
                              styles.statusDefault
                            }`}>
                              HTTP {item.status}
                            </span>
                            <span className={styles.typeBadge}>
                              <FileText size={9} style={{ marginRight: '3px' }} />
                              {item.type || 'unknown'}
                            </span>
                          </div>
                        </div>

                        <a
                          href={snapshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.browseLink}
                        >
                          <span>Explore Snapshot</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.noHistory}>
              No historical archival snapshots registered for this domain.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
