import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

export default function SecurityWidget() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runScan = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setResult(null);
    try {
      // Calls the FastAPI endpoint
      const response = await fetch(`${API_BASE_URL}/api/security/check?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto my-6">
      {/* Search Input */}
      <form onSubmit={runScan} className="relative flex items-center group">
        <Shield className="absolute left-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Target email (e.g. test@example.com)..."
          className="w-full bg-slate-900/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-600 rounded-lg pl-12 pr-32 py-3 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all shadow-inner"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 px-4 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded font-bold text-[10px] tracking-widest uppercase transition-colors border border-amber-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Scan'}
        </button>
      </form>

      {/* Result Status Shield */}
      {result && (
        <div className={`
          rounded-xl p-6 border transition-all duration-500 backdrop-blur-sm
          ${result.status === 'compromised' 
            ? 'bg-rose-950/20 border-rose-900/50 shadow-[0_0_40px_rgba(225,29,72,0.15)]' 
            : 'bg-emerald-950/20 border-emerald-900/50 shadow-[0_0_40px_rgba(16,185,129,0.1)]'}
        `}>
          <div className="flex items-center gap-5 mb-5 pb-5 border-b border-slate-800/60">
            {result.status === 'compromised' ? (
              <ShieldAlert className="text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]" size={38} />
            ) : (
              <ShieldCheck className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" size={38} />
            )}
            
            <div className="flex flex-col">
              <h2 className={`text-lg font-black uppercase tracking-widest ${result.status === 'compromised' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {result.status === 'compromised' ? 'Breach Detected' : 'Secure'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono tracking-wide mt-1">
                {result.email}
              </p>
            </div>
            
            {result.status === 'compromised' && (
              <div className="ml-auto text-center px-4 py-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <span className="block text-2xl font-black text-rose-500 leading-none">{result.breach_count}</span>
                <span className="text-[9px] uppercase tracking-widest text-rose-400 font-bold">Leaks</span>
              </div>
            )}
          </div>

          {/* Breach List (Sites) */}
          {result.status === 'compromised' && result.details.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                Exfiltrated Sources
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.details.map((breach, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-3 rounded-md border border-slate-800/60 flex flex-col gap-1 hover:border-rose-500/30 transition-colors group">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300 group-hover:text-rose-300 transition-colors">{breach.name}</span>
                      {breach.date && <span className="text-[9px] text-slate-500 font-mono tracking-wide">{breach.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {result.status === 'safe' && (
            <div className="flex justify-center items-center py-4">
              <p className="text-xs text-emerald-400/80 font-mono uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} /> Zero Public Leaks Identified
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
