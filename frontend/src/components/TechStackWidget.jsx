import React, { useState } from 'react';
import { Code2, Search, Globe, ShieldCheck, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const TechStackWidget = () => {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/techstack/?domain=${domain}`);
      const result = await response.json();
      if (result.status === 'success') {
        setData(result);
      } else {
        setError('Stack not found');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neo-card p-5 flex flex-col gap-5">
      <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
        <div className="w-8 h-8 flex items-center justify-center border-2 border-black bg-indigo-500">
          <Code2 size={16} color="#fff" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest">Tech Stack Audit</h3>
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
          <div className="flex flex-wrap gap-2">
            {data.technologies?.map((tech, i) => (
              <div key={i} className="px-2 py-1 border-2 border-black bg-white text-[10px] font-black uppercase text-indigo-600 shadow-[2px_2px_0px_#000]">
                {tech}
              </div>
            ))}
            {(!data.technologies || data.technologies.length === 0) && (
              <div className="text-[10px] font-black text-slate-400 uppercase italic">No stack data detected.</div>
            )}
          </div>
          <div className="p-3 bg-indigo-50 border-2 border-black flex items-center gap-2">
             <ShieldCheck size={14} className="text-indigo-600" />
             <span className="text-[9px] font-black uppercase text-indigo-700">Wappalyzer Protocol Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechStackWidget;
