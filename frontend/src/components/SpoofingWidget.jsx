import React, { useState } from 'react';
import { Mail, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Info, ArrowRight, ExternalLink } from 'lucide-react';

const SpoofingWidget = () => {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/spoofing/?domain=${domain}`);
      const result = await response.json();
      if (result.status === 'success') {
        setData(result);
      } else {
        setError('Failed to analyze domain.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notion-card flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[rgba(55,53,47,0.1)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📧</span>
          <h3 className="text-sm font-bold m-0">Email Spoofing Audit</h3>
        </div>
        {data && (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
            data.rating === 'SECURE' ? 'bg-green-100 text-green-700' : 
            data.rating === 'VULNERABLE' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
          }`}>
            {data.rating}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input 
          className="notion-input flex-1" 
          placeholder="Enter domain (e.g., google.com)" 
          value={domain} 
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
        />
        <button 
          className="notion-button-primary" 
          onClick={handleScan} 
          disabled={loading}
        >
          {loading ? '...' : 'Verify'}
        </button>
      </div>

      {error && <div className="text-xs text-red-500 font-medium">⚠️ {error}</div>}

      {data && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[rgba(55,53,47,0.03)] rounded-lg">
               <div className="text-[10px] font-bold text-[rgba(55,53,47,0.4)] uppercase mb-2">Security Score</div>
               <div className="text-3xl font-bold text-[#37352f]">{data.score}<span className="text-sm text-[rgba(55,53,47,0.3)]">/100</span></div>
            </div>
            <div className="p-4 bg-[rgba(35,131,226,0.05)] rounded-lg">
               <div className="text-[10px] font-bold text-blue-400 uppercase mb-2">Quick Summary</div>
               <p className="text-xs m-0 font-medium text-[#37352f]">{data.summary}</p>
            </div>
          </div>

          <div className="space-y-4">
            <RecordBlock label="SPF Record" record={data.analysis.spf.record} status={data.analysis.spf.status} />
            <RecordBlock label="DMARC Record" record={data.analysis.dmarc.record} status={data.analysis.dmarc.status} />
          </div>

          {(data.risk_factors.length > 0 || data.recommendations.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.risk_factors.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="text-[10px] font-bold text-red-400 uppercase mb-2">Vulnerabilities</div>
                  {data.risk_factors.map((risk, i) => (
                    <div key={i} className="text-[10px] font-medium text-red-700 mb-1 flex gap-1 items-start">
                       <span>•</span> {risk}
                    </div>
                  ))}
                </div>
              )}
              {data.recommendations.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-[10px] font-bold text-green-400 uppercase mb-2">Recommended Fixes</div>
                  {data.recommendations.map((rec, i) => (
                    <div key={i} className="text-[10px] font-medium text-green-700 mb-1 flex gap-1 items-start">
                       <CheckCircle size={10} className="mt-0.5 shrink-0" /> {rec}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RecordBlock = ({ label, record, status }) => (
  <div className="group">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-bold text-[rgba(55,53,47,0.4)] uppercase">{label}</span>
      <span className={`text-[9px] font-bold ${status === 'Found' ? 'text-green-600' : 'text-red-500'}`}>{status}</span>
    </div>
    <div className="p-2 bg-[rgba(242,241,238,0.6)] border border-[rgba(55,53,47,0.1)] rounded font-mono text-[10px] break-all group-hover:bg-white transition-colors">
      {record || 'No record found.'}
    </div>
  </div>
);

export default SpoofingWidget;
