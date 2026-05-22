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
import CorporateIntelWidget from './components/CorporateIntelWidget';
import MobileIntelWidget  from './components/MobileIntelWidget';
import NetworkWidget      from './components/NetworkWidget';
import SecurityWidget     from './components/SecurityWidget';
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
          let fallbackSummary = "Intelligence gathering complete.";
          if (unifiedData.type === 'email' && unifiedData.data?.breaches) {
             fallbackSummary = unifiedData.data.breaches.status === 'compromised' 
               ? `CRITICAL: ${unifiedData.data.breaches.breach_count} data breaches detected for this email address.`
               : "SECURE: No known data breaches detected for this email.";
          } else if (unifiedData.type === 'network') {
             fallbackSummary = "Network infrastructure mapped and port scan completed successfully.";
          } else if (unifiedData.data?.summary) {
             fallbackSummary = unifiedData.data.summary;
          }

          setResults({ 
             ...unifiedData, 
             username: queryValue, 
             _type: unifiedData.type,
             summary: fallbackSummary
          });
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

        
        <div className="mt-10 text-[11px] font-bold text-slate-500 uppercase px-4 mb-3 tracking-widest">Active Modules</div>
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[300px] custom-scrollbar">
           <SidebarItem icon={ShieldCheck} label="Spoofing Audit" active={view === 'spoofing'} onClick={() => setView('spoofing')} />
           <SidebarItem icon={Code2} label="Tech Stack" active={view === 'techstack'} onClick={() => setView('techstack')} />
           <SidebarItem icon={History} label="History Lookup" active={view === 'archive'} onClick={() => setView('archive')} />
           <SidebarItem icon={Camera} label="EXIF Forensic" active={view === 'exif'} onClick={() => setView('exif')} />
           <SidebarItem icon={MapPin} label="WIFI Geolocation" active={view === 'geoint'} onClick={() => setView('geoint')} />
           <SidebarItem icon={Hash} label="BTC Intelligence" active={view === 'crypto'} onClick={() => setView('crypto')} />
           <SidebarItem icon={Globe} label="Threat Intel" active={view === 'threat'} onClick={() => setView('threat')} />
           <SidebarItem icon={ShieldCheck} label="Certificates" active={view === 'certificates'} onClick={() => setView('certificates')} />
           <SidebarItem icon={Activity} label="Trackers" active={view === 'trackers'} onClick={() => setView('trackers')} />
           <SidebarItem icon={User} label="Friendship Graph" active={view === 'friendship'} onClick={() => setView('friendship')} />
           <SidebarItem icon={Database} label="Corporate Intel" active={view === 'corporate'} onClick={() => setView('corporate')} />
           <SidebarItem icon={Activity} label="Mobile Recon" active={view === 'mobile'} onClick={() => setView('mobile')} />
           <SidebarItem icon={Layers} label="Network Intel" active={view === 'network'} onClick={() => setView('network')} />
           <SidebarItem icon={ShieldCheck} label="Security Check" active={view === 'security'} onClick={() => setView('security')} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="notion-main">
        <div className="max-w-[840px] mx-auto">
          {view === 'spoofing' ? (
            <SpoofingWidget />
          ) : view === 'techstack' ? (
            <TechStackWidget />
          ) : view === 'archive' ? (
            <ArchiveWidget />
          ) : view === 'crypto' ? (
            <CryptoWidget />
          ) : view === 'exif' ? (
            <ExifWidget />
          ) : view === 'geoint' ? (
            <GeoIntWidget />
          ) : view === 'threat' ? (
            <ThreatIntelWidget />
          ) : view === 'certificates' ? (
            <CertificatesWidget />
          ) : view === 'trackers' ? (
            <TrackersWidget />
          ) : view === 'friendship' ? (
            <FriendshipWidget />
          ) : view === 'corporate' ? (
            <CorporateIntelWidget />
          ) : view === 'mobile' ? (
            <MobileIntelWidget />
          ) : view === 'network' ? (
            <NetworkWidget />
          ) : view === 'security' ? (
            <SecurityWidget />
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
                   <div onClick={() => setView('techstack')} className="notion-card group cursor-pointer flex flex-col justify-between min-h-[160px] h-full p-6 hover:bg-white/5 transition-colors border border-white/5 hover:border-white/20">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 mb-5 group-hover:scale-110 transition-transform">
                        <Code2 size={24} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-1.5">Technical Stack</h3>
                        <p className="text-sm text-slate-400 leading-relaxed m-0">Identify server-side technologies and frameworks.</p>
                      </div>
                   </div>
                   <div onClick={() => setView('spoofing')} className="notion-card group cursor-pointer flex flex-col justify-between min-h-[160px] h-full p-6 hover:bg-white/5 transition-colors border border-white/5 hover:border-white/20">
                      <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20 mb-5 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} className="text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-1.5">Spoofing Audit</h3>
                        <p className="text-sm text-slate-400 leading-relaxed m-0">Verify SPF/DMARC records and email security.</p>
                      </div>
                   </div>
                   <div onClick={() => setView('archive')} className="notion-card group cursor-pointer flex flex-col justify-between min-h-[160px] h-full p-6 hover:bg-white/5 transition-colors border border-white/5 hover:border-white/20">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 mb-5 group-hover:scale-110 transition-transform">
                        <History size={24} className="text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-1.5">History Lookup</h3>
                        <p className="text-sm text-slate-400 leading-relaxed m-0">Fetch archived snapshots from Wayback Machine.</p>
                      </div>
                   </div>
                   <div onClick={() => setView('crypto')} className="notion-card group cursor-pointer flex flex-col justify-between min-h-[160px] h-full p-6 hover:bg-white/5 transition-colors border border-white/5 hover:border-white/20">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 mb-5 group-hover:scale-110 transition-transform">
                        <Hash size={24} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-1.5">BTC Intelligence</h3>
                        <p className="text-sm text-slate-400 leading-relaxed m-0">Audit wallet balances and transaction history.</p>
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
