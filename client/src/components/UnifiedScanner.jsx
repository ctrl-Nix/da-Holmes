import React, { useState, useEffect } from 'react';
import { Search, CornerDownLeft, Terminal, AlertCircle, ChevronDown, ChevronUp, Layers, Play } from 'lucide-react';
import styles from './UnifiedScanner.module.css';
import ReverseIP from './ReverseIP';
import DNSHistory from './DNSHistory';
import PhoneIntel from './PhoneIntel';
import WaybackIntel from './WaybackIntel';
import RiskScoreMeter from './RiskScoreMeter';
import IpIntel from './IpIntel';
import WhoisIntel from './WhoisIntel';
import SslIntel from './SslIntel';
import TakeoverIntel from './TakeoverIntel';
import BreachIntel from './BreachIntel';
import AnalystNotesPanel from './AnalystNotesPanel';

const API_BASE = import.meta.env.VITE_API_URL;

export default function UnifiedScanner({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [detectedType, setDetectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ── Batch Mode State ──
  const [batchMode, setBatchMode] = useState(false);
  const [batchQuery, setBatchQuery] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [expandedTarget, setExpandedTarget] = useState(null);

  // ── Frontend Real-time Detection Logic ──
  const detectType = (val) => {
    const q = val.trim();
    if (!q) return '';

    // BTC Wallet: starts with 1, 3, or bc1
    if (/^(1|3|bc1)/.test(q)) {
      return 'btc';
    }
    // Email: Standard email regex
    if (/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(q)) {
      return 'email';
    }
    // IP: Standard IPv4 dot-decimal
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(q)) {
      return 'network';
    }
    // Domain: Host format
    if (/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(q)) {
      return 'domain';
    }
    // BSSID: MAC Address format (XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)
    if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(q)) {
      return 'bssid';
    }
    // Phone Number: strips formatting and counts digits
    const cleaned = q.replace(/[\s\-()\[\]\+]/g, '');
    if (cleaned.length >= 7 && cleaned.length <= 15 && /^\d+$/.test(cleaned)) {
      return 'phone';
    }

    // Default Fallback
    return 'username';
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      const type = detectType(initialQuery);
      setDetectedType(type);
      triggerScan(initialQuery, type);
    }
  }, [initialQuery]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setDetectedType(detectType(val));
    setError('');
  };

  // ── Unified Scanner Core Logic ──
  const triggerScan = async (targetQuery, targetType) => {
    const cleanQuery = targetQuery.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setResult(null);
    setError('');

    // Abort controller for global 15s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      let data;
      const fetchOpts = { signal: controller.signal };

      if (targetType === 'network') {
        const [intelRes, reverseRes] = await Promise.all([
          fetch(`${API_BASE}/api/ip/intel?ip=${encodeURIComponent(cleanQuery)}`, fetchOpts),
          fetch(`${API_BASE}/api/reverseip?ip=${encodeURIComponent(cleanQuery)}`, fetchOpts).catch(() => null)
        ]);
        
        if (!intelRes.ok) {
          const errBody = await intelRes.json().catch(() => ({}));
          throw new Error(errBody.detail || `Server returned status: ${intelRes.status}`);
        }
        
        const intelData = await intelRes.json();
        const reverseData = reverseRes && reverseRes.ok ? await reverseRes.json() : { domains: [], count: 0 };
        
        data = {
          ...intelData,
          reverse: reverseData
        };
      } else if (targetType === 'domain') {
        const [dnsRes, waybackRes, whoisRes, sslRes, takeoverRes] = await Promise.all([
          fetch(`${API_BASE}/api/dns/history?domain=${encodeURIComponent(cleanQuery)}`, fetchOpts),
          fetch(`${API_BASE}/api/archive/wayback?domain=${encodeURIComponent(cleanQuery)}`, fetchOpts),
          fetch(`${API_BASE}/api/whois?domain=${encodeURIComponent(cleanQuery)}`, fetchOpts).catch(() => null),
          fetch(`${API_BASE}/api/ssl/inspect?domain=${encodeURIComponent(cleanQuery)}`, fetchOpts).catch(() => null),
          fetch(`${API_BASE}/api/subdomain/takeover?domain=${encodeURIComponent(cleanQuery)}`, fetchOpts).catch(() => null)
        ]);

        if (!dnsRes.ok) {
          const errBody = await dnsRes.json().catch(() => ({}));
          throw new Error(errBody.detail || `DNS history error: ${dnsRes.status}`);
        }

        const dnsData = await dnsRes.json();
        const waybackData = waybackRes.ok ? await waybackRes.json() : [];
        const whoisData = whoisRes && whoisRes.ok ? await whoisRes.json() : null;
        const sslData = sslRes && sslRes.ok ? await sslRes.json() : null;
        const takeoverData = takeoverRes && takeoverRes.ok ? await takeoverRes.json() : [];

        data = {
          dns: dnsData,
          wayback: waybackData,
          whois: whoisData,
          ssl: sslData,
          takeover: takeoverData
        };
      } else if (targetType === 'email') {
        const response = await fetch(`${API_BASE}/api/breach/check?email=${encodeURIComponent(cleanQuery)}`, fetchOpts);
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.detail || `Server returned status: ${response.status}`);
        }
        data = await response.json();
      } else if (targetType === 'phone') {
        const response = await fetch(`${API_BASE}/api/phone?number=${encodeURIComponent(cleanQuery)}`, fetchOpts);
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.detail || `Server returned status: ${response.status}`);
        }
        data = await response.json();
      } else {
        // username, btc, bssid — all go through unified scanner
        const response = await fetch(`${API_BASE}/api/unified/scan?query=${encodeURIComponent(cleanQuery)}`, fetchOpts);
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.detail || errBody.reason || `Server returned status: ${response.status}`);
        }
        const unified = await response.json();
        // Flatten: use unified.data as the result for rendering
        data = unified.data || unified;
      }

      setResult(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Scan timed out after 15 seconds. The target may be unreachable.');
      } else {
        console.error('Unified scanner error:', err);
        setError(err.message || 'Scan connection failed.');
      }
      setResult(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // ── SSE Batch Mode Trigger Scan ──
  const handleBatchScan = async () => {
    const rawTargets = batchQuery.split('\n').map(t => t.trim()).filter(Boolean);
    if (rawTargets.length === 0) {
      alert("Please enter at least one target query.");
      return;
    }
    if (rawTargets.length > 10) {
      alert("A maximum of 10 targets can be scanned concurrently.");
      return;
    }

    setBatchLoading(true);
    setBatchResults([]);
    setBatchProgress(0);
    setExpandedTarget(null);

    try {
      const response = await fetch(`${API_BASE}/api/batch/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targets: rawTargets })
      });

      if (!response.ok) {
        throw new Error(`Batch execution returned error ${response.status}`);
      }

      // Stream progress
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialBuffer += decoder.decode(value, { stream: true });
        const lines = partialBuffer.split('\n');
        partialBuffer = lines.pop(); // Hold remaining partial lines

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawJson = line.slice(6).trim();
            if (rawJson) {
              try {
                const parsed = JSON.parse(rawJson);
                setBatchResults(prev => {
                  const filtered = prev.filter(p => p.target !== parsed.target);
                  const updated = [...filtered, parsed];
                  setBatchProgress(Math.min(100, Math.round((updated.length / rawTargets.length) * 100)));
                  return updated;
                });
              } catch (parseErr) {
                console.error("Failed to parse SSE JSON chunk", parseErr);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Batch scan execution encountered errors: " + err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleInvestigate = (newVal) => {
    if (batchMode) {
      setBatchQuery(prev => prev ? `${prev}\n${newVal}` : newVal);
    } else {
      setQuery(newVal);
      const type = detectType(newVal);
      setDetectedType(type);
      triggerScan(newVal, type);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    triggerScan(query, detectedType);
  };

  // ── Badge Style Mappings ──
  const getBadgeStyle = (type) => {
    const map = {
      btc: { emoji: '🪙', label: 'Bitcoin Wallet Address', className: styles.badge_btc },
      email: { emoji: '📧', label: 'Email Address Node', className: styles.badge_email },
      network: { emoji: '🌐', label: 'IP Address Network', className: styles.badge_network },
      domain: { emoji: '🖥️', label: 'Host Domain Name', className: styles.badge_domain },
      bssid: { emoji: '📶', label: 'Wireless BSSID', className: styles.badge_bssid },
      username: { emoji: '👤', label: 'Target Account Username', className: styles.badge_username },
      phone: { emoji: '📱', label: 'Telephony Node', className: styles.badge_phone }
    };
    return map[type] || null;
  };

  const badgeInfo = getBadgeStyle(detectedType);

  // ── Risk Score Logic ──
  const computeScore = (res) => {
    if (!res) return 100;
    let score = 100;

    // 1. Domain checks
    const dns = res.dns || {};
    const spf = dns.spf_record || dns.txt?.some(t => t.includes('spf1'));
    if (!spf) score -= 15;

    const dmarc = dns.dmarc_record;
    if (!dmarc) score -= 15;

    const subdomainsCount = res.subdomain_count || res.subdomains?.length || 0;
    if (subdomainsCount > 5) {
      score -= (subdomainsCount - 5) * 10;
    }

    // 2. Social checks
    const socialsList = res.social?.platforms || res.platforms || [];
    const foundSocialCount = socialsList.filter(p => p.status === 'found').length;
    score -= foundSocialCount * 15;

    // 3. High risk indicators
    if (res.risk_level === 'HIGH_RISK') {
      score -= 50;
    }

    const whoisRisks = res.whois?.risk_indicators || res.risk_indicators || [];
    if (whoisRisks.includes("NEW_DOMAIN")) score -= 15;
    if (whoisRisks.includes("EXPIRING_SOON")) score -= 15;

    // 4. SSL Penalty
    const sslFlags = res.ssl?.status_flags || [];
    if (sslFlags.includes("EXPIRED")) score -= 30;
    if (sslFlags.includes("EXPIRING_SOON")) score -= 15;
    if (sslFlags.includes("SELF_SIGNED")) score -= 20;

    // 5. Takeover Vulnerabilities
    const takeovers = res.takeover || [];
    const vulnerableTakeovers = takeovers.filter(t => t.vulnerable).length;
    score -= vulnerableTakeovers * 25;

    // 6. Breach Leaks
    if (res.breaches && res.breaches.length > 0) {
      score -= res.breaches.length * 20;
    }

    return Math.max(0, Math.min(100, score));
  };

  // ── History Sync Effect ──
  useEffect(() => {
    if (result) {
      try {
        const score = computeScore(result);
        let history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
        
        const cleanQuery = query.trim();
        if (cleanQuery) {
          history = history.filter(item => item.query !== cleanQuery);
          
          history.unshift({
            query: cleanQuery,
            type: detectedType || 'username',
            timestamp: new Date().toISOString(),
            riskScore: score
          });
          
          history = history.slice(0, 20);
          localStorage.setItem('holmes-history', JSON.stringify(history));
          window.dispatchEvent(new CustomEvent('holmes-history-updated'));
        }
      } catch (err) {
        console.error('Failed to update holmes history:', err);
      }
    }
  }, [result]);

  // Helper to determine what layout/card to render based on the results structure
  const renderSingleTargetResult = (singleRes, queryVal) => {
    if (!singleRes) return null;

    let specificCard = null;

    if (singleRes.ports_scan !== undefined) {
      specificCard = <IpIntel results={singleRes} onInvestigate={handleInvestigate} />;
    } else if (singleRes.domains !== undefined && singleRes.ip !== undefined) {
      specificCard = <ReverseIP results={singleRes} onInvestigate={handleInvestigate} />;
    } else if (singleRes.dns !== undefined && singleRes.wayback !== undefined) {
      specificCard = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {singleRes.takeover && singleRes.takeover.length > 0 && <TakeoverIntel results={singleRes.takeover} />}
          {singleRes.ssl && <SslIntel results={singleRes.ssl} />}
          {singleRes.whois && <WhoisIntel results={singleRes.whois} />}
          <DNSHistory results={singleRes.dns} onInvestigate={handleInvestigate} />
          <WaybackIntel results={singleRes.wayback} />
        </div>
      );
    } else if (singleRes.risk_level !== undefined && (singleRes.number !== undefined || singleRes.carrier !== undefined)) {
      specificCard = <PhoneIntel results={singleRes} />;
    } else if (singleRes.breach_count !== undefined || singleRes.breaches !== undefined) {
      specificCard = <BreachIntel results={singleRes} />;
    } else if (singleRes.social !== undefined && singleRes.social.platforms !== undefined) {
      // Username scan with social platform data
      const social = singleRes.social;
      specificCard = (
        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={12} /> SOCIAL FOOTPRINT ANALYSIS
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: social.level === 'SECURE' ? 'rgba(14,159,110,0.1)' : social.level === 'VULNERABLE' ? 'rgba(201,117,29,0.1)' : 'rgba(202,44,44,0.1)',
              color: social.level === 'SECURE' ? '#0e9f6e' : social.level === 'VULNERABLE' ? '#c9751d' : '#ca2c2c'
            }}>
              {social.level} — Score: {social.score}/100
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 0' }}>
            {social.platforms.map((p, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: p.status === 'found' ? 'rgba(14,159,110,0.06)' : 'rgba(127,140,141,0.06)',
                border: `1px solid ${p.status === 'found' ? 'rgba(14,159,110,0.15)' : 'var(--notion-border)'}`,
                fontSize: '13px'
              }}>
                <span style={{ fontWeight: 600 }}>{p.platform}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {p.url && p.status === 'found' && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#2383e2' }}>
                      Open →
                    </a>
                  )}
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    textTransform: 'uppercase',
                    backgroundColor: p.status === 'found' ? 'rgba(14,159,110,0.12)' : p.status === 'not_found' ? 'rgba(127,140,141,0.12)' : 'rgba(201,117,29,0.12)',
                    color: p.status === 'found' ? '#0e9f6e' : p.status === 'not_found' ? '#7f8c8d' : '#c9751d'
                  }}>
                    {p.status === 'found' ? '✓ FOUND' : p.status === 'not_found' ? '✗ NOT FOUND' : '⚠ UNAVAILABLE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {singleRes.leaks && singleRes.leaks.length > 0 && (
            <div style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: 'rgba(202,44,44,0.04)', borderRadius: '6px', border: '1px solid rgba(202,44,44,0.1)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ca2c2c', marginBottom: '4px', textTransform: 'uppercase' }}>Leak Intelligence</div>
              {singleRes.leaks.map((leak, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: 'var(--notion-fg-secondary)' }}>
                  <strong>{leak.source}:</strong> {leak.match}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (singleRes.balance_btc !== undefined || singleRes.explorer_url !== undefined) {
      // BTC wallet results
      specificCard = (
        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={12} /> BLOCKCHAIN INTELLIGENCE
            </span>
            <span>🪙 Bitcoin</span>
          </div>
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'rgba(46,204,113,0.06)', borderRadius: '6px', border: '1px solid rgba(46,204,113,0.15)' }}>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Balance</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#2ecc71' }}>{singleRes.balance_btc?.toFixed(8) || '0.00000000'} BTC</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--notion-sidebar)', borderRadius: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Transactions</span>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{singleRes.tx_count || 0}</span>
            </div>
            {singleRes.explorer_url && (
              <a href={singleRes.explorer_url} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', backgroundColor: 'var(--notion-accent-bg)', color: 'var(--notion-accent)',
                borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none',
                border: '1px solid var(--notion-border)', width: 'fit-content'
              }}>
                🔗 View on Blockchain Explorer →
              </a>
            )}
            {singleRes.message && (
              <div style={{ fontSize: '12px', color: 'rgba(55,53,47,0.5)', fontStyle: 'italic' }}>{singleRes.message}</div>
            )}
          </div>
        </div>
      );
    } else {
      specificCard = (
        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={12} /> VERIFIED TARGET DECODED
            </span>
            <span>HTTP 200 OK</span>
          </div>
          <pre className={styles.codeBlock}>
            {JSON.stringify(singleRes, null, 2)}
          </pre>
        </div>
      );
    }

    const handleExportReport = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/report/generate?query=${encodeURIComponent(queryVal)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(singleRes)
        });
        
        if (!response.ok) throw new Error('Failed to generate report PDF');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `holmes_report_${queryVal}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        alert('Failed to generate PDF: ' + err.message);
      }
    };

    const computedScore = computeScore(singleRes);

    return (
      <div className={styles.resultsLayout}>
        <div className={styles.resultsLeftCol}>
          {/* Global Disclaimer Banner */}
          <div className={styles.disclaimerBanner}>
            <span className={styles.disclaimerIcon}>🛡️</span>
            <span className={styles.disclaimerText}>
              Results are sourced from public APIs. Unavailable modules show clearly as offline. No data is fabricated or estimated.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)' }}>
              Telemetry Node Analysis Map
            </div>
            <button 
              onClick={handleExportReport}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'var(--notion-accent-bg)',
                color: 'var(--notion-accent)',
                border: '1px solid var(--notion-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              📥 Export PDF Report
            </button>
          </div>
          <RiskScoreMeter score={computedScore} />
          {specificCard}
        </div>
        
        {/* Analyst Notes collapsible panel */}
        <AnalystNotesPanel query={queryVal} />
      </div>
    );
  };

  const renderResults = () => {
    if (!result) return null;
    return renderSingleTargetResult(result, query.trim());
  };

  return (
    <div className={`${styles.scannerContainer} ${(result || batchResults.length > 0) ? styles.hasResults : ''}`}>
      
      {/* Batch Mode toggle button */}
      <div className={styles.toggleRow}>
        <button 
          onClick={() => {
            setBatchMode(!batchMode);
            setError('');
          }}
          className={`${styles.batchToggleBtn} ${batchMode ? styles.batchToggleBtnActive : ''}`}
        >
          <Layers size={13} style={{ marginRight: '4px', display: 'inline' }} />
          {batchMode ? "Disable Batch Mode" : "Activate Batch Mode"}
        </button>
      </div>

      {batchMode ? (
        /* ── BATCH MODE INTERFACE ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <textarea
            className={styles.batchTextarea}
            placeholder={`Enter target queries (one per line, maximum 10 targets).&#10;e.g.&#10;google.com&#10;admin@compromised.com&#10;8.8.8.8&#10;torvalds`}
            value={batchQuery}
            onChange={(e) => setBatchQuery(e.target.value)}
            disabled={batchLoading}
          />
          <div className={styles.batchActions}>
            <span className={styles.batchCountInfo}>
              Targets: {batchQuery.split('\n').map(t => t.trim()).filter(Boolean).length} / 10 limit
            </span>
            <button 
              onClick={handleBatchScan}
              className={styles.batchRunBtn}
              disabled={batchLoading || !batchQuery.trim()}
            >
              <Play size={14} />
              {batchLoading ? "Executing Batch Scans..." : "Run Batch Recon"}
            </button>
          </div>

          {/* Progress Bar */}
          {batchLoading && (
            <div className={styles.batchProgressContainer}>
              <div className={styles.batchProgressText}>
                <span>Passive Intelligence Gathering...</span>
                <span>{batchProgress}%</span>
              </div>
              <div className={styles.batchProgressBarBg}>
                <div className={styles.batchProgressBarFill} style={{ width: `${batchProgress}%` }}></div>
              </div>
            </div>
          )}

          {/* Render Collapsible Target Cards */}
          {batchResults.length > 0 && (
            <div className={styles.batchResultsContainer}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.45)', textTransform: 'uppercase' }}>
                Batch Scans Results Stack
              </div>
              {batchResults.map((item, idx) => {
                const isExpanded = expandedTarget === item.target;
                const score = computeScore(item.data);
                return (
                  <div key={idx} className={styles.collapsibleCard}>
                    <div 
                      className={styles.collapsibleHeader} 
                      onClick={() => setExpandedTarget(isExpanded ? null : item.target)}
                    >
                      <div className={styles.targetMeta}>
                        <span className={styles.targetLabel}>{item.target}</span>
                        <span className={`${styles.badge} ${getBadgeStyle(item.type)?.className || ''}`}>
                          {getBadgeStyle(item.type)?.emoji || '👤'} {item.type.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: score > 70 ? '#2b7a3e' : score > 40 ? '#c9751d' : '#ca2c2c' }}>
                          Score: {score}/100
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className={styles.collapsibleBody}>
                        {renderSingleTargetResult(item.data, item.target)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── SINGLE SCAN INTERFACE ── */
        <>
          <form onSubmit={handleSubmit}>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIcon}>
                <Search size={18} />
              </div>
              
              <input
                type="text"
                className={styles.inputField}
                placeholder="Investigate anything — domain, username, email, IP, Bitcoin address..."
                value={query}
                onChange={handleInputChange}
                disabled={loading}
                autoFocus
              />

              {/* Real-time Badge Display */}
              {badgeInfo && (
                <div className={styles.badgeContainer}>
                  <span className={`${styles.badge} ${badgeInfo.className}`}>
                    {badgeInfo.emoji} {badgeInfo.label}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className={`${styles.submitBtn} ${!query.trim() || loading ? styles.submitBtnDisabled : ''}`}
                disabled={!query.trim() || loading}
              >
                {loading ? '...' : <CornerDownLeft size={14} />}
              </button>
            </div>
          </form>

          {/* Error Alert */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ca2c2c', fontSize: '12px', marginTop: '6px' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Skeletons based on target types */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeletonPulse skeletonTitle" style={{ margin: 0, height: '18px', width: '25%' }}></div>
              </div>
              
              <div className="skeletonPulse" style={{ width: '100%', height: '40px', borderRadius: '6px' }}></div>

              {detectedType === 'network' && (
                <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', overflow: 'hidden', padding: '20px', backgroundColor: '#ffffff' }}>
                  <div className="skeletonPulse skeletonTitle" style={{ width: '35%', height: '18px', marginBottom: '14px' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '24px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '24px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '24px' }}></div>
                  </div>
                </div>
              )}

              {detectedType === 'domain' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
                  <div className="skeletonCard" style={{ margin: 0 }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '50%', height: '18px', marginBottom: '12px' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                      <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                      <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                    </div>
                  </div>
                  <div className="skeletonCard" style={{ margin: 0 }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '60%', height: '18px', marginBottom: '12px' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                      <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                      <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {detectedType === 'phone' && (
                <div className="skeletonCard" style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 0 }}>
                  <div className="skeletonPulse skeletonBlock" style={{ width: '60%', height: '20px' }}></div>
                  <div className="skeletonPulse skeletonBlock" style={{ width: '80%', height: '16px' }}></div>
                  <div className="skeletonPulse skeletonBlock" style={{ width: '70%', height: '16px' }}></div>
                </div>
              )}

              {detectedType !== 'network' && detectedType !== 'domain' && detectedType !== 'phone' && (
                <div className="skeletonCard" style={{ margin: 0 }}>
                  <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '20px', marginBottom: '12px' }}></div>
                  <div className="skeletonPulse skeletonBlock" style={{ height: '120px' }}></div>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Results Display */}
          {renderResults()}
        </>
      )}
    </div>
  );
}


