import { useState, useCallback, useEffect } from 'react';
import {
  Search, ChevronDown, AlertTriangle, FileText,
  Globe, Layers, Clock, User, AtSign, Hash,
  Fingerprint, Code2, Zap, Info, ExternalLink, Activity,
  Menu, Settings, Database, ShieldCheck, Mail, Camera, MapPin, History, LayoutGrid
} from 'lucide-react';

import Logo               from './components/Logo';
import RiskGauge          from './components/RiskGauge';
import PlatformGrid       from './components/PlatformGrid';
import EntityBadges       from './components/EntityBadges';
import InvestigatingState from './components/InvestigatingState';
import ScoringBreakdown   from './components/ScoringBreakdown';
import GraphWidget        from './components/GraphWidget';
import { generatePDF }    from './utils/reportGenerator';

import IntroPage          from './components/IntroPage';
import ArchiveWidget      from './components/ArchiveWidget';
import TechStackWidget    from './components/TechStackWidget';
import SpoofingWidget     from './components/SpoofingWidget';
import ThreatIntelWidget  from './components/ThreatIntelWidget';
import CertificatesWidget from './components/CertificatesWidget';
import TrackersWidget     from './components/TrackersWidget';
import CryptoWidget       from './components/CryptoWidget';
import GeoIntWidget       from './components/GeoIntWidget';
import ExifWidget         from './components/ExifWidget';
import FriendshipWidget   from './components/FriendshipWidget';
import UnifiedDashboard   from './components/UnifiedDashboard';
import ActivityHeatmap    from './components/ActivityHeatmap';
import OnboardingModal    from './components/OnboardingModal';
import HolmesLogo         from './components/HolmesLogo';
import ApiVault           from './components/ApiVault';


const API_BASE = 'http://localhost:8001';

const CATEGORIES = [
  { value: 'unified',  label: 'Auto-Detect',   icon: Zap, emoji: '⚡' },
  { value: 'username', label: 'Username',      icon: User, emoji: '👤' },
  { value: 'domain',   label: 'Domain',        icon: Globe, emoji: '🌐' },
  { value: 'email',    label: 'Email',         icon: AtSign, emoji: '📧' },
  { value: 'btc',      label: 'BTC Wallet',    icon: Hash, emoji: '💰' },
  { value: 'network',  label: 'IP / CIDR',     icon: Layers, emoji: '🖥️' },
];

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition-colors ${active ? 'bg-[rgba(55,53,47,0.08)]' : 'hover:bg-[rgba(55,53,47,0.03)]'}`}
    >
      <Icon size={16} className={active ? 'text-blue-500' : 'text-[rgba(55,53,47,0.45)]'} />
      <span className={active ? 'text-[#37352f]' : 'text-[rgba(55,53,47,0.65)]'}>{label}</span>
    </div>
  );
}

function Section({ title, emoji, children }) {
  return (
    <div className="mb-10 animate-fade-in">
      <h2 className="flex items-center gap-2 mb-4">
        <span>{emoji}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function SearchBar({ onSearch, onClear, loading }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [catOpen, setCatOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), '', category.value);
  };

  return (
    <div className="mb-12 w-full max-w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
        <div 
          className="flex items-center gap-3 bg-[rgba(242,241,238,0.6)] transition-all"
          style={{
            minHeight: '52px',
            borderRadius: '12px',
            border: '1px solid var(--notion-border)',
            padding: '6px 16px',
            width: '100%',
            boxShadow: 'none'
          }}
          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(35,131,226,0.15)'}
          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <div className="relative">
            <button 
              type="button"
              onClick={() => setCatOpen(!catOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[rgba(55,53,47,0.05)] text-xs font-medium text-[rgba(55,53,47,0.5)]"
            >
              <span>{category.emoji}</span>
              <ChevronDown size={12} />
            </button>
            {catOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[rgba(55,53,47,0.09)] rounded-md shadow-xl min-w-[140px] py-1">
                {CATEGORIES.map(cat => (
                  <div 
                    key={cat.value}
                    onClick={() => { setCategory(cat); setCatOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[rgba(55,53,47,0.03)] cursor-pointer"
                  >
                    <span>{cat.emoji}</span> {cat.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <input 
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#37352f] placeholder-[rgba(55,53,47,0.3)]"
            placeholder="Investigate anything — domain, username, email, IP, Bitcoin address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          <span className="notion-tag text-[10px] bg-blue-50 text-blue-700 border-blue-100 px-2 py-0.5 rounded font-bold uppercase">
            {category.label}
          </span>

          <button 
            type="submit" 
            disabled={loading}
            className="notion-button-primary px-4 py-1.5 text-xs rounded"
          >
            {loading ? 'Running...' : 'Investigate'}
          </button>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-[rgba(55,53,47,0.4)] font-medium">⚡ Pro Tip: Try auto-detect mode</span>
          {query && <span onClick={() => { setQuery(''); onClear(); }} className="text-[10px] text-red-500 cursor-pointer hover:underline">Clear</span>}
        </div>
      </form>
    </div>
  );
}


export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    setBannerVisible(true);
    fetch(`${apiUrl}/health`)
      .then(res => {
        if(res.ok) setBannerVisible(false);
      })
      .catch(() => {
        setBannerVisible(true);
        // retry every 5 seconds until server wakes
        const interval = setInterval(() => {
          fetch(`${apiUrl}/health`)
            .then(res => {
              if(res.ok) {
                setBannerVisible(false);
                clearInterval(interval);
              }
            })
            .catch(() => {});
        }, 5000);
      });
  }, []);
  const [status, setStatus]   = useState('idle');
  const [results, setResults] = useState(null);
  const [error, setError]     = useState('');
  const [view, setView]       = useState('dashboard'); // dashboard | graph | reports | history

  const handleSearch = useCallback(async (queryValue, rawText, categoryType) => {
    const trimmedQuery = queryValue ? queryValue.trim().replace(/^@/, '') : '';
    if (!trimmedQuery) return;

    setStatus('loading');
    setResults(null);
    setError('');

    try {
      let res;
      if (categoryType === 'unified' || categoryType === 'btc' || categoryType === 'network') {
        res = await fetch(`${API_BASE}/api/unified/scan?query=${queryValue}`);
        if (!res.ok) throw new Error('Scan failed.');
        const unifiedData = await res.json();
        
        if (unifiedData.type !== 'username') {
          setResults({ ...unifiedData, username: queryValue, _type: unifiedData.type });
          setStatus('done');
          return;
        }
      }

      res = await fetch(`${API_BASE}/api/analyze?username=${trimmedQuery}`);
      if (!res.ok) throw new Error('Search failed.');

      setResults({ _type: 'username', username: queryValue, platform_footprint: [], summary: 'Connecting to servers...' });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              if (event.type === 'platform') {
                setResults(prev => {
                  const footprint = [...(prev.platform_footprint || [])];
                  footprint.push({ platform: event.data.platform, url: event.data.url, found: event.data.status === 'found' });
                  return { ...prev, platform_footprint: footprint };
                });
              } else if (event.type === 'status') {
                setResults(prev => ({ ...prev, summary: event.message }));
              } else if (event.type === 'final') {
                setResults(prev => ({ ...prev, ...event.data }));
                setStatus('done');
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  if (showIntro) return <IntroPage onStart={() => setShowIntro(false)} />;

  return (
    <div className="flex min-h-screen">
      
      <OnboardingModal />
      
      {/* Wakeup Banner */}

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '36px',
        backgroundColor: '#fbbf24',
        color: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        opacity: bannerVisible ? 1 : 0,
        pointerEvents: bannerVisible ? 'auto' : 'none',
        transition: 'opacity 0.5s ease-out'
      }}>
        Server waking up, please wait...
      </div>
      {/* Sidebar */}
      <aside className="notion-sidebar p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-2 py-3 mb-4" style={{ fontSize: '15px' }}>
          <HolmesLogo />
        </div>
        
        <SidebarItem icon={LayoutGrid} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <SidebarItem icon={Activity} label="Live Feed" active={view === 'graph'} onClick={() => setView('graph')} />
        <SidebarItem icon={Database} label="Intelligence Pool" />
        <SidebarItem icon={FileText} label="Recent Reports" />
        <SidebarItem icon={Settings} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
        
        <div className="mt-8 text-[10px] font-semibold text-[rgba(55,53,47,0.3)] uppercase px-2 mb-2 tracking-widest">Modules</div>
        <div className="flex flex-col gap-0.5">
           <SidebarItem icon={ShieldCheck} label="Spoofing Audit" />
           <SidebarItem icon={Mail} label="Email Search" />
           <SidebarItem icon={Globe} label="Domain Scan" />
           <SidebarItem icon={Camera} label="EXIF Forensic" />
           <SidebarItem icon={MapPin} label="WIFI Geolocation" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="notion-main">
        <div className="max-w-[800px]">
          {view === 'settings' ? (
            <ApiVault />
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4 text-4xl">🕵️‍♂️</div>
              <h1>Investigation Portal</h1>
              <p>
                Start a new multi-source intelligence gathering session. 
                Inputs are automatically correlated across global databases.
              </p>

              <SearchBar onSearch={handleSearch} onClear={() => setStatus('idle')} loading={status === 'loading'} />

              {status === 'loading' && !results && <InvestigatingState />}
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-md border border-red-100 text-sm mb-6">⚠️ {error}</div>}

              {results && (
                <div className="flex flex-col gap-10 animate-fade-in">
                  <Section title="Investigation Summary" emoji="📝">
                    <div className="notion-card bg-[rgba(242,241,238,0.3)] border-none">
                       <p className="text-sm m-0 italic">"{results.summary}"</p>
                    </div>
                  </Section>

                  {results._type === 'username' ? (
                    <div className="flex flex-col gap-10">
                      <Section title="Social Footprint" emoji="👣">
                        <PlatformGrid footprint={results.platform_footprint} scanResults={results.scoring_breakdown} />
                      </Section>
                      <Section title="Digital Map" emoji="🗺️">
                        <GraphWidget rawData={results} />
                      </Section>
                    </div>
                  ) : results._type === 'domain' ? (
                    <Section title="Infrastructure Overview" emoji="🏗️">
                       <UnifiedDashboard data={results} />
                    </Section>
                  ) : (
                    <UnifiedDashboard data={results} />
                  )}
                  
                  {/* Report Footer */}
                  <div className="mt-20 pt-8 border-t border-[rgba(55,53,47,0.1)] flex justify-between items-center opacity-50">
                    <span className="text-xs font-medium italic">Auto-generated report • Public Data Only</span>
                    <button onClick={() => generatePDF(results)} className="notion-button text-xs">
                      <FileText size={14} /> Download Report
                    </button>
                  </div>
                </div>
              )}

              {status === 'idle' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                   <div className="notion-card group cursor-pointer">
                      <div className="text-2xl mb-2">🔭</div>
                      <h3 className="text-sm">Technical Stack</h3>
                      <p className="text-xs m-0">Identify server-side technologies and frameworks.</p>
                   </div>
                   <div className="notion-card group cursor-pointer">
                      <div className="text-2xl mb-2">🔒</div>
                      <h3 className="text-sm">Spoofing Audit</h3>
                      <p className="text-xs m-0">Verify SPF/DMARC records and email security.</p>
                   </div>
                   <div className="notion-card group cursor-pointer">
                      <div className="text-2xl mb-2">🕰️</div>
                      <h3 className="text-sm">History Lookup</h3>
                      <p className="text-xs m-0">Fetch archived snapshots from Wayback Machine.</p>
                   </div>
                   <div className="notion-card group cursor-pointer">
                      <div className="text-2xl mb-2">⛓️</div>
                      <h3 className="text-sm">BTC Intelligence</h3>
                      <p className="text-xs m-0">Audit wallet balances and transaction history.</p>
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="fixed bottom-4 right-4 text-[10px] font-semibold text-[rgba(55,53,47,0.3)] uppercase tracking-widest bg-white/80 px-2 py-1 rounded">
        Holmes Intelligence Protocol v2.1
      </footer>
    </div>
  );
}
