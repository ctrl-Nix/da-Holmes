import React, { useState } from 'react';
import { Code2, Search, Globe, Server, Layers, ShoppingBag, BarChart2, Box, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const CATEGORY_CONFIG = {
  'Server': { icon: Server, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  'Runtime': { icon: Code2, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  'CMS': { icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  'Framework': { icon: Code2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  'Library': { icon: Box, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  'CDN / Security': { icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'Hosting': { icon: Server, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  'Cloud': { icon: Globe, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  'E-commerce': { icon: ShoppingBag, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  'Analytics': { icon: BarChart2, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  'Backend': { icon: Server, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
};

function getConfig(type) {
  return CATEGORY_CONFIG[type] || { icon: Code2, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
}

function ConfidenceBar({ value }) {
  const pct = Math.min(value || 0, 100);
  let color = 'bg-slate-500';
  if (pct >= 90) color = 'bg-gradient-to-r from-emerald-500 to-cyan-500';
  else if (pct >= 75) color = 'bg-gradient-to-r from-blue-500 to-cyan-500';
  else if (pct >= 60) color = 'bg-gradient-to-r from-amber-500 to-yellow-500';
  return (
    <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const TechStackWidget = () => {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/techstack?domain=${encodeURIComponent(domain)}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // Group technologies by type
  const grouped = {};
  if (data?.technologies) {
    for (const tech of data.technologies) {
      if (!grouped[tech.type]) grouped[tech.type] = [];
      grouped[tech.type].push(tech);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto my-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
          <Code2 size={24} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Tech Stack Fingerprint</h1>
          <p className="text-sm text-slate-400 mt-0.5">Detect 25+ technologies from headers and HTML</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="search-container flex items-center gap-2">
        <Globe size={16} className="text-slate-500 flex-shrink-0" />
        <input
          className="notion-input text-sm"
          placeholder="Enter domain (e.g. github.com, shopify.com)..."
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleScan()}
        />
        <button
          onClick={handleScan}
          disabled={loading}
          className="notion-button-primary px-5 py-1.5 text-xs whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="glass-panel rounded-xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="text-indigo-400 animate-spin" size={32} />
          <p className="text-slate-400 text-sm">Fingerprinting {domain}...</p>
          <p className="text-slate-600 text-xs font-mono">Analyzing headers, HTML body, and meta tags</p>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Summary Banner */}
          <div className="glass-panel rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <Code2 size={18} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-0.5">Fingerprint Complete</div>
              <div className="font-mono text-slate-200 font-bold">{data.domain}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-indigo-400">{data.total || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">detected</div>
            </div>
          </div>

          {data.total === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center">
              <Code2 size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No technologies identified.</p>
              <p className="text-slate-600 text-xs mt-1">
                {data.error ? `Error: ${data.error}` : 'Target may be using obfuscation or blocking our scanner.'}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([type, techs]) => {
              const config = getConfig(type);
              const Icon = config.icon;
              return (
                <div key={type} className="glass-panel rounded-xl overflow-hidden border border-white/5">
                  {/* Category Header */}
                  <div className={`flex items-center gap-2 px-5 py-3 border-b border-white/5 ${config.bg}`}>
                    <Icon size={14} className={config.color} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>{type}</span>
                    <span className="text-[9px] text-slate-600 ml-auto font-mono">{techs.length} detected</span>
                  </div>

                  {/* Tech Items */}
                  <div className="divide-y divide-white/5">
                    {techs.map((tech, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors group">
                        <div className={`w-2 h-2 rounded-full ${config.bg} border ${config.border} flex-shrink-0`} style={{ background: undefined }}>
                          <div className={`w-full h-full rounded-full ${config.color.replace('text-', 'bg-')} opacity-70`} />
                        </div>
                        <span className="flex-1 text-sm font-semibold text-slate-200">{tech.name}</span>
                        {tech.confidence && (
                          <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <ConfidenceBar value={tech.confidence} />
                            <span className="text-[9px] text-slate-500 font-mono w-8 text-right">{tech.confidence}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default TechStackWidget;
