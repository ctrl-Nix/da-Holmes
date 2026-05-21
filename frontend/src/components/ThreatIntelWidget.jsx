import React, { useState } from 'react';
import { ShieldAlert, Search, Info, AlertTriangle } from 'lucide-react';

const ThreatIntelWidget = () => {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/threatintel/?domain=${domain}`);
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
    <div className="notion-card flex flex-col gap-5">
      <div className="flex items-center gap-2 border-b border-[rgba(55,53,47,0.1)] pb-3">
        <span className="text-xl">🦠</span>
        <h3 className="text-sm font-bold m-0">AlienVault OTX Threat Intel</h3>
      </div>

      <div className="flex gap-2">
        <input 
          className="notion-input flex-1" 
          placeholder="Enter domain..." 
          value={domain} 
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
        />
        <button 
          className="notion-button text-xs" 
          onClick={handleScan} 
          disabled={loading}
        >
          {loading ? '...' : 'Scan OTX'}
        </button>
      </div>

      {error && <div className="text-xs text-red-500">⚠️ {error}</div>}

      {data && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <div className="p-4 bg-[rgba(55,53,47,0.03)] rounded-lg text-center">
            <span className="text-[10px] font-bold text-[rgba(55,53,47,0.4)] uppercase block mb-1">Malicious Pulses</span>
            <span className={`text-2xl font-bold ${data.malicious_flags > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {data.malicious_flags}
            </span>
          </div>
          <div className="p-4 bg-[rgba(55,53,47,0.03)] rounded-lg text-center">
            <span className="text-[10px] font-bold text-[rgba(55,53,47,0.4)] uppercase block mb-1">Threat Score</span>
            <span className={`text-2xl font-bold ${data.threat_score > 30 ? 'text-red-500' : 'text-blue-500'}`}>
              {data.threat_score}/100
            </span>
          </div>
          <div className="col-span-2 p-3 bg-white border border-[rgba(55,53,47,0.1)] rounded-md text-xs text-[rgba(55,53,47,0.6)] leading-relaxed">
            <Info size={12} className="inline mr-2 mb-0.5" />
            {data.details || data.message || 'No active threat pulses detected for this domain.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatIntelWidget;
