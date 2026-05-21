import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const MESSAGES = [
  'Searching the archives...',
  'Tracing digital footprints...',
  'Running heuristics...',
  'Cross-referencing platforms...',
  'Compiling intelligence brief...',
  'Analyzing behavioral patterns...',
];

export default function InvestigatingState() {
  const [msgIdx, setMsgIdx]     = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 animate-fade-in">
      <div className="flex items-center justify-center w-12 h-12 bg-[rgba(55,53,47,0.03)] rounded-full border border-[rgba(55,53,47,0.05)]">
        <Loader2 className="text-[rgba(55,53,47,0.2)] animate-spin" size={24} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold text-[#37352f] transition-all duration-500">
          {MESSAGES[msgIdx]}
        </p>
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-bold text-[rgba(55,53,47,0.4)] uppercase tracking-widest">
             Engine Active
           </span>
        </div>
      </div>

      <div className="w-48 h-1 bg-[rgba(55,53,47,0.05)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-1000 ease-out"
          style={{ width: `${((msgIdx + 1) / MESSAGES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
