import React, { useState } from 'react';
import { Target, Search, Info, AlertTriangle } from 'lucide-react';

const TrackersWidget = () => {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/trackers/?domain=${domain}`);
      const result = await response.json();
      if (result.status === 'success') {
        setData(result);
      } else {
        setError('API Error');
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
          <Target size={16} color="#fff" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest">Ad/Analytic IDs</h3>
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
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'G-Ads', val: data.google_ads },
              { label: 'G-Analytics', val: data.google_analytics },
              { label: 'FB Pixel', val: data.facebook_pixel },
              { label: 'Twitter', val: data.twitter_id }
            ].map(id => (
              <div key={id.label} className="border-2 border-black p-2 bg-slate-50">
                <span className="block text-[8px] font-black uppercase text-slate-400 leading-none mb-1">{id.label}</span>
                <span className="block text-[10px] font-black text-indigo-700 truncate">{id.val || 'NONE'}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] font-black uppercase text-slate-400 italic">
            <Info size={10} className="inline mr-1" />
            Tracker IDs can reveal shared ownership across different domains.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackersWidget;
