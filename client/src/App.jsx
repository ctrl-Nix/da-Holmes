import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid, FileText, ShieldCheck, Mail, Globe, Camera,
  MapPin, Settings, HelpCircle, ChevronLeft, ChevronRight, Menu,
  Search, ArrowRight, Upload, Play, CheckCircle2, AlertTriangle, Info,
  Sparkles, ExternalLink, Calendar, User, Database, Shield, Copy, ArrowUpDown, Key
} from 'lucide-react';

import layoutStyles from './Layout.module.css';
import dashStyles from './Dashboard.module.css';
import modStyles from './Modules.module.css';
import repStyles from './Reports.module.css';
import UnifiedScanner from './components/UnifiedScanner';
import GodModeScanner from './components/GodModeScanner';
import ContinuousMonitor from './components/ContinuousMonitor';
import WorkspaceDashboard from './components/WorkspaceDashboard';
import MaltegoGraph from './components/MaltegoGraph';
import SocialScanner from './components/SocialScanner';
import EmailHeaderIntel from './components/EmailHeaderIntel';
import DorkBuilder from './components/DorkBuilder';
import PhoneIntel from './components/PhoneIntel';
import IotScanner from './components/IotScanner';
import DarkWebIntel from './components/DarkWebIntel';
import MetadataExtractor from './components/MetadataExtractor';
import CorporateIntel from './components/CorporateIntel';
import RedditAnalyzer from './components/RedditAnalyzer';
import ImageOsint from './components/ImageOsint';
import VehicleRecon from './components/VehicleRecon';
import AviationIntel from './components/AviationIntel';
import HashAnalyzer from './components/HashAnalyzer';
import MacDecoder from './components/MacDecoder';
import ForceGraph2D from 'react-force-graph-2d';
import AnalystNotesPanel from './components/AnalystNotesPanel';
import { getTagColor } from './utils/tagColors';
import ApiKeysPanel from './components/ApiKeysPanel';

import HolmesLogo from './components/HolmesLogo';

import WebScraper from './components/WebScraper';
import LocalMLIntel from './components/LocalMLIntel';
import SubdomainBrute from './components/SubdomainBrute';
import GitHubScanner from './components/GitHubScanner';
import BreachCrawler from './components/BreachCrawler';

import SpoofingPage from './pages/SpoofingPage';
import ExifPage from './pages/ExifPage';
import EmailHeadersPage from './pages/EmailHeadersPage';
import DomainPage from './pages/DomainPage';
import GeointPage from './pages/GeointPage';
import CryptoPage from './pages/CryptoPage';
import FriendshipPage from './pages/FriendshipPage';
import NotesPage from './pages/NotesPage';
import ReportsPage from './pages/ReportsPage';


const API_BASE = import.meta.env.VITE_API_URL || '';

const getTechIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('wordpress')) return '';
  if (lower.includes('next.js') || lower.includes('nextjs')) return '';
  if (lower.includes('react')) return '';
  if (lower.includes('shopify')) return '';
  if (lower.includes('google analytics') || lower.includes('gtag')) return '';
  if (lower.includes('nginx') || lower.includes('apache')) return '';
  return '';
};


function ThreatTicker({ feed, loading }) {
  const safeFeed = Array.isArray(feed) ? feed : (feed && feed.feed ? feed.feed : []);
  if (!safeFeed || safeFeed.length === 0) return null;

  // Duplicate feed to make the infinite scroll smooth
  const doubleFeed = [...safeFeed, ...safeFeed];

  return (
    <div style={{
      margin: '0 0 20px 0',
      padding: '8px 16px',
      backgroundColor: 'var(--notion-sidebar)',
      border: '1px solid var(--notion-border)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
      height: '42px',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
    }} className="ticker-container animate-fade-in">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticker-scroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          gap: 16px;
          animation: ticker-scroll 35s linear infinite;
          width: max-content;
          will-change: transform;
        }
        .ticker-container:hover .ticker-track {
          animation-play-state: paused;
        }
      `}} />

      {/* Ticker Side Header Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'var(--notion-bg)',
        borderRight: '1px solid var(--notion-border)',
        paddingRight: '12px',
        marginRight: '12px',
        zIndex: 10,
        height: '100%',
        fontWeight: 700,
        fontSize: '11px',
        color: 'var(--notion-fg)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        flexShrink: 0
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#ca2c2c',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'pulse 1.5s infinite'
        }}></span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.6; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.6; }
          }
        `}} />
        Threat Feed
      </div>

      {/* Sliding track wrapper */}
      <div style={{ overflow: 'hidden', flexGrow: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
        <div className="ticker-track">
          {doubleFeed.map((item, idx) => {
            const isMalware = item.type === 'malware_url' || item.type === 'botnet_ip';
            // red background for malware, orange for phishing
            const bg = isMalware ? '#ca2c2c' : '#c9751d';
            const typeLabel = item.type === 'botnet_ip' ? 'BOTNET IP' : (item.type === 'malware_url' ? 'MALWARE' : 'PHISHING');
            const icon = item.type === 'botnet_ip' ? '' : (item.type === 'malware_url' ? '' : '');
            
            return (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: bg,
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <span>{icon}</span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  textTransform: 'uppercase'
                }}>{typeLabel}</span>
                <span style={{ 
                  fontWeight: 400, 
                  fontFamily: 'monospace',
                  letterSpacing: '-0.02em',
                  opacity: 0.95
                }}>{item.indicator}</span>
                <span style={{ 
                  fontSize: '10px', 
                  opacity: 0.6,
                  fontWeight: 500,
                  fontStyle: 'italic'
                }}>via {item.source}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const mapHistoryToReports = (historyArray) => {
  if (!Array.isArray(historyArray)) return [];
  return historyArray.map((item, index) => {
    const query = item.query || '';
    const type = item.type || 'username';
    const score = item.riskScore !== undefined ? item.riskScore : 100;
    
    let emoji = '🕵️';
    if (type === 'domain') emoji = '';
    else if (type === 'username') emoji = '';
    else if (type === 'btc') emoji = '';
    else if (type === 'network') emoji = '';
    else if (type === 'email') emoji = '';
    else if (type === 'phone') emoji = '';

    let title = `Intelligence Target Audit (${query})`;
    if (type === 'domain') title = `Corporate Security Audit (${query})`;
    else if (type === 'username') title = `Subject Profile Brief (${query})`;
    else if (type === 'btc') title = `High-Value Asset Tracing (${query})`;
    else if (type === 'network') title = `IP Fingerprint & Route (${query})`;
    else if (type === 'email') title = `Data Breach Intelligence (${query})`;
    else if (type === 'phone') title = `Telephony Node Intelligence (${query})`;

    let typeLabel = 'Target Audit';
    if (type === 'domain') typeLabel = 'Domain Audit';
    else if (type === 'username') typeLabel = 'Username Footprint';
    else if (type === 'btc') typeLabel = 'Blockchain Intel';
    else if (type === 'network') typeLabel = 'Network Node Audit';
    else if (type === 'email') typeLabel = 'Email Threat Recon';
    else if (type === 'phone') typeLabel = 'Telephony Node Recon';

    let risk = 'SECURE';
    if (score <= 33) risk = 'CRITICAL';
    else if (score <= 66) risk = 'VULNERABLE';

    let dateStr = '2026-05-22';
    try {
      const ts = item.timestamp || item.date;
      if (ts) {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      }
    } catch (e) {}

    return {
      id: `rep-${index}-${item.timestamp || index}`,
      emoji,
      title,
      date: dateStr,
      target: query,
      type: typeLabel,
      author: 'Agent Holmes',
      risk,
      score
    };
  });
};
const saveToBackendHistory = async (target, type, results) => {
  try {
    await fetch(`${API_BASE}/api/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${type.toUpperCase()} scan - ${target}`,
        targets: [target],
        notes: JSON.stringify(results).slice(0, 2000)
      })
    });
  } catch (err) {
    console.warn('Backend history sync failed (non-critical):', err);
  }
};

export default function App() {
  const getInitialReports = () => {
    try {
      const saved = localStorage.getItem('holmes-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mapHistoryToReports(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load initial reports:', err);
    }
    return [
      { id: 'rep-mock-1', emoji: '', title: 'Corporate Security Audit (kiit.ac.in)', date: '2026-05-17', target: 'kiit.ac.in', type: 'Domain Audit', author: 'Agent Holmes', risk: 'VULNERABLE', score: 65 },
      { id: 'rep-mock-2', emoji: '', title: 'Subject Profile Brief (torvalds)', date: '2026-05-16', target: 'torvalds', type: 'Username Footprint', author: 'Agent Holmes', risk: 'SECURE', score: 92 },
      { id: 'rep-mock-3', emoji: '', title: 'High-Value Asset Tracing (1A1zP1eP...)', date: '2026-05-15', target: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', type: 'Blockchain Intel', author: 'System Sentinel', risk: 'CRITICAL', score: 20 },
    ];
  };

  const [reports, setReports] = useState(getInitialReports);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [bannerStatus, setBannerStatus] = useState('waking');

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const startTime = Date.now();
    let interval;

    const checkServer = () => {
      fetch(`${apiUrl}/health`)
        .then(res => {
          if (res.ok) {
            setBannerStatus('hidden');
            clearInterval(interval);
          } else {
            if (Date.now() - startTime > 30000) {
              setBannerStatus('unavailable');
              clearInterval(interval);
            }
          }
        })
        .catch(() => {
          if (Date.now() - startTime > 30000) {
            setBannerStatus('unavailable');
            clearInterval(interval);
          }
        });
    };

    checkServer();
    interval = setInterval(checkServer, 3000);

    return () => clearInterval(interval);
  }, []);
  const [activeView, setActiveView] = useState('dashboard'); // dashboard | reports | unified | spoofing | exif | domain | geoint
  const [activeReportId, setActiveReportId] = useState(null);

  const [threatFeed, setThreatFeed] = useState([]);
  const [threatLoading, setThreatLoading] = useState(false);

  // ── Traceroute Visualizer State & Handler ──
  const [traceHost, setTraceHost] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceHops, setTraceHops] = useState(null);
  const [traceError, setTraceError] = useState('');

  const fetchThreatFeed = async () => {
    setThreatLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/threatintel/feed`);
      if (response.ok) {
        const data = await response.json();
        setThreatFeed(data);
      }
    } catch (err) {
      console.error('Failed to fetch threat feed:', err);
    } finally {
      setThreatLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatFeed();
    const interval = setInterval(fetchThreatFeed, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, []);

  const runTraceroute = async (e) => {
    if (e) e.preventDefault();
    const cleanHost = traceHost.trim();
    if (!cleanHost) return;

    setTraceLoading(true);
    setTraceHops(null);
    setTraceError('');

    try {
      const res = await fetch(`${API_BASE}/api/network/traceroute?host=${encodeURIComponent(cleanHost)}`);
      if (res.ok) {
        const data = await res.json();
        setTraceHops(data);
        
        // Save scan to history
        try {
          const history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
          const updated = [
            { query: cleanHost, type: 'network', timestamp: Date.now(), riskScore: 100 },
            ...history.filter(item => item.query !== cleanHost)
          ].slice(0, 50);
          localStorage.setItem('holmes-history', JSON.stringify(updated));
          if (typeof updateNotesCount === 'function') updateNotesCount();
          window.dispatchEvent(new CustomEvent('holmes-history-updated'));
        } catch (hErr) {
          console.error('Failed to log traceroute history:', hErr);
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Traceroute path audit failed');
      }
    } catch (err) {
      setTraceError(err.message || 'Failed to establish connection to path audit servers.');
    } finally {
      setTraceLoading(false);
    }
  };

  // Dark Mode Theme State
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('holmes-theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('holmes-theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('holmes-theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleExportPdfReport = async (targetQuery, payloadData) => {
    try {
      const response = await fetch(`${API_BASE}/api/generate?query=${encodeURIComponent(targetQuery)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadData || {})
      });
      
      if (!response.ok) throw new Error('Failed to generate report PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `holmes_report_${targetQuery}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export PDF Report: ' + err.message);
    }
  };

  // Investigation History state & handlers
  const [historyList, setHistoryList] = useState([]);
  const [notesCount, setNotesCount] = useState(0);

  const updateNotesCount = () => {
    try {
      const savedNotes = JSON.parse(localStorage.getItem('holmes-notes') || '{}');
      const count = Object.values(savedNotes).filter(note => note && note.trim()).length;
      setNotesCount(count);
    } catch (err) {
      console.error('Failed to update notes count:', err);
    }
  };

  const getNotesList = () => {
    try {
      const savedNotesObj = JSON.parse(localStorage.getItem('holmes-notes') || '{}');
      const savedTagsObj = JSON.parse(localStorage.getItem('holmes-tags') || '{}');
      const history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
      
      return Object.keys(savedNotesObj)
        .filter(queryKey => savedNotesObj[queryKey] && savedNotesObj[queryKey].trim())
        .map(queryKey => {
          const histItem = history.find(h => h.query === queryKey);
          let detectedType = histItem ? histItem.type : 'username';
          if (!histItem) {
            if (/^(1|3|bc1)/.test(queryKey)) detectedType = 'btc';
            else if (queryKey.includes('@')) detectedType = 'email';
            else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(queryKey)) detectedType = 'network';
            else if (queryKey.includes('.')) detectedType = 'domain';
          }
          
          return {
            query: queryKey,
            type: detectedType,
            notes: savedNotesObj[queryKey],
            tags: savedTagsObj[queryKey] || []
          };
        });
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('holmes-history');
      if (saved) {
        setHistoryList(JSON.parse(saved));
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      console.error('Failed to load holmes history:', err);
    }
  };

  const updateReportsFromHistory = () => {
    try {
      const saved = localStorage.getItem('holmes-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            setReports([
              { id: 'rep-mock-1', emoji: '', title: 'Corporate Security Audit (kiit.ac.in)', date: '2026-05-17', target: 'kiit.ac.in', type: 'Domain Audit', author: 'Agent Holmes', risk: 'VULNERABLE', score: 65 },
              { id: 'rep-mock-2', emoji: '', title: 'Subject Profile Brief (torvalds)', date: '2026-05-16', target: 'torvalds', type: 'Username Footprint', author: 'Agent Holmes', risk: 'SECURE', score: 92 },
              { id: 'rep-mock-3', emoji: '', title: 'High-Value Asset Tracing (1A1zP1eP...)', date: '2026-05-15', target: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', type: 'Blockchain Intel', author: 'System Sentinel', risk: 'CRITICAL', score: 20 },
            ]);
          } else {
            setReports(mapHistoryToReports(parsed));
          }
        }
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Failed to update reports:', err);
    }
  };

  useEffect(() => {
    const seedFromBackend = async () => {
      if (localStorage.getItem('holmes-history')) return; // Already has local data
      try {
        const res = await fetch(`${API_BASE}/api/investigations?limit=50`);
        if (!res.ok) return;
        const investigations = await res.json();
        const mapped = investigations.map(inv => ({
          query: (inv.targets || [])[0] || inv.name || 'Unknown',
          type: 'unknown',
          timestamp: new Date(inv.created_at || Date.now()).getTime(),
          riskScore: 100
        }));
        if (mapped.length > 0) {
          localStorage.setItem('holmes-history', JSON.stringify(mapped));
        }
      } catch (err) { /* silently ignore */ }
    };

    seedFromBackend().then(() => {
      loadHistory();
      updateNotesCount();
      updateReportsFromHistory();
    });

    const handleHistoryUpdate = () => {
      loadHistory();
      updateNotesCount();
      updateReportsFromHistory();
      
      try {
        const history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
        if (history.length > 0) {
           const latest = history[0]; // Assuming newest is always first
           saveToBackendHistory(latest.query || latest.target, latest.type || 'unknown', { notes: 'Synced from UI' });
        }
      } catch (err) {
        console.warn('Auto-sync to backend failed:', err);
      }
    };
    window.addEventListener('holmes-history-updated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('holmes-history-updated', handleHistoryUpdate);
    };
  }, []);

  const handleHistoryClick = (queryVal, typeVal) => {
    setActiveView('unified');
    setUnifiedQuery('');
    setTimeout(() => {
      setUnifiedQuery(queryVal);
    }, 10);
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem('holmes-history');
      setHistoryList([]);
    } catch (err) {
      console.error(err);
    }
  };

  const getHistoryBadgeColor = (type) => {
    switch (String(type).toLowerCase()) {
      case 'domain':
        return { bg: 'rgba(35, 131, 226, 0.1)', fg: '#2383e2' }; // Blue
      case 'username':
        return { bg: 'rgba(155, 89, 182, 0.1)', fg: '#9b59b6' }; // Purple
      case 'ip':
      case 'network':
        return { bg: 'rgba(230, 126, 34, 0.1)', fg: '#e67e22' }; // Orange
      case 'email':
        return { bg: 'rgba(241, 196, 15, 0.15)', fg: '#d4ac0d' }; // Yellow
      case 'btc':
        return { bg: 'rgba(46, 204, 113, 0.1)', fg: '#2ecc71' }; // Green
      default:
        return { bg: 'rgba(127, 140, 141, 0.1)', fg: '#7f8c8d' }; // Gray
    }
  };

  // Silently fetch /health to wake up Render free tier backend on mount
  useEffect(() => {
    const wakeUpUrl = `${import.meta.env.VITE_API_URL}/health`;
    fetch(wakeUpUrl)
      .then(res => res.json())
      .catch(err => {
        // Silently catch error
      });
  }, []);

  // Unified Scanner State
  const [unifiedQuery, setUnifiedQuery] = useState('');
  const [unifiedType, setUnifiedType] = useState('unified');
  const [unifiedLoading, setUnifiedLoading] = useState(false);
  const [unifiedResults, setUnifiedResults] = useState(null);
  const [unifiedLogs, setUnifiedLogs] = useState([]);

  // Reverse IP State
  const [reverseIpVal, setReverseIpVal] = useState('');
  const [reverseIpLoading, setReverseIpLoading] = useState(false);
  const [reverseIpResults, setReverseIpResults] = useState(null);
  const [reverseIpError, setReverseIpError] = useState('');

  // IoT Scanner State
  const [iotTarget, setIotTarget] = useState('');
  const [iotLoading, setIotLoading] = useState(false);
  const [iotResults, setIotResults] = useState(null);
  const [iotError, setIotError] = useState('');

  const runIotScan = async (e) => {
    if (e) e.preventDefault();
    const cleanIp = iotTarget.trim();
    if (!cleanIp) return;

    setIotLoading(true);
    setIotResults(null);
    setIotError('');

    try {
      const res = await fetch(`${API_BASE}/api/iot/scan?ip=${encodeURIComponent(cleanIp)}`);
      if (res.ok) {
        const data = await res.json();
        setIotResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'IoT scan failed');
      }
    } catch (err) {
      setIotError(err.message || 'Failed to connect to IoT intelligence servers.');
    } finally {
      setIotLoading(false);
    }
  };

  // Dark Web Scanner State
  const [dwTarget, setDwTarget] = useState('');
  const [dwLoading, setDwLoading] = useState(false);
  const [dwResults, setDwResults] = useState(null);
  const [dwError, setDwError] = useState('');

  const runDwScan = async (e) => {
    if (e) e.preventDefault();
    const q = dwTarget.trim();
    if (!q) return;

    setDwLoading(true);
    setDwResults(null);
    setDwError('');

    try {
      const res = await fetch(`${API_BASE}/api/darkweb/scan?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setDwResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Dark Web scan failed');
      }
    } catch (err) {
      setDwError(err.message || 'Failed to connect to Dark Web intelligence servers.');
    } finally {
      setDwLoading(false);
    }
  };

  // Metadata Extractor State
  const [metaFile, setMetaFile] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaResults, setMetaResults] = useState(null);
  const [metaError, setMetaError] = useState('');

  const runMetaScan = async (e) => {
    if (e) e.preventDefault();
    if (!metaFile) return;

    setMetaLoading(true);
    setMetaResults(null);
    setMetaError('');

    const formData = new FormData();
    formData.append('file', metaFile);

    try {
      const res = await fetch(`${API_BASE}/api/metadata/extract`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setMetaResults(data);
      } else {
        const errData = await res.json();
        throw new Error(typeof errData.detail === 'object' ? JSON.stringify(errData.detail) : (errData.detail || 'Metadata extraction failed'));
      }
    } catch (err) {
      setMetaError(err.message || 'Failed to connect to Metadata extraction servers.');
    } finally {
      setMetaLoading(false);
    }
  };

  // Corporate Intel State
  const [corpTarget, setCorpTarget] = useState('');
  const [corpLoading, setCorpLoading] = useState(false);
  const [corpResults, setCorpResults] = useState(null);
  const [corpError, setCorpError] = useState('');

  const runCorpScan = async (e) => {
    if (e) e.preventDefault();
    const q = corpTarget.trim();
    if (!q) return;

    setCorpLoading(true);
    setCorpResults(null);
    setCorpError('');

    try {
      const res = await fetch(`${API_BASE}/api/corporate-intel/${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setCorpResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Corporate intelligence scan failed');
      }
    } catch (err) {
      setCorpError(err.message || 'Failed to connect to Corporate Intelligence servers.');
    } finally {
      setCorpLoading(false);
    }
  };

  // Reddit Analyzer State
  const [redditTarget, setRedditTarget] = useState('');
  const [redditLoading, setRedditLoading] = useState(false);
  const [redditResults, setRedditResults] = useState(null);
  const [redditError, setRedditError] = useState('');

  const runRedditScan = async (e) => {
    if (e) e.preventDefault();
    const q = redditTarget.trim();
    if (!q) return;

    setRedditLoading(true);
    setRedditResults(null);
    setRedditError('');

    try {
      const res = await fetch(`${API_BASE}/api/reddit/analyze/${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setRedditResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Reddit scan failed');
      }
    } catch (err) {
      setRedditError(err.message || 'Failed to connect to Reddit intelligence servers.');
    } finally {
      setRedditLoading(false);
    }
  };

  // Image OSINT State
  const [imageTarget, setImageTarget] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResults, setImageResults] = useState(null);
  const [imageError, setImageError] = useState('');

  const runImageScan = async (e) => {
    if (e) e.preventDefault();
    const q = imageTarget.trim();
    if (!q) return;

    setImageLoading(true);
    setImageResults(null);
    setImageError('');

    try {
      const res = await fetch(`${API_BASE}/api/image/generate?url=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setImageResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Image OSINT failed');
      }
    } catch (err) {
      setImageError(err.message || 'Failed to connect to Image Intelligence servers.');
    } finally {
      setImageLoading(false);
    }
  };

  // Vehicle Recon State
  const [vinTarget, setVinTarget] = useState('');
  const [vinLoading, setVinLoading] = useState(false);
  const [vinResults, setVinResults] = useState(null);
  const [vinError, setVinError] = useState('');

  const runVinScan = async (e) => {
    if (e) e.preventDefault();
    const q = vinTarget.trim();
    if (!q) return;

    setVinLoading(true);
    setVinResults(null);
    setVinError('');

    try {
      const res = await fetch(`${API_BASE}/api/vehicle/vin/${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setVinResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Vehicle VIN decoding failed');
      }
    } catch (err) {
      setVinError(err.message || 'Failed to connect to Vehicle Intelligence servers.');
    } finally {
      setVinLoading(false);
    }
  };

  // Aviation Tracker State
  const [aviationTarget, setAviationTarget] = useState('');
  const [aviationLoading, setAviationLoading] = useState(false);
  const [aviationResults, setAviationResults] = useState(null);
  const [aviationError, setAviationError] = useState('');

  const runAviationScan = async (e) => {
    if (e) e.preventDefault();
    const q = aviationTarget.trim();
    if (!q) return;

    setAviationLoading(true);
    setAviationResults(null);
    setAviationError('');

    try {
      const res = await fetch(`${API_BASE}/api/aviation/track?tail_number=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setAviationResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Aviation tracker failed');
      }
    } catch (err) {
      setAviationError(err.message || 'Failed to connect to Aviation Intelligence servers.');
    } finally {
      setAviationLoading(false);
    }
  };

  // Hash Analyzer State
  const [hashTarget, setHashTarget] = useState('');
  const [hashLoading, setHashLoading] = useState(false);
  const [hashResults, setHashResults] = useState(null);
  const [hashError, setHashError] = useState('');

  const runHashScan = async (e) => {
    if (e) e.preventDefault();
    const q = hashTarget.trim();
    if (!q) return;

    setHashLoading(true);
    setHashResults(null);
    setHashError('');

    try {
      const res = await fetch(`${API_BASE}/api/hash/analyze?hash_value=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setHashResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Hash analysis failed');
      }
    } catch (err) {
      setHashError(err.message || 'Failed to connect to Cryptography Intelligence servers.');
    } finally {
      setHashLoading(false);
    }
  };

  // MAC Decoder State
  const [macTarget, setMacTarget] = useState('');
  const [macLoading, setMacLoading] = useState(false);
  const [macResults, setMacResults] = useState(null);
  const [macError, setMacError] = useState('');

  const runMacScan = async (e) => {
    if (e) e.preventDefault();
    const q = macTarget.trim();
    if (!q) return;

    setMacLoading(true);
    setMacResults(null);
    setMacError('');

    try {
      const res = await fetch(`${API_BASE}/api/mac/decode?mac=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setMacResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'MAC address decode failed');
      }
    } catch (err) {
      setMacError(err.message || 'Failed to connect to Network Intelligence servers.');
    } finally {
      setMacLoading(false);
    }
  };

  // Phone OSINT State
  const [phoneTarget, setPhoneTarget] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneResults, setPhoneResults] = useState(null);
  const [phoneError, setPhoneError] = useState('');

  const runPhoneScan = async (e) => {
    if (e) e.preventDefault();
    const cleanNum = phoneTarget.replace(/[\s\-()\[\]\+]/g, '');
    if (!cleanNum) return;

    setPhoneLoading(true);
    setPhoneResults(null);
    setPhoneError('');

    try {
      const res = await fetch(`${API_BASE}/api/phone?number=${encodeURIComponent(cleanNum)}`);
      if (res.ok) {
        const data = await res.json();
        setPhoneResults(data);
        
        // Save history
        try {
          const history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
          const updated = [
            { query: cleanNum, type: 'phone', timestamp: Date.now(), riskScore: data.risk_level === 'HIGH_RISK' ? 20 : 100 },
            ...history.filter(item => item.query !== cleanNum)
          ].slice(0, 50);
          localStorage.setItem('holmes-history', JSON.stringify(updated));
          if (typeof updateNotesCount === 'function') updateNotesCount();
          window.dispatchEvent(new CustomEvent('holmes-history-updated'));
        } catch (hErr) {
          console.error('Failed to log phone history:', hErr);
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Phone scan failed');
      }
    } catch (err) {
      setPhoneError(err.message || 'Failed to connect to phone intelligence servers.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // DNS History State
  const [dnsDomain, setDnsDomain] = useState('');
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsResults, setDnsResults] = useState(null);
  const [dnsError, setDnsError] = useState('');

  // Simulated Database Reports
  // Collapsible toggle
  const toggleSidebar = () => setSidebarExpanded(!sidebarExpanded);

  // View Switching Helpers
  const openReport = (id) => {
    setActiveReportId(id);
    setActiveView('reports');
  };

  // ── Unified Search Handlers ──
  const runUnifiedScan = async (e) => {
    e.preventDefault();
    if (!unifiedQuery.trim()) return;
    setUnifiedLoading(true);
    setUnifiedResults(null);
    setUnifiedLogs(['Initializing scanners...', 'Detecting query category...']);

    // Log updates
    const addLog = (log, ms) => new Promise(res => setTimeout(() => {
      setUnifiedLogs(prev => [...prev, log]);
      res();
    }, ms));

    try {
      // Step 1: Detect type and execute
      let targetType = 'username';
      const q = unifiedQuery.trim();
      if (q.match(/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/)) targetType = 'btc';
      else if (q.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)) targetType = 'email';
      else if (q.match(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/)) targetType = 'network';
      else if (q.match(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i)) targetType = 'domain';
      else if (q.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) targetType = 'bssid';

      await addLog(`Target category detected: [${targetType.toUpperCase()}]`, 600);

      // Make actual fetch to backend
      const res = await fetch(`${API_BASE}/api/unified/scan?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        await addLog('Resolving intelligence databases...', 500);
        await addLog('Compiling telemetry briefs...', 400);
        setUnifiedResults(data);

        // Save scan to history
        try {
          const history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
          const cleanQuery = q.trim();
          if (cleanQuery) {
            let score = 100;
            if (data) {
              const spoofing = data.spoofing || {};
              if (spoofing.spf_vulnerable === true) score -= 20;
              if (spoofing.dmarc_vulnerable === true) score -= 20;

              const subdomainsCount = data.subdomain_count || data.subdomains?.length || 0;
              if (subdomainsCount > 5) {
                score -= (subdomainsCount - 5) * 10;
              }

              const socialsList = data.social?.platforms || data.platforms || [];
              const foundSocialCount = socialsList.filter(p => p.status === 'found').length;
              score -= foundSocialCount * 15;
              score = Math.max(0, Math.min(100, score));
            }

            const updated = [
              { query: cleanQuery, type: targetType, timestamp: Date.now(), riskScore: score },
              ...history.filter(item => item.query !== cleanQuery)
            ].slice(0, 50);

            localStorage.setItem('holmes-history', JSON.stringify(updated));
            if (typeof updateNotesCount === 'function') updateNotesCount();
            window.dispatchEvent(new CustomEvent('holmes-history-updated'));
          }
        } catch (hErr) {
          console.error('Failed to log unified scan history:', hErr);
        }
      } else {
        throw new Error('Backend failed');
      }
    } catch (err) {
      // Elegant simulated fallback
      await addLog('Warning: API connection timed out. Activating simulated fallback...', 600);
      await addLog('Resolving cached public repositories...', 500);
      await addLog('Formatting structured intelligence brief...', 400);
      
      const q = unifiedQuery.trim();
      let mockType = 'username';
      if (q.match(/^(1|3|bc1)/)) mockType = 'btc';
      else if (q.includes('@')) mockType = 'email';
      else if (q.includes('.')) mockType = 'domain';

      const mockData = {
        query: q,
        type: mockType,
        timestamp: new Date().toISOString(),
        data: {}
      };

      if (mockType === 'username') {
        mockData.data = {
          social: {
            score: 75,
            level: 'SECURE',
            platforms: [
              { platform: 'GitHub', url: `https://github.com/${q}`, status: 'found' },
              { platform: 'Twitter', url: `https://twitter.com/${q}`, status: 'found' },
              { platform: 'Reddit', url: `https://reddit.com/user/${q}`, status: 'found' },
              { platform: 'Instagram', url: `https://instagram.com/${q}`, status: 'not_found' },
            ]
          },
          leaks: [
            { source: 'Pastebin', match: 'Found matching reference in developer credential leak (2024).' }
          ]
        };
      } else if (mockType === 'domain') {
        mockData.data = {
          subdomain_count: 4,
          subdomains: [`admin.${q}`, `vpn.${q}`, `mail.${q}`, `dev.${q}`],
          technologies: [
            { type: 'Server', name: 'Nginx' },
            { type: 'CMS', name: 'WordPress' },
            { type: 'Library', name: 'React' }
          ]
        };
      } else {
        mockData.data = {
          balance_btc: 0.1245,
          tx_count: 5,
          explorer_url: `https://blockchain.info/rawaddr/${q}`,
          message: 'Wallet tracking details loaded successfully.'
        };
      }

      setUnifiedResults(mockData);

      // Save scan to history (fallback)
      try {
        const history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
        const cleanQuery = q.trim();
        if (cleanQuery) {
          let score = 100;
          if (mockData) {
            const spoofing = mockData.spoofing || {};
            if (spoofing.spf_vulnerable === true) score -= 20;
            if (spoofing.dmarc_vulnerable === true) score -= 20;

            const subdomainsCount = mockData.subdomain_count || mockData.subdomains?.length || 0;
            if (subdomainsCount > 5) {
              score -= (subdomainsCount - 5) * 10;
            }

            const socialsList = mockData.social?.platforms || mockData.platforms || [];
            const foundSocialCount = socialsList.filter(p => p.status === 'found').length;
            score -= foundSocialCount * 15;
            score = Math.max(0, Math.min(100, score));
          }

          const updated = [
            { query: cleanQuery, type: mockType, timestamp: Date.now(), riskScore: score },
            ...history.filter(item => item.query !== cleanQuery)
          ].slice(0, 50);

          localStorage.setItem('holmes-history', JSON.stringify(updated));
          if (typeof updateNotesCount === 'function') updateNotesCount();
          window.dispatchEvent(new CustomEvent('holmes-history-updated'));
        }
      } catch (hErr) {
        console.error('Failed to log unified scan history (fallback):', hErr);
      }
    } finally {
      setUnifiedLoading(false);
    }
  };



  // ── Reverse IP Handler ──
  const runReverseIpLookup = async (e) => {
    if (e) e.preventDefault();
    if (!reverseIpVal.trim()) return;

    setReverseIpLoading(true);
    setReverseIpResults(null);
    setReverseIpError('');

    try {
      const res = await fetch(`${API_BASE}/api/reverseip/v2?ip=${encodeURIComponent(reverseIpVal.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setReverseIpResults(data);
      } else {
        const errData = await res.json();
        throw new Error(typeof errData.detail === 'object' ? JSON.stringify(errData.detail) : (errData.detail || 'Reverse IP lookup failed'));
      }
    } catch (err) {
      setReverseIpError(err.message || 'Failed to connect to Reverse IP API.');
    } finally {
      setReverseIpLoading(false);
    }
  };

  // ── DNS History Handler ──
  const runDnsHistoryLookup = async (e) => {
    if (e) e.preventDefault();
    if (!dnsDomain.trim()) return;

    setDnsLoading(true);
    setDnsResults(null);
    setDnsError('');

    try {
      const res = await fetch(`${API_BASE}/api/dns/history?domain=${encodeURIComponent(dnsDomain.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setDnsResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'DNS history lookup failed');
      }
    } catch (err) {
      setDnsError(err.message || 'Failed to connect to DNS History API.');
    } finally {
      setDnsLoading(false);
    }
  };

  // ── Leaflet Map Sync Effect ──
  useEffect(() => {
    let lat = null;
    let lon = null;
    let popupContent = '';

    if (geointTab === 'coords' && geoResults) {
      lat = geoResults.coordinates.lat;
      lon = geoResults.coordinates.lon;
      popupContent = `
        <div style="font-family: Inter, sans-serif; font-size: 12px; color: #37352f;">
          <strong style="color: var(--notion-accent);"> Coordinates Audited</strong><br/>
          <span style="font-size: 11px; color: rgba(55, 53, 47, 0.7);">${geoResults.address}</span>
        </div>
      `;
    } else if (geointTab === 'bssid' && bssidResults) {
      lat = bssidResults.lat;
      lon = bssidResults.lon;
      popupContent = `
        <div style="font-family: Inter, sans-serif; font-size: 12px; color: #37352f;">
          <strong style="color: #2b7a3e;"> SSID: ${bssidResults.ssid}</strong><br/>
          <span style="font-size: 11px; font-weight: 500;">BSSID Geolocation Resolved</span><br/>
          <span style="font-size: 10.5px; color: rgba(55, 53, 47, 0.7);">${bssidResults.address}</span>
        </div>
      `;
    }

    if (lat !== null && lon !== null && window.L) {
      const timer = setTimeout(() => {
        const mapContainer = document.getElementById('geoint-map');
        if (!mapContainer) return;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = window.L.map('geoint-map').setView([lat, lon], 15);
        mapRef.current = map;

        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        const marker = window.L.marker([lat, lon]).addTo(map);
        marker.bindPopup(popupContent).openPopup();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [geoResults, bssidResults, geointTab]);

  return (
    <div className={layoutStyles.appContainer}>
      {/* Wakeup Banner */}

      {bannerStatus !== 'hidden' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '36px',
          backgroundColor: bannerStatus === 'unavailable' ? '#ca2c2c' : '#fbbf24',
          color: bannerStatus === 'unavailable' ? '#ffffff' : '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
        }}>
          {bannerStatus === 'unavailable' ? 'Server unavailable' : ' Server waking up, please wait...'}
        </div>
      )}
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarExpanded && (
        <div 
          className={layoutStyles.mobileSidebarBackdrop}
          onClick={() => setSidebarExpanded(false)}
        />
      )}

      {/* ── COLLAPSIBLE SIDEBAR ── */}
      <aside className={`${layoutStyles.sidebar} ${sidebarExpanded ? layoutStyles.sidebarExpanded : layoutStyles.sidebarCollapsed}`}>
        
        {/* Toggle Button */}
        <button onClick={toggleSidebar} className={layoutStyles.sidebarToggleBtn} title={sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}>
          {sidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Logo */}
        <div className={layoutStyles.sidebarHeader} style={{ gap: '6px', fontSize: '15px' }}>
          <HolmesLogo />
        </div>

        {/* Nav Items */}
        <nav className={layoutStyles.navSection}>
          <div className={layoutStyles.sectionTitle}>Workspace</div>
          <div 
            onClick={() => setActiveView('dashboard')} 
            className={`${layoutStyles.navItem} ${activeView === 'dashboard' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><LayoutGrid size={16} /></div>
            <span className={layoutStyles.navItemLabel}>Dashboard</span>
          </div>
          <div 
            onClick={() => { setActiveView('apiKeys'); if (window.innerWidth <= 768) setSidebarExpanded(false); }}
            className={`${layoutStyles.navItem} ${activeView === 'apiKeys' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><Key size={16} /></div>
            <span className={layoutStyles.navItemLabel}>API Keys (BYOK)</span>
          </div>
          <div 
            onClick={() => openReport('rep-01')} 
            className={`${layoutStyles.navItem} ${activeView === 'reports' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><FileText size={16} /></div>
            <span className={layoutStyles.navItemLabel}>Reports</span>
          </div>
          <div 
            onClick={() => setActiveView('notes')} 
            className={`${layoutStyles.navItem} ${activeView === 'notes' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Analyst Notes</span>
            {sidebarExpanded && notesCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                backgroundColor: 'var(--notion-accent)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '18px',
                height: '18px',
              }}>
                {notesCount}
              </span>
            )}
          </div>

          <div className={layoutStyles.sectionTitle}>OSINT Modules</div>
          
          <div 
            onClick={() => setActiveView('unified')} 
            className={`${layoutStyles.navItem} ${activeView === 'unified' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><Sparkles size={16} /></div>
            <span className={layoutStyles.navItemLabel}>Unified Scanner</span>
          </div>

          <div 
            onClick={() => setActiveView('maltego')} 
            className={`${layoutStyles.navItem} ${activeView === 'maltego' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Maltego Int Graph</span>
          </div>

          <div 
            onClick={() => setActiveView('socialStream')} 
            className={`${layoutStyles.navItem} ${activeView === 'socialStream' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><User size={16} /></div>
            <span className={layoutStyles.navItemLabel}>SSE Profile Stream</span>
          </div>

          <div 
            onClick={() => setActiveView('spoofing')} 
            className={`${layoutStyles.navItem} ${activeView === 'spoofing' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><Mail size={16} /></div>
            <span className={layoutStyles.navItemLabel}>Email Spoofing</span>
          </div>

          <div 
            onClick={() => setActiveView('emailHeaders')} 
            className={`${layoutStyles.navItem} ${activeView === 'emailHeaders' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><FileText size={16} /></div>
            <span className={layoutStyles.navItemLabel}>Email Header Audit</span>
          </div>

          <div 
            onClick={() => setActiveView('phone')} 
            className={`${layoutStyles.navItem} ${activeView === 'phone' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Phone Intelligence</span>
          </div>

          <div 
            onClick={() => setActiveView('iot')} 
            className={`${layoutStyles.navItem} ${activeView === 'iot' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>IoT & Vuln Scanner</span>
          </div>

          <div 
            onClick={() => setActiveView('darkweb')} 
            className={`${layoutStyles.navItem} ${activeView === 'darkweb' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Dark Web Monitor</span>
          </div>

          <div 
            onClick={() => setActiveView('monitor')} 
            className={`${layoutStyles.navItem} ${activeView === 'monitor' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>24/7 Monitoring</span>
          </div>

          <div 
            onClick={() => setActiveView('metadata')} 
            className={`${layoutStyles.navItem} ${activeView === 'metadata' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Document Forensics</span>
          </div>

          <div 
            onClick={() => setActiveView('corporate')} 
            className={`${layoutStyles.navItem} ${activeView === 'corporate' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Corporate Intel</span>
          </div>

          <div 
            onClick={() => setActiveView('reddit')} 
            className={`${layoutStyles.navItem} ${activeView === 'reddit' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Reddit Analyzer</span>
          </div>

          <div 
            onClick={() => setActiveView('imageOsint')} 
            className={`${layoutStyles.navItem} ${activeView === 'imageOsint' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Reverse Image Pivot</span>
          </div>

          <div 
            onClick={() => setActiveView('vehicle')} 
            className={`${layoutStyles.navItem} ${activeView === 'vehicle' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Vehicle Recon</span>
          </div>

          <div 
            onClick={() => setActiveView('aviation')} 
            className={`${layoutStyles.navItem} ${activeView === 'aviation' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Aviation Tracker</span>
          </div>

          <div 
            onClick={() => setActiveView('hash')} 
            className={`${layoutStyles.navItem} ${activeView === 'hash' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Hash Analyzer</span>
          </div>

          <div 
            onClick={() => setActiveView('mac')} 
            className={`${layoutStyles.navItem} ${activeView === 'mac' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>MAC Decoder</span>
          </div>

          <div 
            onClick={() => setActiveView('dorkBuilder')} 
            className={`${layoutStyles.navItem} ${activeView === 'dorkBuilder' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🕵️</div>
            <span className={layoutStyles.navItemLabel}>Google Dork Builder</span>
          </div>

          <div 
            onClick={() => setActiveView('domain')} 
            className={`${layoutStyles.navItem} ${activeView === 'domain' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><Globe size={16} /></div>
            <span className={layoutStyles.navItemLabel}>Domain Audit</span>
          </div>

          <div 
            onClick={() => setActiveView('exif')} 
            className={`${layoutStyles.navItem} ${activeView === 'exif' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><Camera size={16} /></div>
            <span className={layoutStyles.navItemLabel}>EXIF Forensics</span>
          </div>

          <div 
            onClick={() => setActiveView('geoint')} 
            className={`${layoutStyles.navItem} ${activeView === 'geoint' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon}><MapPin size={16} /></div>
            <span className={layoutStyles.navItemLabel}>Geo-Intelligence</span>
          </div>

          <div 
            onClick={() => setActiveView('friendship')} 
            className={`${layoutStyles.navItem} ${activeView === 'friendship' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Relation Graph</span>
          </div>

          <div 
            onClick={() => setActiveView('ml')} 
            className={`${layoutStyles.navItem} ${activeView === 'ml' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Local ML Intel</span>
          </div>

          <div 
            onClick={() => setActiveView('webScraper')} 
            className={`${layoutStyles.navItem} ${activeView === 'webScraper' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Live Web Scraper</span>
          </div>

          <div 
            onClick={() => setActiveView('subdomainBrute')} 
            className={`${layoutStyles.navItem} ${activeView === 'subdomainBrute' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Subdomain Brute</span>
          </div>

          <div 
            onClick={() => setActiveView('githubScanner')} 
            className={`${layoutStyles.navItem} ${activeView === 'githubScanner' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>GitHub Scanner</span>
          </div>

          <div 
            onClick={() => setActiveView('breachCrawler')} 
            className={`${layoutStyles.navItem} ${activeView === 'breachCrawler' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Breach Crawler</span>
          </div>

          <div 
            onClick={() => setActiveView('crypto')} 
            className={`${layoutStyles.navItem} ${activeView === 'crypto' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Blockchain Tracker</span>
          </div>

          <div 
            onClick={() => setActiveView('reverseip')} 
            className={`${layoutStyles.navItem} ${activeView === 'reverseip' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Reverse IP Lookup</span>
          </div>

          <div 
            onClick={() => setActiveView('dnsHistory')} 
            className={`${layoutStyles.navItem} ${activeView === 'dnsHistory' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>DNS History</span>
          </div>

          <div 
            onClick={() => setActiveView('traceroute')} 
            className={`${layoutStyles.navItem} ${activeView === 'traceroute' ? layoutStyles.navItemActive : ''}`}
          >
            <div className={layoutStyles.navItemIcon} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
            <span className={layoutStyles.navItemLabel}>Traceroute Map</span>
          </div>
        </nav>

        {/* Investigation History Section */}
        {sidebarExpanded && (
          <div className={layoutStyles.historySection}>
            <div className={layoutStyles.sectionTitle}>
              <span>Investigation History</span>
            </div>
            <div className={layoutStyles.historyList}>
              {historyList.map((item, idx) => {
                const getRelativeTime = (ts) => {
                  if (!ts) return '';
                  const diff = Date.now() - ts;
                  const m = Math.floor(diff / 60000);
                  const h = Math.floor(m / 60);
                  const d = Math.floor(h / 24);
                  if (d > 0) return `${d}d ago`;
                  if (h > 0) return `${h}h ago`;
                  if (m > 0) return `${m}m ago`;
                  return 'Just now';
                };
                const timeStr = getRelativeTime(item.timestamp);
                
                const typeColors = {
                  domain: { bg: '#2383e2', fg: '#fff' },
                  username: { bg: '#9065B0', fg: '#fff' },
                  network: { bg: '#e07b39', fg: '#fff' },
                  email: { bg: '#dfab01', fg: '#fff' },
                  btc: { bg: '#0f7b6c', fg: '#fff' }
                };
                const colorMap = typeColors[item.type] || { bg: '#5f5e5b', fg: '#fff' };
                const truncQuery = item.query.length > 24 ? item.query.substring(0, 24) + '...' : item.query;

                return (
                  <div
                    key={idx}
                    onClick={() => handleHistoryClick(item.query, item.type)}
                    className={layoutStyles.historyItem}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px', padding: '8px 14px', height: 'auto', minHeight: '38px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '9px',
                          fontWeight: 700,
                          backgroundColor: colorMap.bg,
                          color: colorMap.fg,
                          textTransform: 'uppercase',
                          flexShrink: 0
                        }}>
                          {item.type === 'network' ? 'IP' : item.type}
                        </span>
                        <span style={{ 
                          color: 'var(--notion-fg)',
                          fontWeight: 500,
                          fontSize: '13px'
                        }} title={item.query}>
                          {truncQuery}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {timeStr && (
                          <span style={{ fontSize: '10px', color: 'rgba(55, 53, 47, 0.5)', fontWeight: 500 }}>
                            {timeStr}
                          </span>
                        )}
                        {item.riskScore !== undefined && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: item.riskScore <= 33 ? '#ca2c2c' : item.riskScore <= 66 ? '#f2994a' : '#2ecc71'
                          }}>
                            {item.riskScore}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Tags Pills */}
                    {(() => {
                      const itemTags = item.tags || JSON.parse(localStorage.getItem('holmes-tags') || '{}')[item.query] || [];
                      if (itemTags.length > 0) {
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                            {itemTags.map(tag => {
                              const colors = getTagColor(tag);
                              return (
                                <span
                                  key={tag}
                                  style={{
                                    fontSize: '8px',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    backgroundColor: colors.bg,
                                    color: colors.fg,
                                    border: `1px solid ${colors.border}`,
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  {tag.replace('#', '')}
                                </span>
                              );
                            })}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
              {historyList.length === 0 && (
                <div style={{ fontSize: '11px', color: 'rgba(55, 53, 47, 0.4)', padding: '6px 16px', fontStyle: 'italic' }}>
                  No scans recorded yet.
                </div>
              )}
            </div>
            {historyList.length > 0 && (
              <button onClick={clearHistory} className={layoutStyles.historyClearBtn}>
                Clear History
              </button>
            )}
          </div>
        )}
        {/* Notes Section */}
        {sidebarExpanded && getNotesList().length > 0 && (
          <div className={layoutStyles.historySection}>
            <div className={layoutStyles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Analyst Notes</span>
              <span style={{ backgroundColor: 'rgba(55,53,47,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{notesCount}</span>
            </div>
            <div className={layoutStyles.historyList}>
              {getNotesList().map((item, idx) => {
                const typeColors = {
                  domain: { bg: '#2383e2', fg: '#fff' },
                  username: { bg: '#9065B0', fg: '#fff' },
                  network: { bg: '#e07b39', fg: '#fff' },
                  email: { bg: '#dfab01', fg: '#fff' },
                  btc: { bg: '#0f7b6c', fg: '#fff' }
                };
                const colorMap = typeColors[item.type] || { bg: '#5f5e5b', fg: '#fff' };
                const truncQuery = item.query.length > 24 ? item.query.substring(0, 24) + '...' : item.query;

                return (
                  <div
                    key={`note-${idx}`}
                    onClick={() => handleHistoryClick(item.query, item.type)}
                    className={layoutStyles.historyItem}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px', padding: '8px 14px', height: 'auto', minHeight: '38px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        backgroundColor: colorMap.bg,
                        color: colorMap.fg,
                        textTransform: 'uppercase',
                        flexShrink: 0
                      }}>
                        {item.type === 'network' ? 'IP' : item.type}
                      </span>
                      <span style={{ color: 'var(--notion-fg)', fontWeight: 500, fontSize: '13px' }} title={item.query}>
                        {truncQuery}
                      </span>
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: '11px', color: 'rgba(55, 53, 47, 0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.notes}
                      </div>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                        {item.tags.map(tag => {
                          const colors = getTagColor(tag);
                          return (
                            <span
                              key={tag}
                              style={{
                                fontSize: '8px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '3px',
                                backgroundColor: colors.bg,
                                color: colors.fg,
                                border: `1px solid ${colors.border}`,
                                textTransform: 'uppercase'
                              }}
                            >
                              {tag.replace('#', '')}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer profile */}
        <div className={layoutStyles.sidebarFooter} style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={layoutStyles.avatar}>H</div>
            <span className={layoutStyles.username}>Agent Holmes</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className={layoutStyles.mainContent}>
        
        {/* Header Breadcrumb Bar */}
        <header className={layoutStyles.headerBar}>
          <div className={layoutStyles.headerLeft}>
            <button onClick={toggleSidebar} className={layoutStyles.menuToggle}>
              <Menu size={16} />
            </button>
            <div className={layoutStyles.breadcrumbs}>
              <span>Holmes Workspace</span>
              <span className={layoutStyles.breadcrumbSeparator}>/</span>
              <span className={layoutStyles.breadcrumbActive}>
                {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
              </span>
            </div>
          </div>
          <div className={layoutStyles.headerRight}>
            <button 
              onClick={toggleDarkMode} 
              className={layoutStyles.headerButton}
              style={{ fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? '' : '☾'}
            </button>
            <button className={layoutStyles.headerButton}><Settings size={14} /> Settings</button>
            <button className={layoutStyles.headerButton}><HelpCircle size={14} /> Help</button>
          </div>
        </header>

        {/* Content Pane */}
        <section className={layoutStyles.scrollPane}>
          <div className={layoutStyles.contentWrapper}>
            
            {/* ── WORKSPACE DASHBOARD VIEW ── */}
            {activeView === 'dashboard' && (
              <WorkspaceDashboard />
            )}

            {activeView === 'apiKeys' && (
              <ApiKeysPanel />
            )}

            {/* ── MALTEGO GRAPH VIEW ── */}
            {activeView === 'maltego' && (
              <MaltegoGraph />
            )}

            {/* ── NEW ADVANCED TOOLS ── */}
            {activeView === 'monitor' && <ContinuousMonitor />}
                        {activeView === 'ml' && (
              <LocalMLIntel />
            )}
            {activeView === 'webScraper' && <WebScraper />}
            {activeView === 'subdomainBrute' && <SubdomainBrute />}
            {activeView === 'githubScanner' && <GitHubScanner />}
            {activeView === 'breachCrawler' && <BreachCrawler />}

            {/* ── REPORTS VIEW ── */}
            {activeView === 'reports' && (
              <ReportsPage reports={reports} activeReportId={activeReportId} setActiveView={setActiveView} />
            )}

            {/* ── NOTES DASHBOARD VIEW ── */}
            {activeView === 'notes' && (
              <NotesPage handleHistoryClick={handleHistoryClick} />
            )}

            {/* ── UNIFIED SCANNER ── */}
            {activeView === 'unified' && (
              <GodModeScanner initialQuery={unifiedQuery} onNavigate={setActiveView} />
            )}

            {/* ── SSE USERNAME SCANNER ── */}
            {activeView === 'socialStream' && (
              <div className={modStyles.container}>
                <div>
                  <h1 className={dashStyles.title}>Asynchronous Profile Exposure Stream</h1>
                  <div className={dashStyles.subtitle}>Queries live public target endpoints concurrently utilizing Server-Sent Events (SSE).</div>
                </div>
                <SocialScanner />
              </div>
            )}

            {/* ── EMAIL SPOOFING AUDIT ── */}
            {activeView === 'spoofing' && (
              <SpoofingPage apiBase={API_BASE} handleExportPdfReport={handleExportPdfReport} />
            )}

            {/* ── EMAIL HEADER Forensics ── */}
            {activeView === 'emailHeaders' && (
              <EmailHeadersPage apiBase={API_BASE} onInvestigate={(ipVal) => {
                setUnifiedQuery(ipVal);
                setActiveView('unified');
              }} />
            )}

            {/* ── GOOGLE DORK BUILDER ── */}
            {activeView === 'dorkBuilder' && (
              <div className={modStyles.container}>
                <DorkBuilder target={unifiedQuery} />
              </div>
            )}

            {/* ── EXIF FORENSICS ── */}
            {activeView === 'exif' && (
              <ExifPage apiBase={API_BASE} handleExportPdfReport={handleExportPdfReport} />
            )}

            {/* ── BLOCKCHAIN TRACKER ── */}
            {activeView === 'crypto' && (
              <CryptoPage apiBase={API_BASE} handleExportPdfReport={handleExportPdfReport} />
            )}

            {/* ── DOMAIN AUDIT ── */}
            {activeView === 'domain' && (
              <DomainPage apiBase={API_BASE} handleExportPdfReport={handleExportPdfReport} />
            )}

            {/* ── RELATION GRAPH AUDITOR ── */}
            {activeView === 'friendship' && (
              <FriendshipPage apiBase={API_BASE} handleExportPdfReport={handleExportPdfReport} />
            )}

            {/* ── GEO-INTELLIGENCE ── */}
            {activeView === 'geoint' && (
              <GeointPage apiBase={API_BASE} handleExportPdfReport={handleExportPdfReport} />
            )}

            {/* ── REVERSE IP LOOKUP ── */}
            {activeView === 'reverseip' && (
              <div className={modStyles.container}>
                <div>
                  <h1 className={dashStyles.title}>Reverse IP Lookup</h1>
                  <div className={dashStyles.subtitle}>Perform passive DNS profiling to enumerate all virtual hosts matching a target IP address.</div>
                </div>

                <form onSubmit={runReverseIpLookup} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target IP Address</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. 8.8.8.8 or 104.21.19.12" 
                        value={reverseIpVal}
                        onChange={(e) => setReverseIpVal(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className={`${modStyles.btn} ${modStyles.btnPrimary} ${reverseIpLoading ? modStyles.btnLoading : ''}`}
                      disabled={reverseIpLoading}
                    >
                      {reverseIpLoading ? 'Querying...' : 'Scan IP'}
                    </button>
                  </div>
                </form>

                {reverseIpLoading && (
                  <div className={modStyles.resultsContainer}>
                    <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div className="skeletonPulse skeletonTitle" style={{ margin: 0, height: '20px', width: '30%' }}></div>
                    </div>
                    <div className={modStyles.resultsBody} style={{ padding: '20px' }}>
                      <div className="skeletonPulse skeletonTitle" style={{ width: '25%', height: '18px', marginBottom: '14px' }}></div>
                      <div className="skeletonCard" style={{ padding: '0px', border: 'none', backgroundColor: 'transparent' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div className="skeletonPulse skeletonBlock" style={{ height: '32px' }}></div>
                          <div className="skeletonPulse skeletonBlock" style={{ height: '24px' }}></div>
                          <div className="skeletonPulse skeletonBlock" style={{ height: '24px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {reverseIpError && (
                  <div className={`${modStyles.bulletItem} ${modStyles.bulletDanger}`} style={{ marginTop: '14px' }}>
                    <AlertTriangle size={14} />
                    <span className={modStyles.bulletItemText}>{reverseIpError}</span>
                  </div>
                )}

                {reverseIpResults && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'start', width: '100%', marginTop: '20px' }}>
                    <div style={{ flex: 1, minWidth: 0 }} className={modStyles.resultsContainer}>
                      <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div className={modStyles.resultsTitle}>🔍 Reverse DNS Record: {reverseIpResults.ip}</div>
                        <button 
                          onClick={() => handleExportPdfReport(reverseIpResults.ip, reverseIpResults)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            backgroundColor: 'var(--notion-accent-bg)',
                            color: 'var(--notion-accent)',
                            border: '1px solid var(--notion-border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                           Export PDF
                        </button>
                      </div>
                      <div className={modStyles.resultsBody}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <h3 className={dashStyles.sectionHeader} style={{ margin: 0 }}>Associated Domains ({reverseIpResults.count} Hosts)</h3>
                        </div>

                        {reverseIpResults.domains && reverseIpResults.domains.length > 0 ? (
                          <div className={modStyles.tableWrapper} style={{ overflowX: 'auto' }}>
                            <table className={repStyles.reportTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--notion-border)' }}>
                                  <th style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)' }}>Domain Name</th>
                                  <th style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reverseIpResults.domains.map((domain, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid #f1f1f0', transition: 'background-color 0.1s ease' }}>
                                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 500 }} className={modStyles.codeFont}>
                                      {domain}
                                    </td>
                                    <td style={{ padding: '10px', fontSize: '12px', textAlign: 'right' }}>
                                      <button 
                                        onClick={() => {
                                          setUnifiedQuery(domain);
                                          setActiveView('unified');
                                        }} 
                                        className={modStyles.btn}
                                        style={{ 
                                          minHeight: 'auto', 
                                          padding: '5px 12px', 
                                          fontSize: '11px', 
                                          backgroundColor: 'rgba(35, 131, 226, 0.08)', 
                                          color: 'var(--notion-accent)', 
                                          border: 'none', 
                                          fontWeight: 600,
                                          borderRadius: '4px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Investigate
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ color: 'rgba(55, 53, 47, 0.5)', fontSize: '13px', fontStyle: 'italic', padding: '20px 0' }}>
                            No host domain mappings detected on this target IP address.
                          </div>
                        )}
                      </div>
                    </div>
                    <AnalystNotesPanel query={reverseIpResults.ip} />
                  </div>
                )}
              </div>
            )}

            {/* ── DNS & HOST HISTORY ── */}
            {activeView === 'dnsHistory' && (
              <div className={modStyles.container}>
                <div>
                  <h1 className={dashStyles.title}>DNS & Host History Auditor</h1>
                  <div className={dashStyles.subtitle}>Perform passive multi-point queries to trace subdomains and active A, MX, and NS records.</div>
                </div>

                <form onSubmit={runDnsHistoryLookup} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Domain Name</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. google.com or microsoft.com" 
                        value={dnsDomain}
                        onChange={(e) => setDnsDomain(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className={`${modStyles.btn} ${modStyles.btnPrimary} ${dnsLoading ? modStyles.btnLoading : ''}`}
                      disabled={dnsLoading}
                    >
                      {dnsLoading ? 'Enumerating...' : 'Scan Domain'}
                    </button>
                  </div>
                </form>

                {dnsLoading && (
                  <div className={modStyles.resultsContainer}>
                    <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div className="skeletonPulse skeletonTitle" style={{ margin: 0, height: '20px', width: '30%' }}></div>
                    </div>
                    <div className={modStyles.resultsBody} style={{ padding: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
                        <div className="skeletonCard" style={{ margin: 0, backgroundColor: 'transparent' }}>
                          <div className="skeletonPulse skeletonTitle" style={{ width: '50%', height: '18px', marginBottom: '12px' }}></div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                            <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                          </div>
                        </div>
                        <div className="skeletonCard" style={{ margin: 0, backgroundColor: 'transparent' }}>
                          <div className="skeletonPulse skeletonTitle" style={{ width: '60%', height: '18px', marginBottom: '12px' }}></div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                            <div className="skeletonPulse skeletonBlock" style={{ height: '20px' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dnsError && (
                  <div className={`${modStyles.bulletItem} ${modStyles.bulletDanger}`} style={{ marginTop: '14px' }}>
                    <AlertTriangle size={14} />
                    <span className={modStyles.bulletItemText}>{dnsError}</span>
                  </div>
                )}

                {dnsResults && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'start', width: '100%', marginTop: '20px' }}>
                    <div style={{ flex: 1, minWidth: 0 }} className="animate-fade-in">
                      <div className={modStyles.resultsContainer}>
                        <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div className={modStyles.resultsTitle}>🔍 Intelligence Map: {dnsResults.domain}</div>
                          <button 
                            onClick={() => handleExportPdfReport(dnsResults.domain, dnsResults)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              backgroundColor: 'var(--notion-accent-bg)',
                              color: 'var(--notion-accent)',
                              border: '1px solid var(--notion-border)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                             Export PDF
                          </button>
                        </div>
                        <div className={modStyles.resultsBody} style={{ padding: '20px' }}>
                          
                          {/* Two-Column Grid Layout */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
                            
                            {/* Left Column: DNS Records Table */}
                            <div>
                              <h3 className={dashStyles.sectionHeader} style={{ marginTop: 0, marginBottom: '12px' }}> Passive DNS Resolution</h3>
                              <div className={modStyles.tableWrapper} style={{ overflowX: 'auto', border: '1px solid var(--notion-border)', borderRadius: '6px' }}>
                                <table className={repStyles.reportTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--notion-border)', backgroundColor: '#fafafa' }}>
                                      <th style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)' }}>Record Type</th>
                                      <th style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)' }}>Resolved Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* A Records */}
                                    {dnsResults.a_records && dnsResults.a_records.map((rec, i) => (
                                      <tr key={`a-${i}`} style={{ borderBottom: '1px solid #f1f1f0' }}>
                                        <td style={{ padding: '10px', fontSize: '12px', fontWeight: 700, color: '#2b7a3e' }}>A (IPv4 Address)</td>
                                        <td style={{ padding: '10px', fontSize: '13px' }} className={modStyles.codeFont}>{rec}</td>
                                      </tr>
                                    ))}
                                    {/* MX Records */}
                                    {dnsResults.mx_records && dnsResults.mx_records.map((rec, i) => (
                                      <tr key={`mx-${i}`} style={{ borderBottom: '1px solid #f1f1f0' }}>
                                        <td style={{ padding: '10px', fontSize: '12px', fontWeight: 700, color: '#c9751d' }}>MX (Mail Server)</td>
                                        <td style={{ padding: '10px', fontSize: '13px' }} className={modStyles.codeFont}>{rec}</td>
                                      </tr>
                                    ))}
                                    {/* NS Records */}
                                    {dnsResults.ns_records && dnsResults.ns_records.map((rec, i) => (
                                      <tr key={`ns-${i}`} style={{ borderBottom: '1px solid #f1f1f0' }}>
                                        <td style={{ padding: '10px', fontSize: '12px', fontWeight: 700, color: 'var(--notion-accent)' }}>NS (Name Server)</td>
                                        <td style={{ padding: '10px', fontSize: '13px' }} className={modStyles.codeFont}>{rec}</td>
                                      </tr>
                                    ))}
                                    {(!dnsResults.a_records?.length && !dnsResults.mx_records?.length && !dnsResults.ns_records?.length) && (
                                      <tr>
                                        <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: 'rgba(55, 53, 47, 0.5)', fontStyle: 'italic', fontSize: '13px' }}>
                                          No active records discovered.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Right Column: Host List Table */}
                            <div>
                              <h3 className={dashStyles.sectionHeader} style={{ marginTop: 0, marginBottom: '12px' }}> Passive Subdomain Enumeration</h3>
                              <div className={modStyles.tableWrapper} style={{ overflowX: 'auto', border: '1px solid var(--notion-border)', borderRadius: '6px', maxHeight: '500px', overflowY: 'auto' }}>
                                <table className={repStyles.reportTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--notion-border)', backgroundColor: '#fafafa' }}>
                                      <th style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)', backgroundColor: '#fafafa' }}>Subdomain / Host</th>
                                      <th style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)', backgroundColor: '#fafafa' }}>Mapped IP</th>
                                      <th style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)', backgroundColor: '#fafafa', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dnsResults.hosts && dnsResults.hosts.length > 0 ? (
                                      dnsResults.hosts.map((hostEntry, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f1f0', transition: 'background-color 0.1s ease' }}>
                                          <td style={{ padding: '10px', fontSize: '12.5px', fontWeight: 500 }} className={modStyles.codeFont}>
                                            {hostEntry.host}
                                          </td>
                                          <td style={{ padding: '10px', fontSize: '12px' }} className={modStyles.codeFont}>
                                            {hostEntry.ip}
                                          </td>
                                          <td style={{ padding: '10px', fontSize: '12px', textAlign: 'right' }}>
                                            <button 
                                              onClick={() => {
                                                setUnifiedQuery(hostEntry.host);
                                                setActiveView('unified');
                                              }} 
                                              className={modStyles.btn}
                                              style={{ 
                                                minHeight: 'auto', 
                                                padding: '4px 10px', 
                                                fontSize: '10.5px', 
                                                backgroundColor: 'rgba(35, 131, 226, 0.08)', 
                                                color: 'var(--notion-accent)', 
                                                border: 'none', 
                                                fontWeight: 600,
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              Investigate
                                            </button>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'rgba(55, 53, 47, 0.5)', fontStyle: 'italic', fontSize: '13px' }}>
                                          No subdomains or host mappings found.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                          </div>
                          
                        </div>
                      </div>
                    </div>
                    <AnalystNotesPanel query={dnsResults.domain} />
                  </div>
                )}
              </div>
            )}


            {/* ── PHONE OSINT ── */}
            {activeView === 'phone' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Telephony Node Intelligence</h1>
                  <div className={dashStyles.subtitle}>Perform passive technical reconnaissance on mobile and fixed-line phone numbers.</div>
                </div>

                <form onSubmit={runPhoneScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target Phone Number</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. +14155552671" 
                        value={phoneTarget}
                        onChange={(e) => {
                          setPhoneTarget(e.target.value);
                          setPhoneError('');
                        }}
                        disabled={phoneLoading}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!phoneTarget || phoneLoading}
                    >
                      {phoneLoading ? 'Scanning...' : 'Execute Analysis'}
                    </button>
                  </div>
                </form>

                {phoneError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{phoneError}</span>
                  </div>
                )}

                {phoneLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {phoneResults && !phoneLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <PhoneIntel results={phoneResults} />
                    </div>
                    <AnalystNotesPanel query={phoneResults.number || phoneTarget} />
                  </div>
                )}
              </div>
            )}

            {/* ── IOT SCANNER ── */}
            {activeView === 'iot' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>IoT & Vulnerability Scanner</h1>
                  <div className={dashStyles.subtitle}>Passively discover open ports, hostnames, and known CVEs for any IP address using InternetDB.</div>
                </div>

                <form onSubmit={runIotScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target IPv4 Address</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. 8.8.8.8" 
                        value={iotTarget}
                        onChange={(e) => {
                          setIotTarget(e.target.value);
                          setIotError('');
                        }}
                        disabled={iotLoading}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!iotTarget || iotLoading}
                    >
                      {iotLoading ? 'Scanning...' : 'Execute Scan'}
                    </button>
                  </div>
                </form>

                {iotError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{iotError}</span>
                  </div>
                )}

                {iotLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {iotResults && !iotLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <IotScanner results={iotResults} />
                    </div>
                    <AnalystNotesPanel query={iotResults.ip || iotTarget} />
                  </div>
                )}
              </div>
            )}

            {/* ── DARK WEB SCANNER ── */}
            {activeView === 'darkweb' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Dark Web & Tor Monitor</h1>
                  <div className={dashStyles.subtitle}>Search for leaks, mentions, and hidden services across the Tor network (.onion sites).</div>
                </div>

                <form onSubmit={runDwScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target Query (Email, Username, Domain)</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. jdoe@example.com or companyname" 
                        value={dwTarget}
                        onChange={(e) => {
                          setDwTarget(e.target.value);
                          setDwError('');
                        }}
                        disabled={dwLoading}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!dwTarget || dwLoading}
                    >
                      {dwLoading ? 'Searching Tor...' : 'Execute Scan'}
                    </button>
                  </div>
                </form>

                {dwError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{dwError}</span>
                  </div>
                )}

                {dwLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {dwResults && !dwLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <DarkWebIntel results={dwResults} />
                    </div>
                    <AnalystNotesPanel query={dwResults.query || dwTarget} />
                  </div>
                )}
              </div>
            )}

            {/* ── METADATA EXTRACTOR ── */}
            {activeView === 'metadata' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Document Metadata Forensics</h1>
                  <div className={dashStyles.subtitle}>Extract hidden metadata (authors, timestamps, software) from PDF, DOCX, and XLSX files.</div>
                </div>

                <form onSubmit={runMetaScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Upload Target Document (.pdf, .docx, .xlsx)</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1, border: '1px dashed var(--notion-border)', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="file" 
                        accept=".pdf,.docx,.xlsx"
                        onChange={(e) => {
                          setMetaFile(e.target.files[0]);
                          setMetaError('');
                        }}
                        disabled={metaLoading}
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!metaFile || metaLoading}
                    >
                      {metaLoading ? 'Extracting...' : 'Extract Metadata'}
                    </button>
                  </div>
                </form>

                {metaError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{metaError}</span>
                  </div>
                )}

                {metaLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {metaResults && !metaLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <MetadataExtractor results={metaResults} />
                    </div>
                    <AnalystNotesPanel query={metaResults.filename || 'Document'} />
                  </div>
                )}
              </div>
            )}

            {/* ── CORPORATE INTEL ── */}
            {activeView === 'corporate' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Corporate Entity Intelligence</h1>
                  <div className={dashStyles.subtitle}>Search global registries for company incorporation data, status, and addresses.</div>
                </div>

                <form onSubmit={runCorpScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target Company Name</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. Apple Inc" 
                        value={corpTarget}
                        onChange={(e) => {
                          setCorpTarget(e.target.value);
                          setCorpError('');
                        }}
                        disabled={corpLoading}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!corpTarget || corpLoading}
                    >
                      {corpLoading ? 'Searching...' : 'Execute Scan'}
                    </button>
                  </div>
                </form>

                {corpError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{corpError}</span>
                  </div>
                )}

                {corpLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {corpResults && !corpLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <CorporateIntel results={corpResults} />
                    </div>
                    <AnalystNotesPanel query={corpResults.company_name || corpTarget} />
                  </div>
                )}
              </div>
            )}

            {/* ── REDDIT ANALYZER ── */}
            {activeView === 'reddit' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Reddit Profile Analyzer</h1>
                  <div className={dashStyles.subtitle}>Extract most active subreddits and estimate timezone based on a Reddit user's comment history.</div>
                </div>

                <form onSubmit={runRedditScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target Reddit Username</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. spez" 
                        value={redditTarget}
                        onChange={(e) => {
                          setRedditTarget(e.target.value);
                          setRedditError('');
                        }}
                        disabled={redditLoading}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!redditTarget || redditLoading}
                    >
                      {redditLoading ? 'Analyzing...' : 'Execute Scan'}
                    </button>
                  </div>
                </form>

                {redditError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{redditError}</span>
                  </div>
                )}

                {redditLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {redditResults && !redditLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <RedditAnalyzer results={redditResults} />
                    </div>
                    <AnalystNotesPanel query={`u/${redditResults.username || redditTarget}`} />
                  </div>
                )}
              </div>
            )}

            {/* ── IMAGE OSINT ── */}
            {activeView === 'imageOsint' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Reverse Image Search Pivot</h1>
                  <div className={dashStyles.subtitle}>Generate reverse image search queries across multiple platforms (Google Lens, Yandex, Bing, TinEye) from a single image URL.</div>
                </div>

                <form onSubmit={runImageScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target Image URL</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. https://example.com/image.jpg" 
                        value={imageTarget}
                        onChange={(e) => {
                          setImageTarget(e.target.value);
                          setImageError('');
                        }}
                        disabled={imageLoading}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!imageTarget || imageLoading}
                    >
                      {imageLoading ? 'Generating...' : 'Generate Pivots'}
                    </button>
                  </div>
                </form>

                {imageError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{imageError}</span>
                  </div>
                )}

                {imageLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {imageResults && !imageLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <ImageOsint results={imageResults} />
                    </div>
                    <AnalystNotesPanel query={imageTarget} />
                  </div>
                )}
              </div>
            )}

            {/* ── VEHICLE RECON ── */}
            {activeView === 'vehicle' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Vehicle Intelligence</h1>
                  <div className={dashStyles.subtitle}>Decode any 17-character VIN to extract manufacturing details, engine specs, and vehicle history constraints.</div>
                </div>

                <form onSubmit={runVinScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target Vehicle Identification Number (VIN)</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. 1HGCM82633A004XXX" 
                        value={vinTarget}
                        onChange={(e) => {
                          setVinTarget(e.target.value);
                          setVinError('');
                        }}
                        disabled={vinLoading}
                        maxLength={17}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={vinTarget.length !== 17 || vinLoading}
                    >
                      {vinLoading ? 'Decoding...' : 'Execute Scan'}
                    </button>
                  </div>
                </form>

                {vinError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{vinError}</span>
                  </div>
                )}

                {vinLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {vinResults && !vinLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <VehicleRecon results={vinResults} />
                    </div>
                    <AnalystNotesPanel query={vinTarget} />
                  </div>
                )}
              </div>
            )}

            {/* ── AVIATION TRACKER ── */}
            {activeView === 'aviation' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Aviation Intelligence</h1>
                  <div className={dashStyles.subtitle}>Generate live flight tracking and historical registry pivots for civilian and private aircraft using their Tail Number.</div>
                </div>

                <form onSubmit={runAviationScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target Aircraft Tail Number</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. N12345 or G-ABCD" 
                        value={aviationTarget}
                        onChange={(e) => {
                          setAviationTarget(e.target.value);
                          setAviationError('');
                        }}
                        disabled={aviationLoading}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!aviationTarget || aviationLoading}
                    >
                      {aviationLoading ? 'Generating...' : 'Execute Scan'}
                    </button>
                  </div>
                </form>

                {aviationError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{aviationError}</span>
                  </div>
                )}

                {aviationLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {aviationResults && !aviationLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <AviationIntel results={aviationResults} />
                    </div>
                    <AnalystNotesPanel query={aviationTarget} />
                  </div>
                )}
              </div>
            )}

            {/* ── HASH ANALYZER ── */}
            {activeView === 'hash' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Cryptographic Hash Analyzer</h1>
                  <div className={dashStyles.subtitle}>Identify the encryption algorithm of a hash and generate pivots to plaintext cracking databases.</div>
                </div>

                <form onSubmit={runHashScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target Cryptographic Hash</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. 5d41402abc4b2a76b9719d911017c592" 
                        value={hashTarget}
                        onChange={(e) => {
                          setHashTarget(e.target.value);
                          setHashError('');
                        }}
                        disabled={hashLoading}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!hashTarget || hashLoading}
                    >
                      {hashLoading ? 'Analyzing...' : 'Execute Scan'}
                    </button>
                  </div>
                </form>

                {hashError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{hashError}</span>
                  </div>
                )}

                {hashLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {hashResults && !hashLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <HashAnalyzer results={hashResults} />
                    </div>
                    <AnalystNotesPanel query={hashTarget} />
                  </div>
                )}
              </div>
            )}

            {/* ── MAC DECODER ── */}
            {activeView === 'mac' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>MAC Address Vendor Decoder</h1>
                  <div className={dashStyles.subtitle}>Identify the hardware manufacturer of a device using its MAC Address (OUI Lookup).</div>
                </div>

                <form onSubmit={runMacScan} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target MAC Address</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. 00:1A:2B:3C:4D:5E" 
                        value={macTarget}
                        onChange={(e) => {
                          setMacTarget(e.target.value);
                          setMacError('');
                        }}
                        disabled={macLoading}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`${modStyles.btn} ${modStyles.btnPrimary}`}
                      disabled={!macTarget || macLoading}
                    >
                      {macLoading ? 'Decoding...' : 'Execute Scan'}
                    </button>
                  </div>
                </form>

                {macError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', border: '1px solid rgba(202,44,44,0.2)' }}>
                    <AlertTriangle size={16} />
                    <span>{macError}</span>
                  </div>
                )}

                {macLoading && (
                  <div style={{ marginTop: '30px' }}>
                    <div className="skeletonPulse skeletonTitle" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
                  </div>
                )}

                {macResults && !macLoading && (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', marginTop: '30px' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <MacDecoder results={macResults} />
                    </div>
                    <AnalystNotesPanel query={macTarget} />
                  </div>
                )}
              </div>
            )}

            {/* ── TRACEROUTE PATH MAP ── */}
            {activeView === 'traceroute' && (
              <div className="animate-fade-in">
                <div>
                  <h1 className={dashStyles.title}>Traceroute Path Map</h1>
                  <div className={dashStyles.subtitle}>Perform passive Technical Recon by tracing hop-by-hop active network route paths.</div>
                </div>

                <form onSubmit={runTraceroute} className={modStyles.inputGroup}>
                  <label className={modStyles.inputLabel}>Target Hostname or IP</label>
                  <div className={modStyles.actionRow}>
                    <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
                      <span className={modStyles.inputIcon}></span>
                      <input 
                        className={modStyles.inputField} 
                        placeholder="e.g. google.com or 8.8.8.8" 
                        value={traceHost}
                        onChange={(e) => setTraceHost(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className={`${modStyles.btn} ${modStyles.btnPrimary} ${traceLoading ? modStyles.btnLoading : ''}`}
                      disabled={traceLoading}
                    >
                      {traceLoading ? 'Tracing...' : 'Run Route Audit'}
                    </button>
                  </div>
                </form>

                {traceError && (
                  <div className={modStyles.errorBanner} style={{ marginTop: '20px' }}>
                    <span className={modStyles.errorIcon}></span>
                    <span className={modStyles.errorText}>{traceError}</span>
                  </div>
                )}

                {traceLoading && (
                  <div className={modStyles.resultsContainer} style={{ marginTop: '24px', padding: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                      <div className="loaderPulse" style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '3px solid rgba(35, 131, 226, 0.1)',
                        borderTopColor: 'var(--notion-accent)',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-fg)' }}>Auditing Network Path...</div>
                      <div style={{ fontSize: '11px', color: 'rgba(55, 53, 47, 0.4)', maxWidth: '300px', textAlign: 'center' }}>
                        Sending echo requests and measuring round-trip telemetry. Please wait up to 15s.
                      </div>
                    </div>
                  </div>
                )}

                {traceHops && (
                  <div className={modStyles.resultsContainer} style={{ marginTop: '24px', padding: '24px' }}>
                    <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--notion-fg)' }}>
                          Active Routing Hop-Map for <span style={{ fontFamily: 'monospace', color: 'var(--notion-accent)' }}>{traceHost}</span>
                        </h3>
                        <div style={{ fontSize: '11.5px', color: 'rgba(55, 53, 47, 0.5)', marginTop: '4px' }}>
                          Resolved {traceHops.length} gateways on active route.
                        </div>
                      </div>
                    </div>

                    {/* Timeline Container */}
                    <div style={{ position: 'relative', paddingLeft: '32px', margin: '16px 0' }}>
                      
                      {/* Vertical line through hops */}
                      <div style={{
                        position: 'absolute',
                        left: '11px',
                        top: '16px',
                        bottom: '16px',
                        width: '2px',
                        backgroundColor: 'var(--notion-border)',
                        zIndex: 1
                      }}></div>

                      {traceHops.map((hop, idx) => {
                        const isFinal = idx === traceHops.length - 1;
                        const isTimeout = hop.ip === "*";
                        
                        // Flag/emoji helper defined locally
                        const getFlagEmoji = (countryCode) => {
                          if (!countryCode) return '';
                          const c = countryCode.toLowerCase();
                          if (c === 'private') return '';
                          if (c === 'global') return '';
                          if (c === 'un') return '';
                          
                          const codePoints = c
                            .toUpperCase()
                            .split('')
                            .map(char => 127397 + char.charCodeAt(0));
                          try {
                            return String.fromCodePoint(...codePoints);
                          } catch (e) {
                            return '';
                          }
                        };
                        
                        const flag = getFlagEmoji(hop.country_code);
                        
                        // RTT color grade
                        let rttColor = '#2b7a3e'; // green (<15ms)
                        if (hop.rtt > 50) {
                          rttColor = '#ca2c2c'; // red
                        } else if (hop.rtt > 15) {
                          rttColor = '#c9751d'; // orange
                        }

                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              position: 'relative', 
                              marginBottom: '20px', 
                              display: 'flex', 
                              alignItems: 'start', 
                              gap: '16px' 
                            }}
                          >
                            {/* Timeline Circle Node */}
                            <div style={{
                              position: 'absolute',
                              left: '-32px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: isFinal ? 'var(--notion-accent)' : (isTimeout ? '#fbe9e7' : 'var(--notion-bg)'),
                              border: isFinal ? 'none' : `2px solid ${isTimeout ? '#ca2c2c' : 'var(--notion-border)'}`,
                              color: isFinal ? '#ffffff' : (isTimeout ? '#ca2c2c' : 'var(--notion-fg)'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              zIndex: 2,
                              boxShadow: isFinal ? '0 0 0 3px rgba(35, 131, 226, 0.2)' : 'none'
                            }}>
                              {hop.hop}
                            </div>

                            {/* Hop Card Content */}
                            <div 
                              style={{
                                flexGrow: 1,
                                backgroundColor: isFinal ? 'rgba(35, 131, 226, 0.03)' : 'var(--notion-sidebar)',
                                border: `1px solid ${isFinal ? 'rgba(35, 131, 226, 0.2)' : 'var(--notion-border)'}`,
                                borderRadius: '8px',
                                padding: '12px 16px',
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 1.2fr 1fr',
                                gap: '16px',
                                alignItems: 'center',
                                transition: 'all 0.15s ease',
                                boxShadow: isFinal ? '0 2px 8px rgba(35, 131, 226, 0.05)' : 'none'
                              }}
                            >
                              {/* Left Section: IP & Copy */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(55,53,47,0.4)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Hop Gateway IP</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ 
                                    fontFamily: 'monospace', 
                                    fontSize: '12.5px', 
                                    fontWeight: 700, 
                                    color: isTimeout ? 'rgba(55,53,47,0.4)' : 'var(--notion-fg)' 
                                  }}>
                                    {hop.ip}
                                  </span>
                                  {!isTimeout && (
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(hop.ip);
                                        alert(`IP ${hop.ip} copied to clipboard!`);
                                      }}
                                      style={{
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        opacity: 0.5,
                                        padding: '2px'
                                      }}
                                      title="Copy IP"
                                    >
                                      
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Center Section: Location Info */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(55,53,47,0.4)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Resolved Geolocation</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500 }}>
                                  <span style={{ fontSize: '14px' }}>{flag}</span>
                                  <span style={{ color: 'var(--notion-fg)' }}>
                                    {hop.city}
                                  </span>
                                  <span style={{ color: 'rgba(55, 53, 47, 0.4)', fontSize: '11px' }}>
                                    • {hop.country}
                                  </span>
                                </div>
                              </div>

                              {/* Right Section: RTT Bar */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 600 }}>
                                  <span style={{ color: 'rgba(55,53,47,0.4)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Latency (RTT)</span>
                                  <span style={{ color: isTimeout ? 'rgba(55,53,47,0.4)' : rttColor, fontWeight: 700 }}>
                                    {isTimeout ? 'TIMED OUT' : `${hop.rtt} ms`}
                                  </span>
                                </div>
                                <div style={{ 
                                  height: '6px', 
                                  backgroundColor: 'rgba(55, 53, 47, 0.06)', 
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}>
                                  {!isTimeout && (
                                    <div style={{ 
                                      width: `${Math.min(hop.rtt * 1.5, 100)}%`, 
                                      height: '100%', 
                                      backgroundColor: rttColor,
                                      borderRadius: '3px',
                                      transition: 'width 0.5s ease'
                                    }}></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <AnalystNotesPanel query={traceHost} />
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

      </main>
    </div>
  );
}
