import React, { useState } from 'react';
import { Shield, Search, Info, AlertTriangle } from 'lucide-react';

const CertificatesWidget = () => {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/certificates/?domain=${domain}`);
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
        <div className="w-8 h-8 flex items-center justify-center border-2 border-black bg-cyan-500">
          <Shield size={16} color="#fff" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest">SSL/TLS Certs</h3>
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
          <div className="border-2 border-black p-3 bg-cyan-50">
            <div className="flex justify-between items-center mb-2 border-b border-cyan-200 pb-1">
              <span className="text-[9px] font-black uppercase text-slate-500">Issuer</span>
              <span className="text-[10px] font-black text-cyan-700 truncate ml-4">{data.issuer || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-slate-500">Valid Until</span>
              <span className="text-[10px] font-black text-indigo-700">{data.expiry_date || 'N/A'}</span>
            </div>
          </div>
          <div className="p-3 border-2 border-black bg-slate-50 text-[9px] font-black uppercase leading-tight text-slate-400 italic">
            <Info size={12} className="inline mr-1" />
            Certificates provide insight into infrastructure ownership and history.
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesWidget;
