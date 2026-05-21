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

import { API_BASE_URL } from './utils/api';

const API_BASE = API_BASE_URL;

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
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all ${
        active 
        ? 'bg-blue-500/10 text-cyan-400 border border-blue-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
      }`}
    >
      <Icon size={18} className={active ? 'text-cyan-400' : 'text-slate-500'} />
      <span>{label}</span>
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
    <div className="mb-12 w-full max-w-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
        <div className="search-container flex items-center gap-3">
          <div className="relative">
            <button 
              type="button"
              onClick={() => setCatOpen(!catOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition-colors"
            >
              <span>{category.emoji}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {catOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-[#111827] border border-white/10 rounded-xl shadow-2xl min-w-[160px] py-2 backdrop-blur-xl">
                {CATEGORIES.map(cat => (
                  <div 
                    key={cat.value}
                    onClick={() => { setCategory(cat); setCatOpen(false); }}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-400 cursor-pointer transition-colors"
                  >
                    <span>{cat.emoji}</span> {cat.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <input 
            className="notion-input"
            placeholder="Investigate anything — domain, username, email, IP, Bitcoin address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          <span className="text-[10px] bg-blue-500/10 text-cyan-400 border border-blue-500/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider whitespace-nowrap">
            {category.label}
          </span>

          <button 
            type="submit" 
            disabled={loading}
            className="notion-button-primary px-6 py-2 text-sm whitespace-nowrap"
          >
            {loading ? 'Running...' : 'Investigate'}
          </button>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-slate-500 font-medium tracking-wide">⚡ Pro Tip: Try auto-detect mode for best results</span>
          {query && <span onClick={() => { setQuery(''); onClear(); }} className="text-xs text-red-400 cursor-pointer hover:text-red-300 transition-colors">Clear Input</span>}
        </div>
      </form>
    </div>
  );
}


export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const apiUrl = API_BASE_URL;
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
      <aside className="notion-sidebar p-6 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-white/5">
          <HolmesLogo />
          <span className="font-bold text-lg tracking-wide text-white">da Holmes</span>
        </div>
        
        <SidebarItem icon={LayoutGrid} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <SidebarItem icon={Activity} label="Live Feed" active={view === 'graph'} onClick={() => setView('graph')} />
        <SidebarItem icon={Database} label="Intelligence Pool" />
        <SidebarItem icon={FileText} label="Recent Reports" />
        <SidebarItem icon={Settings} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
        
        <div className="mt-10 text-[11px] font-bold text-slate-500 uppercase px-4 mb-3 tracking-widest">Active Modules</div>
        <div className="flex flex-col gap-1">
           <SidebarItem icon={ShieldCheck} label="Spoofing Audit" />
           <SidebarItem icon={Mail} label="Email Search" />
           <SidebarItem icon={Globe} label="Domain Scan" />
           <SidebarItem icon={Camera} label="EXIF Forensic" />
           <SidebarItem icon={MapPin} label="WIFI Geolocation" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="notion-main">
        <div className="max-w-[840px] mx-auto">
          {view === 'settings' ? (
            <ApiVault />
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6 animate-fade-in">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                  <Search size={24} className="text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Investigation Portal</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Start a new multi-source intelligence gathering session. 
                    Inputs are automatically correlated across global databases.
                  </p>
                </div>
              </div>

              <SearchBar onSearch={handleSearch} onClear={() => setStatus('idle')} loading={status === 'loading'} />

              {status === 'loading' && !results && <InvestigatingState />}
              {error && <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-sm mb-6 flex items-center gap-3"><AlertTriangle size={18}/> {error}</div>}

              {results && (
                <div className="flex flex-col gap-10 animate-fade-in">
                  <Section title="Investigation Summary" emoji="📝">
                    <div className="glass-panel rounded-xl p-5">
                       <p className="text-sm m-0 text-cyan-100 font-mono italic leading-relaxed">"{results.summary}"</p>
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
                  <div className="mt-20 pt-8 border-t border-white/10 flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium text-slate-400">Auto-generated report • Public Data Only</span>
                    <button onClick={() => generatePDF(results)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-lg border border-white/10 transition-colors">
                      <FileText size={14} className="text-cyan-400" /> Download Report
                    </button>
                  </div>
                </div>
              )}

              {status === 'idle' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                   <div className="notion-card group cursor-pointer flex flex-col justify-between">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 mb-4 group-hover:scale-110 transition-transform">
                        <Code2 size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-base text-slate-200 mb-1">Technical Stack</h3>
                        <p className="text-xs text-slate-500 leading-relaxed m-0">Identify server-side technologies and frameworks.</p>
                      </div>
                   </div>
                   <div className="notion-card group cursor-pointer flex flex-col justify-between">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20 mb-4 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={20} className="text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-base text-slate-200 mb-1">Spoofing Audit</h3>
                        <p className="text-xs text-slate-500 leading-relaxed m-0">Verify SPF/DMARC records and email security.</p>
                      </div>
                   </div>
                   <div className="notion-card group cursor-pointer flex flex-col justify-between">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 mb-4 group-hover:scale-110 transition-transform">
                        <History size={20} className="text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-base text-slate-200 mb-1">History Lookup</h3>
                        <p className="text-xs text-slate-500 leading-relaxed m-0">Fetch archived snapshots from Wayback Machine.</p>
                      </div>
                   </div>
                   <div className="notion-card group cursor-pointer flex flex-col justify-between">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20 mb-4 group-hover:scale-110 transition-transform">
                        <Hash size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-base text-slate-200 mb-1">BTC Intelligence</h3>
                        <p className="text-xs text-slate-500 leading-relaxed m-0">Audit wallet balances and transaction history.</p>
                      </div>
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="fixed bottom-6 right-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest glass-panel px-4 py-2 rounded-full border border-white/10 shadow-lg">
        Holmes Intelligence Protocol v2.1
      </footer>
    </div>
  );
}
