import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function EthicsModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button/Badge */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[9px] uppercase tracking-widest font-bold text-amber-500 hover:bg-amber-500/20 transition-colors"
      >
        <ShieldAlert size={12} />
        Ethical OSINT Policy
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 max-w-md w-full relative shadow-[0_0_50px_rgba(245,158,11,0.15)]">
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-amber-500 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
              <ShieldAlert className="text-amber-500" size={28} />
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-200">
                Ethical Use Policy
              </h3>
            </div>

            <div className="flex flex-col gap-4 text-sm text-slate-400 leading-relaxed font-mono">
              <p>
                <strong>da Holmes</strong> is engineered exclusively for authorized security research, threat intelligence, and digital forensics.
              </p>
              <p className="pl-3 border-l-2 border-amber-500/50">
                All data extracted and visualized within this tool is sourced dynamically from <span className="text-amber-400 font-bold">publicly available information (OSINT)</span>.
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-2">
                <li>No authenticated endpoints are breached.</li>
                <li>No security controls (CAPTCHAs, WAFs) are bypassed.</li>
                <li>No exfiltrated data is persistently stored on this server.</li>
              </ul>
              <p className="mt-2 text-xs text-slate-500 italic text-center">
                By utilizing this tool and generating reports, you accept responsibility for complying with all applicable privacy regulations.
              </p>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="w-full mt-6 py-2 bg-amber-500 text-slate-900 font-black tracking-widest uppercase rounded hover:bg-amber-400 transition-colors"
            >
              Acknowledge
            </button>

          </div>
        </div>
      )}
    </>
  );
}
