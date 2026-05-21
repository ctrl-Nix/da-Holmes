import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, Loader2, Calendar, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';

export default function CorporateIntelWidget({ domain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusDetail, setStatusDetail] = useState(null);

  useEffect(() => {
    if (!domain) {
      setData(null);
      setError(null);
      setStatusDetail(null);
      return;
    }

    const fetchCorporateIntel = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      setStatusDetail(null);

      // Clean the domain to extract a search query (e.g. apple.com -> apple)
      const query = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/corporate-intel/${encodeURIComponent(query)}`);
        
        if (response.status === 404) {
          setError(`No legal entity matched for "${query}"`);
          return;
        }

        if (response.status === 503) {
          const errData = await response.json();
          setError(errData.detail || "Database lookup requires API configuration.");
          setStatusDetail("503");
          return;
        }

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Corporate Intel fetch error:", err);
        setError("Reconnaissance lookup failed or timed out.");
      } finally {
        setLoading(false);
      }
    };

    fetchCorporateIntel();
  }, [domain]);

  return (
    <div className="bg-gray-950 border border-cyan-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
            <Building2 size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Corporate Registry</h3>
            <span className="text-[9px] text-slate-500 font-mono tracking-wider">OPENCORPORATES OSINT</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-[9px] font-mono text-cyan-500/80 uppercase">Active</span>
        </div>
      </div>

      {/* Body States */}
      {!domain && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Building2 size={24} className="text-slate-700 mb-2" />
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Awaiting Target Input</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 size={24} className="text-cyan-400 animate-spin mb-2" />
          <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Querying Corporate Registry...</p>
        </div>
      )}

      {error && !loading && (
        <div className={`rounded-lg p-4 flex items-start gap-3 ${statusDetail === "503" ? 'bg-amber-950/20 border border-amber-900/50' : 'bg-rose-950/20 border border-rose-900/50'}`}>
          <AlertTriangle className={statusDetail === "503" ? 'text-amber-500 shrink-0 mt-0.5' : 'text-rose-500 shrink-0 mt-0.5'} size={16} />
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${statusDetail === "503" ? 'text-amber-400' : 'text-rose-400'}`}>
              {statusDetail === "503" ? 'Configuration Required' : 'Scan Offline'}
            </h4>
            <p className="text-[10px] text-slate-400 font-mono leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4 animate-fade-in">
          {/* Legal Name */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
            <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Registered Legal Name</span>
            <div className="text-sm font-bold text-slate-200 font-mono leading-tight">{data.company_name}</div>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Jurisdiction Code</span>
              <span className="text-xs font-bold text-cyan-400 font-mono block uppercase">{data.jurisdiction_code || 'Undetermined'}</span>
            </div>

            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg">
              <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Incorporation Date</span>
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs font-bold">
                <Calendar size={12} className="text-slate-500" />
                <span>{data.incorporation_date || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Status and Address details */}
          <div className="space-y-3">
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg flex items-center justify-between">
              <span className="text-[9px] text-slate-500 font-mono uppercase">Status</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${
                data.current_status?.toLowerCase() === 'active' 
                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40' 
                  : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
              }`}>
                {data.current_status || 'Unknown'}
              </span>
            </div>

            {data.registered_address_in_full && (
              <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg">
                <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1.5">Registered Address</span>
                <div className="flex items-start gap-2 text-slate-300 font-mono text-xs leading-relaxed">
                  <MapPin size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>{data.registered_address_in_full}</span>
                </div>
              </div>
            )}
          </div>

          {/* Corporate Intel Banner */}
          <div className="flex items-center gap-2 px-3 py-2 bg-cyan-950/20 border border-cyan-900/50 rounded-lg">
            <CheckCircle size={14} className="text-cyan-400 shrink-0" />
            <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Corporate Record Audited</span>
          </div>
        </div>
      )}
    </div>
  );
}
