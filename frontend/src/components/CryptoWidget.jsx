import React, { useState } from 'react';
import { Hash, Search, ExternalLink, AlertTriangle, Activity } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const CryptoWidget = () => {
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/crypto/btc/${address}`);
      const result = await response.json();
      if (result.status === 'success') {
        setData(result);
      } else {
        setError('Query failed');
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
          <Hash size={16} color="#fff" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest">BTC Intel</h3>
      </div>

      <div className="flex gap-0 border-4 border-black shadow-[3px_3px_0px_#000]">
        <input 
          className="flex-1 px-4 py-2 text-xs font-black outline-none uppercase" 
          placeholder="ADDRESS..." 
          value={address} 
          onChange={(e) => setAddress(e.target.value)}
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
            <div className="border-2 border-black p-2 bg-indigo-50">
              <span className="block text-[8px] font-black uppercase text-indigo-400 mb-1">Balance</span>
              <span className="block text-xs font-black text-indigo-700">{data.balance_btc} BTC</span>
            </div>
            <div className="border-2 border-black p-2 bg-slate-50">
              <span className="block text-[8px] font-black uppercase text-slate-400 mb-1">TX Count</span>
              <span className="block text-xs font-black text-black">{data.tx_count}</span>
            </div>
          </div>
          <div className="p-3 border-2 border-black bg-slate-50">
            <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase text-slate-400">
              <Activity size={12} /> Recent Activity
            </div>
            <div className="flex flex-col gap-1">
              {data.recent_txs?.slice(0, 2).map((tx, i) => (
                <div key={i} className="text-[8px] font-mono break-all text-slate-500 border-l-2 border-indigo-500 pl-2">
                  {tx}
                </div>
              ))}
            </div>
          </div>
          <a 
            href={data.explorer_url} 
            target="_blank" 
            rel="noreferrer"
            className="neo-button text-[9px] py-1 bg-black text-white"
          >
            <ExternalLink size={10} /> View in Explorer
          </a>
        </div>
      )}
    </div>
  );
};

export default CryptoWidget;
