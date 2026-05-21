import React, { useState, useEffect } from 'react';
import { Smartphone, AlertTriangle, Loader2, Star, CheckCircle, ShieldAlert } from 'lucide-react';

export default function MobileIntelWidget({ domain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!domain) {
      setData(null);
      setError(null);
      return;
    }

    const fetchMobileIntel = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      // Clean the domain to extract a search query (e.g. apple.com -> apple)
      const query = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/mobile-recon/${encodeURIComponent(query)}`);
        
        if (response.status === 404) {
          setError(`No mobile app footprint detected for "${query}"`);
          return;
        }

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Mobile Recon fetch error:", err);
        setError("Reconnaissance scan failed or timed out.");
      } finally {
        setLoading(false);
      }
    };

    fetchMobileIntel();
  }, [domain]);

  return (
    <div className="bg-gray-950 border border-emerald-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
            <Smartphone size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Mobile App Recon</h3>
            <span className="text-[9px] text-slate-500 font-mono tracking-wider">STORE FOOTPRINT</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[9px] font-mono text-emerald-500/80 uppercase">Active</span>
        </div>
      </div>

      {/* Body States */}
      {!domain && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Smartphone size={24} className="text-slate-700 mb-2" />
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Awaiting Target Input</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 size={24} className="text-emerald-400 animate-spin mb-2" />
          <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">Querying Play Store...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-950/20 border border-rose-900/50 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
          <div>
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Scan Offline</h4>
            <p className="text-[10px] text-slate-400 font-mono">{error}</p>
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Info */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
            <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Official Title</span>
            <div className="text-sm font-bold text-slate-200 truncate font-mono">{data.title}</div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Bundle ID (appId)</span>
              <span className="text-xs font-bold text-emerald-400 font-mono break-all leading-tight">{data.appId}</span>
            </div>
            
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Developer</span>
              <span className="text-xs font-bold text-slate-300 font-mono truncate block">{data.developer}</span>
            </div>

            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Rating</span>
              <div className="flex items-center gap-1.5">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-slate-200 font-mono">{data.score ? data.score.toFixed(2) : 'N/A'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Installs</span>
              <span className="text-xs font-bold text-slate-200 font-mono block">{data.installs || 'Unknown'}</span>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/20 border border-emerald-900/50 rounded-lg">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">Play Store Footprint Verified</span>
          </div>
        </div>
      )}
    </div>
  );
}
