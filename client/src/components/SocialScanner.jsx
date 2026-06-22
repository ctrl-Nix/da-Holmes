import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, Sparkles, CornerDownLeft, ExternalLink, Terminal, AlertCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import styles from './SocialScanner.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

// The 6 designated quick check platforms
const QUICK_PLATFORMS = ['Instagram', 'Twitter', 'GitHub', 'Reddit', 'TikTok', 'Telegram'];

export default function SocialScanner({ isLoading }) {

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Phase 1: Quick Check State
  const [quickFindings, setQuickFindings] = useState([]);
  const [quickState, setQuickState] = useState('idle');
  
  // Phase 2: Maigret Deep Scan State — three separate lists
  const [foundList, setFoundList] = useState([]);
  const [notFoundList, setNotFoundList] = useState([]);
  const [unavailableList, setUnavailableList] = useState([]);
  const [deepState, setDeepState] = useState('idle');
  const [totalChecked, setTotalChecked] = useState(0);

  // Collapsible section toggles
  const [foundOpen, setFoundOpen] = useState(true);
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const [unavailableOpen, setUnavailableOpen] = useState(false);

  const [error, setError] = useState('');
  
  const timerRef = useRef(null);
  const activeAnalyzeSource = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activeAnalyzeSource.current) activeAnalyzeSource.current.close();
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span>⚡ Quick Check</span>
        </div>
        <div className={styles.cardGrid}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div key={num} className={styles.card} style={{ border: '1px solid var(--notion-border)', backgroundColor: 'transparent', padding: '16px', minHeight: '90px' }}>
              <div className="skeleton" style={{ width: '80px', height: '18px', borderRadius: '4px' }}></div>
              <div style={{ marginTop: '24px' }}>
                <div className="skeleton" style={{ width: '50%', height: '12px', margin: 0, borderRadius: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getPlatformDetails = (name) => {
    switch (name) {
      case 'Instagram': return { icon: '📸', color: '#E1306C' };
      case 'Twitter': return { icon: '🐦', color: '#1DA1F2' };
      case 'GitHub': return { icon: '💻', color: '#181717' };
      case 'Reddit': return { icon: '🤖', color: '#FF4500' };
      case 'TikTok': return { icon: '🎵', color: '#000000' };
      case 'Telegram': return { icon: '✈️', color: '#0088CC' };
      default: return { icon: '🌐', color: 'var(--notion-accent)' };
    }
  };


  // ── Phase 1: Quick Check Scan ──
  const startScanner = (e) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) return;

    setLoading(true);
    setQuickState('scanning');
    setQuickFindings([]);
    setDeepState('idle');
    setFoundList([]);
    setNotFoundList([]);
    setUnavailableList([]);
    setTotalChecked(0);
    setError('');

    if (timerRef.current) clearInterval(timerRef.current);
    if (activeAnalyzeSource.current) activeAnalyzeSource.current.close();
    
    // Setup deep scan initial state
    setDeepState('scanning');
    setFoundOpen(true);
    setNotFoundOpen(false);
    setUnavailableOpen(false);

    const url = `${API_BASE}/api/analyze?username=${encodeURIComponent(cleanUsername)}`;
    const eventSource = new EventSource(url);
    activeAnalyzeSource.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'platform') {
          const item = data.data || data;
          if (QUICK_PLATFORMS.some(p => p.toLowerCase() === item.platform.toLowerCase())) {
            setQuickFindings((prev) => {
              const exists = prev.some(p => p.name.toLowerCase() === item.platform.toLowerCase());
              if (exists) return prev;
              return [...prev, { name: item.platform, url: item.url, status: item.status }];
            });
          } else {
            const entry = { name: item.platform, url: item.url, status: item.status };
            if (item.status === 'found') {
              setFoundList((prev) => {
                if (prev.some((i) => i.name.toLowerCase() === entry.name.toLowerCase())) return prev;
                return [...prev, entry];
              });
            } else if (item.status === 'not_found') {
              setNotFoundList((prev) => {
                if (prev.some((i) => i.name.toLowerCase() === entry.name.toLowerCase())) return prev;
                return [...prev, entry];
              });
            } else {
              setUnavailableList((prev) => {
                if (prev.some((i) => i.name.toLowerCase() === entry.name.toLowerCase())) return prev;
                return [...prev, entry];
              });
            }
          }
          setTotalChecked((prev) => prev + 1);
        } else if (data.type === 'final') {
          eventSource.close();
          activeAnalyzeSource.current = null;
          setQuickState('completed');
          setDeepState('completed');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error parsing SSE Quick check:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      activeAnalyzeSource.current = null;
      setQuickState('completed');
      setDeepState('completed');
      setLoading(false);
    };
  };

  const TOTAL_SITES = 1800;
  const quickFoundCount = quickFindings.filter(f => f.status === 'found').length;
  const totalFound = quickFoundCount + foundList.length;
  const progressPercent = Math.min(100, Math.round((totalChecked / TOTAL_SITES) * 100));

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'found': return { label: 'FOUND', style: styles.pillFound, cardStyle: styles.cardFound };
      case 'not_found': return { label: 'NOT FOUND', style: styles.pillNotFound, cardStyle: styles.cardNotFound };
      case 'best_effort': return { label: 'UNVERIFIED', style: null, cardStyle: null };
      default: return { label: 'ERROR', style: styles.pillNotFound, cardStyle: styles.cardNotFound };
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={startScanner}>
        <div className={styles.inputWrapper}>
          <div className={styles.inputIcon}>
            <User size={18} />
          </div>
          <input
            type="text"
            className={styles.inputField}
            placeholder="Scan username footprints (e.g. torvalds)..."
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            disabled={loading}
          />
          <button
            type="submit"
            className={`${styles.submitBtn} ${!username.trim() || loading ? styles.submitBtnDisabled : ''}`}
            disabled={!username.trim() || loading}
          >
            {loading ? '...' : <CornerDownLeft size={14} />}
          </button>
        </div>
      </form>

      {(quickState !== 'idle' || deepState !== 'idle') && (
        <div className={styles.disclaimerBanner}>
          <span>🛡️</span>
          <span>Results are sourced from public APIs. Unavailable modules show clearly as offline. No data is fabricated or estimated.</span>
        </div>
      )}

      {/* ⚡ QUICK CHECK SECTION */}
      {quickState !== 'idle' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚡ Quick Check</span>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>
              {quickState === 'scanning' ? 'Scanning...' : 'Completed'}
            </span>
          </div>

          {quickState === 'scanning' && quickFindings.length === 0 && (
            <div className={styles.cardGrid}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div key={num} className={styles.card} style={{ border: '1px solid var(--notion-border)', backgroundColor: 'transparent', padding: '16px', minHeight: '90px' }}>
                  <div className={styles.cardTop}>
                    <div className="skeletonPulse" style={{ width: '80px', height: '18px', borderRadius: '4px' }}></div>
                  </div>
                  <div className={styles.cardBottom} style={{ marginTop: '14px' }}>
                    <div className="skeletonPulse skeletonBlock" style={{ width: '50%', height: '12px', margin: 0 }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {quickFindings.length > 0 && (
            <div className={styles.cardGrid}>
              {quickFindings.map((item, index) => {
                const details = getPlatformDetails(item.name);
                const isFound = item.status === 'found';
                const isBestEffort = item.status === 'best_effort';
                const statusDisplay = getStatusDisplay(item.status);
                return (
                  <div
                    key={item.name}
                    className={`${styles.card} ${isFound ? styles.cardFound : isBestEffort ? '' : styles.cardNotFound}`}
                    style={{
                      '--delay': `${index * 0.05}s`,
                      ...(isBestEffort ? {
                        border: '1px solid rgba(255,165,0,0.4)',
                        background: 'rgba(255,165,0,0.06)',
                      } : {})
                    }}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.platformBadge}>
                        <span className={styles.platformEmoji}>{details.icon}</span>
                        <span className={styles.platformName}>{item.name}</span>
                      </div>
                      {isBestEffort ? (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          padding: '3px 7px',
                          borderRadius: '20px',
                          background: 'rgba(255,165,0,0.18)',
                          color: '#ff9f43',
                          border: '1px solid rgba(255,165,0,0.4)',
                        }}>UNVERIFIED</span>
                      ) : (
                        <span className={`${styles.statusPill} ${isFound ? styles.pillFound : styles.pillNotFound}`}>
                          {isFound ? 'FOUND' : 'NOT FOUND'}
                        </span>
                      )}
                    </div>
                    <div className={styles.cardBottom}>
                      {isBestEffort ? (
                        <span style={{ fontSize: '11px', color: '#ff9f43', lineHeight: 1.4 }}>
                          🔑 Add session cookie in Settings for reliable results
                        </span>
                      ) : isFound ? (
                        <a href={item.url} target="_blank" rel="noreferrer" className={styles.visitBtn}>
                          <span>Visit Profile</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className={styles.profileInactive}>No presence resolved</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🔍 DEEP SCAN SECTION */}
      {deepState !== 'idle' && (
        <div className={styles.section} style={{ marginTop: '10px' }}>
          <div className={styles.sectionHeader}>
            <span>🔍 Deep Scan ({TOTAL_SITES}+ sites)</span>
          </div>

          {/* Live Counter & Progress Bar */}
          <div className={styles.deepProgressBox}>
            <div className={styles.deepProgressTop}>
              <span className={styles.counterText}>
                {deepState === 'completed'
                  ? `✅ Scan complete — ${totalChecked} sites checked`
                  : `Scanning... ${totalChecked} / ${TOTAL_SITES} sites checked`}
              </span>
              <span className={styles.progressPct}>{progressPercent}%</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          {/* ✅ Found Section — expanded by default */}
          <div className={styles.collapsibleSection}>
            <button className={`${styles.collapsibleHeader} ${styles.collapsibleGreen}`} onClick={() => setFoundOpen(!foundOpen)}>
              <span className={styles.collapsibleIcon}>
                {foundOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span>✅ Found ({foundList.length})</span>
            </button>
            {foundOpen && foundList.length > 0 && (
              <div className={styles.cardGrid}>
                {foundList.map((item, index) => {
                  const details = getPlatformDetails(item.name);
                  return (
                    <div key={`${item.name}-${index}`} className={`${styles.card} ${styles.cardFound}`} style={{ '--delay': '0s' }}>
                      <div className={styles.cardTop}>
                        <div className={styles.platformBadge}>
                          <span className={styles.platformEmoji}>{details.icon}</span>
                          <span className={styles.platformName}>{item.name}</span>
                        </div>
                        <span className={`${styles.statusPill} ${styles.pillFound}`}>FOUND</span>
                      </div>
                      <div className={styles.cardBottom}>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer" className={styles.visitBtn}>
                            <span>Visit Profile</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className={styles.profileInactive}>URL not available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {foundOpen && foundList.length === 0 && deepState === 'scanning' && (
              <div className={styles.compactEmpty}>Waiting for results...</div>
            )}
            {foundOpen && foundList.length === 0 && deepState === 'completed' && (
              <div className={styles.compactEmpty}>No profiles found on any sites.</div>
            )}
          </div>

          {/* ❌ Not Found Section — collapsed by default */}
          <div className={styles.collapsibleSection}>
            <button className={`${styles.collapsibleHeader} ${styles.collapsibleGray}`} onClick={() => setNotFoundOpen(!notFoundOpen)}>
              <span className={styles.collapsibleIcon}>
                {notFoundOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span>❌ Not Found ({notFoundList.length})</span>
            </button>
            {notFoundOpen && notFoundList.length > 0 && (
              <div className={styles.compactList}>
                {notFoundList.map((item, i) => (
                  <span key={i} className={styles.compactItem}>{item.name}</span>
                ))}
              </div>
            )}
            {notFoundOpen && notFoundList.length === 0 && (
              <div className={styles.compactEmpty}>No results yet.</div>
            )}
          </div>

          {/* ⚠️ Unavailable Section — collapsed by default */}
          <div className={styles.collapsibleSection}>
            <button className={`${styles.collapsibleHeader} ${styles.collapsibleOrange}`} onClick={() => setUnavailableOpen(!unavailableOpen)}>
              <span className={styles.collapsibleIcon}>
                {unavailableOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span>⚠️ Unavailable ({unavailableList.length})</span>
            </button>
            {unavailableOpen && unavailableList.length > 0 && (
              <div className={styles.compactList}>
                {unavailableList.map((item, i) => (
                  <span key={i} className={styles.compactItemOrange}>{item.name}</span>
                ))}
              </div>
            )}
            {unavailableOpen && unavailableList.length === 0 && (
              <div className={styles.compactEmpty}>No results yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Deep Scan Complete Banner */}
      {deepState === 'completed' && (
        <div className={styles.completeBanner}>
          <CheckCircle size={16} />
          <span>Deep footprint scan finished. Located {totalFound} total network node references.</span>
        </div>
      )}
    </div>
  );
}
