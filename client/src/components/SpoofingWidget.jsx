import React from 'react';
import { ShieldCheck, ShieldAlert, Mail } from 'lucide-react';

export default function SpoofingWidget({ spf, dmarc, domain, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <span>🛡️</span> Mail Server Spoofing Audit
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton" style={{ height: '40px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '40px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '40px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '40px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '40px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '40px', borderRadius: '4px' }}></div>
        </div>
      </div>
    );
  }

  const isSpfFound = spf?.status === 'Found';
  const isDmarcFound = dmarc?.status === 'Found';

  // Basic security posture evaluation
  const rating = isSpfFound && isDmarcFound ? 'SECURE' : 'VULNERABLE';
  const colorClass = rating === 'SECURE' ? 'text-emerald-400 border-emerald-900 bg-emerald-950/20' : 'text-rose-400 border-rose-900 bg-rose-950/20';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <span>🛡️</span> Email Spoofing Defense
        </h3>
        <span className={`text-[10px] border px-2 py-0.5 rounded font-bold uppercase ${colorClass}`}>
          {rating}
        </span>
      </div>

      <div className="space-y-4">
        {/* SPF Analysis */}
        <div className="p-4 bg-gray-950 border border-gray-800 rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mail className="text-cyan-400 w-4 h-4" />
              <span className="text-xs font-bold text-white font-mono uppercase">SPF Configuration</span>
            </div>
            {isSpfFound ? (
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> FOUND
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> MISSING
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
            SPF records designate which mail servers are authorized to send email for this domain.
          </p>
          {isSpfFound && spf.record ? (
            <div className="p-2 bg-gray-900 rounded border border-gray-850 text-[10.5px] font-mono text-emerald-300 break-all select-text">
              {spf.record}
            </div>
          ) : (
            <div className="p-2 bg-rose-950/10 border border-rose-900/30 rounded text-[10.5px] text-rose-400 italic">
              Critical Warning: Unauthorized mail servers can spoof sending from this domain.
            </div>
          )}
        </div>

        {/* DMARC Analysis */}
        <div className="p-4 bg-gray-950 border border-gray-800 rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mail className="text-cyan-400 w-4 h-4" />
              <span className="text-xs font-bold text-white font-mono uppercase">DMARC Configuration</span>
            </div>
            {isDmarcFound ? (
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> FOUND
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> MISSING
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
            DMARC defines how receiving servers should handle emails that fail SPF or DKIM validation.
          </p>
          {isDmarcFound && dmarc.record ? (
            <div className="p-2 bg-gray-900 rounded border border-gray-850 text-[10.5px] font-mono text-emerald-300 break-all select-text">
              {dmarc.record}
            </div>
          ) : (
            <div className="p-2 bg-rose-950/10 border border-rose-900/30 rounded text-[10.5px] text-rose-400 italic">
              Critical Warning: No spoofing enforcement policy detected. Actionable monitoring reports are disabled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
