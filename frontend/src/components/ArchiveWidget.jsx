import React, { useState } from 'react';
import { History, Search, ExternalLink, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const ArchiveWidget = () => {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/archive/?domain=${domain}`);
      const result = await response.json();
      if (result.status === 'success') {
        setData(result);
      } else {
        setError('Archive error');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neo-card p-5 flex flex-col gap-5">
      <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
        <div className="w-8 h-8 flex items-center justify-center border-2 border-black bg-indigo-500">
          <History size={16} color="#fff" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest">Wayback Snapshots</h3>
      </div>

      <div className="flex gap-0 border-4 border-black shadow-[3px_3px_0px_#000]">
        <input 
          className="flex-1 px-4 py-2 text-xs font-black outline-none uppercase" 
          placeholder="DOMAIN..." 
          value={domain} 
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
        />
        <button 
          className="bg-black text-white px-4 py-2 font-black text-[10px] uppercase hover:bg-slate-800 border-l-4 border-black flex items-center gap-2" 
          onClick={handleScan} 
          disabled={loading}
        >
          {loading ? '...' : <Search size={14} />}
        </button>
      </div>

      {error && <div className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2"><AlertTriangle size={12}/> {error}</div>}

      {data && (
        <div className="flex flex-col gap-3 animate-fade-in-up">
          <div className="border-2 border-black p-3 flex justify-between items-center bg-slate-50">
            <span className="text-[9px] font-black uppercase text-slate-400">Total Samples</span>
            <span className="text-lg font-black text-indigo-600">{data.snapshots?.length || 0}</span>
          </div>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {data.snapshots?.slice(0, 5).map((snap, i) => (
              <a 
                key={i}
                href={snap.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 border-2 border-black text-[9px] font-black hover:bg-indigo-50 transition-colors uppercase"
              >
                <span>{snap.timestamp}</span>
                <ExternalLink size={10} />
              </a>
            ))}
            {(!data.snapshots || data.snapshots.length === 0) && (
              <div className="text-center py-4 text-[10px] font-black text-slate-400 uppercase italic">No history found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveWidget;
