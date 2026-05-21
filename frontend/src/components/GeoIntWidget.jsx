import React, { useState } from 'react';
import { MapPin, Search, ExternalLink, AlertTriangle, Globe } from 'lucide-react';

const GeoIntWidget = () => {
  const [bssid, setBssid] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!bssid) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/geoint/wifi/${bssid}`);
      const result = await response.json();
      if (result.status === 'success') {
        setData(result);
      } else {
        setError('Location not found');
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
        <div className="w-8 h-8 flex items-center justify-center border-2 border-black bg-rose-500">
          <MapPin size={16} color="#fff" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest">WIFI Geo-Pivot</h3>
      </div>

      <div className="flex gap-0 border-4 border-black shadow-[3px_3px_0px_#000]">
        <input 
          className="flex-1 px-4 py-2 text-xs font-black outline-none uppercase" 
          placeholder="BSSID..." 
          value={bssid} 
          onChange={(e) => setBssid(e.target.value)}
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
        <div className="flex flex-col gap-4 animate-fade-in-up">
          <div className="border-2 border-black p-3 bg-rose-50">
             <div className="flex flex-col border-l-4 border-rose-500 pl-2 mb-2">
                <span className="text-[8px] font-black uppercase text-rose-400">Approx Address</span>
                <span className="text-[10px] font-black text-black">{data.road}, {data.city}</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border-2 border-black p-2 text-center">
                   <span className="block text-[8px] font-black uppercase text-slate-400">LAT</span>
                   <span className="text-[10px] font-black">{data.lat?.toFixed(5)}</span>
                </div>
                <div className="bg-white border-2 border-black p-2 text-center">
                   <span className="block text-[8px] font-black uppercase text-slate-400">LON</span>
                   <span className="text-[10px] font-black">{data.lon?.toFixed(5)}</span>
                </div>
             </div>
          </div>
          <div className="flex flex-col gap-2">
            <a 
              href={`https://www.google.com/maps?q=${data.lat},${data.lon}`} 
              target="_blank" 
              rel="noreferrer"
              className="neo-button text-[9px] py-2 bg-indigo-500 text-white justify-between"
            >
              <span>Google Maps</span>
              <ExternalLink size={12} />
            </a>
            <a 
              href={`https://yandex.com/maps/?ll=${data.lon},${data.lat}&z=19&l=sat`} 
              target="_blank" 
              rel="noreferrer"
              className="neo-button text-[9px] py-2 bg-black text-white justify-between"
            >
              <span>Yandex Satellite</span>
              <Globe size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeoIntWidget;
