import React, { useState } from 'react';
import { Globe, Server, MapPin, Activity, Loader2, Database } from 'lucide-react';

export default function NetworkWidget() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runScan = async (e) => {
    e.preventDefault();
    if (!target) return;
    
    setLoading(true);
    setResult(null);
    setError('');
    
    try {
      const response = await fetch(`/api/network/info?target=${encodeURIComponent(target)}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        setError('Network scan failed. Target might be unreachable.');
      }
    } catch (err) {
      console.error("Scan failed", err);
      setError('Connection to scanner failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto my-6">
      {/* Search Input */}
      <form onSubmit={runScan} className="relative flex items-center group">
        <Globe className="absolute left-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Enter target IP or Domain (e.g. 8.8.8.8)..."
          className="w-full bg-slate-900/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-600 rounded-lg pl-12 pr-32 py-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 px-4 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded font-bold text-[10px] tracking-widest uppercase transition-colors border border-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'TRACE'}
        </button>
      </form>

      {error && (
        <div className="text-rose-400 text-xs font-mono text-center bg-rose-950/20 py-2 border border-rose-900/50 rounded">
          {error}
        </div>
      )}

      {/* Result Status Dashboard */}
      {result && result.status !== "error" && (
        <div className="rounded-xl p-6 border bg-slate-950/40 border-slate-800/80 shadow-[0_0_40px_rgba(34,211,238,0.05)] backdrop-blur-md relative overflow-hidden transition-all duration-500">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60">
            <Activity className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" size={24} />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">
              Infrastructure Fingerprint
            </h2>
            <div className="ml-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"></span>
              <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Live</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {/* Left Column: Badges */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Network Identity</h3>
              
              <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 hover:border-cyan-500/30 transition-colors group">
                <Database className="text-slate-500 group-hover:text-cyan-400 transition-colors" size={16} />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">ISP / ASN</span>
                  <span className="text-xs font-mono text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.3)]">{result.isp}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 hover:border-cyan-500/30 transition-colors group">
                <Server className="text-slate-500 group-hover:text-cyan-400 transition-colors" size={16} />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">Reverse DNS Hostname</span>
                  <span className="text-xs font-mono text-cyan-300 truncate drop-shadow-[0_0_5px_rgba(103,232,249,0.3)]" title={result.hostname}>
                    {result.hostname}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Location Card */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Physical Location</h3>
              
              <div className="flex-1 flex flex-col justify-center items-center gap-3 bg-slate-900/60 p-4 rounded-lg border border-slate-800/60 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                {/* Crosshairs graphic */}
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                  <div className="w-px h-full bg-cyan-500"></div>
                  <div className="h-px w-full bg-cyan-500 absolute"></div>
                  <div className="w-16 h-16 border border-cyan-500 rounded-full absolute"></div>
                </div>

                <MapPin className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] z-10 group-hover:-translate-y-1 transition-transform" size={32} />
                
                <div className="text-center z-10 flex flex-col items-center">
                  <span className="text-lg font-bold text-slate-200 uppercase tracking-wider">{result.location}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">
                    [ {result.coordinates[0].toFixed(4)}, {result.coordinates[1].toFixed(4)} ]
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Org Row */}
          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="uppercase tracking-widest">Organization</span>
            <span className="text-slate-300">{result.org}</span>
          </div>

        </div>
      )}
    </div>
  );
}
