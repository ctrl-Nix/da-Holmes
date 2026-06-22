import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Loader2, Globe, CheckCircle2, XCircle, Info } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const GRADE_CONFIG = {
  A: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]' },
  B: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.15)]' },
  C: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]' },
  D: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]' },
  F: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]' },
};

function ScoreBar({ score }) {
  const pct = Math.min(score, 100);
  let barColor = 'bg-gradient-to-r from-red-500 to-orange-500';
  if (pct >= 85) barColor = 'bg-gradient-to-r from-emerald-500 to-cyan-500';
  else if (pct >= 70) barColor = 'bg-gradient-to-r from-cyan-500 to-blue-500';
  else if (pct >= 50) barColor = 'bg-gradient-to-r from-amber-500 to-yellow-500';
  else if (pct >= 30) barColor = 'bg-gradient-to-r from-orange-500 to-amber-500';

  return (
    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SecurityWidget() {
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState('headers'); // 'headers' | 'breach'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runScan = async (e) => {
    e.preventDefault();
    const target = mode === 'headers' ? domain : email;
    if (!target) return;

    setLoading(true);
    setResult(null);
    setError('');

    try {
      let url;
      if (mode === 'headers') {
        url = `${API_BASE_URL}/api/security/headers?domain=${encodeURIComponent(target)}`;
      } else {
        url = `${API_BASE_URL}/api/security/check?email=${encodeURIComponent(target)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        setResult({ mode, data: await res.json() });
      } else {
        setError('Scan failed. Try a different target.');
      }
    } catch (err) {
      setError('Connection to scanner failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto my-6 animate-fade-in">
      {/* Title */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <Shield size={24} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Security Audit</h1>
          <p className="text-sm text-slate-400 mt-0.5">HTTP security headers scorecard & email breach check</p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        <button
          onClick={() => { setMode('headers'); setResult(null); setError(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'headers' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Globe size={13} /> Security Headers
        </button>
        <button
          onClick={() => { setMode('breach'); setResult(null); setError(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'breach' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <ShieldAlert size={13} /> Breach Check
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={runScan} className="relative flex items-center group">
        {mode === 'headers'
          ? <Globe className="absolute left-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" size={18} />
          : <ShieldAlert className="absolute left-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" size={18} />
        }
        <input
          key={mode}
          type={mode === 'breach' ? 'email' : 'text'}
          value={mode === 'headers' ? domain : email}
          onChange={e => mode === 'headers' ? setDomain(e.target.value) : setEmail(e.target.value)}
          placeholder={mode === 'headers' ? 'Enter domain (e.g. example.com)...' : 'Enter email to check for breaches...'}
          className={`w-full bg-slate-900/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-600 rounded-lg pl-12 pr-32 py-3 focus:outline-none transition-all shadow-inner ${mode === 'headers' ? 'focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50' : 'focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50'}`}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`absolute right-2 px-4 py-1.5 rounded font-bold text-[10px] tracking-widest uppercase transition-colors border flex items-center gap-2 disabled:opacity-50 ${mode === 'headers' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20'}`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Audit'}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-sm">
          <XCircle size={15} /> {error}
        </div>
      )}

      {/* Security Headers Result */}
      {result?.mode === 'headers' && result?.data && (
        <div className={`rounded-xl border transition-all duration-500 overflow-hidden ${GRADE_CONFIG[result.data.grade]?.border} ${GRADE_CONFIG[result.data.grade]?.glow}`}>
          {/* Grade Header */}
          <div className={`flex items-center gap-5 p-6 ${GRADE_CONFIG[result.data.grade]?.bg}`}>
            <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center ${GRADE_CONFIG[result.data.grade]?.border} ${GRADE_CONFIG[result.data.grade]?.bg}`}>
              <span className={`text-5xl font-black ${GRADE_CONFIG[result.data.grade]?.color}`}>{result.data.grade}</span>
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Security Score</div>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-3xl font-black ${GRADE_CONFIG[result.data.grade]?.color}`}>{result.data.score}</span>
                <span className="text-slate-500 text-sm mb-1">/ 100</span>
              </div>
              <ScoreBar score={result.data.score} />
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-slate-400">{result.data.domain}</div>
              <div className="text-[10px] text-slate-600 mt-1">
                {result.data.headers?.filter(h => h.present).length} / {result.data.headers?.length} headers present
              </div>
            </div>
          </div>

          {/* Header Checks */}
          <div className="divide-y divide-white/5">
            {result.data.headers?.map((h, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-white/2 transition-colors group">
                {h.present
                  ? <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                  : <XCircle size={16} className="text-red-400/60 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${h.present ? 'text-slate-200' : 'text-slate-500'}`}>{h.name}</span>
                    <span className="text-[9px] text-slate-600 font-mono">(+{h.weight}pts)</span>
                  </div>
                  {h.value && (
                    <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5" title={h.value}>{h.value}</div>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] text-slate-600 max-w-[140px] text-right">
                  <Info size={9} className="flex-shrink-0" />
                  <span>{h.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breach Check Result */}
      {result?.mode === 'breach' && result?.data && (
        <div className={`rounded-xl p-6 border transition-all duration-500 backdrop-blur-sm ${
          result.data.status === 'compromised'
            ? 'bg-rose-950/20 border-rose-900/50 shadow-[0_0_40px_rgba(225,29,72,0.15)]'
            : 'bg-emerald-950/20 border-emerald-900/50 shadow-[0_0_40px_rgba(16,185,129,0.1)]'
        }`}>
          <div className="flex items-center gap-5 mb-5 pb-5 border-b border-slate-800/60">
            {result.data.status === 'compromised'
              ? <ShieldAlert className="text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]" size={38} />
              : <ShieldCheck className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" size={38} />
            }
            <div className="flex-col flex">
              <h2 className={`text-lg font-black uppercase tracking-widest ${result.data.status === 'compromised' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {result.data.status === 'compromised' ? 'Breach Detected' : result.data.status === 'safe' ? 'No Known Breaches' : 'Status Unknown'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono tracking-wide mt-1">{result.data.email}</p>
            </div>
            {result.data.status === 'compromised' && (
              <div className="ml-auto text-center px-4 py-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <span className="block text-2xl font-black text-rose-500 leading-none">{result.data.breach_count}</span>
                <span className="text-[9px] uppercase tracking-widest text-rose-400 font-bold">Leaks</span>
              </div>
            )}
          </div>

          {result.data.status === 'compromised' && result.data.details?.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                Exfiltrated Sources
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.data.details.map((breach, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-3 rounded-md border border-slate-800/60 hover:border-rose-500/30 transition-colors group">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300 group-hover:text-rose-300 transition-colors">{breach.name}</span>
                      {breach.date && <span className="text-[9px] text-slate-500 font-mono">{breach.date}</span>}
                    </div>
                    {breach.domain && <div className="text-[9px] text-slate-600 mt-0.5">{breach.domain}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.data.note && (
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400/70 font-mono">
              <Info size={12} /> {result.data.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
