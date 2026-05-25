import React from 'react';
import { 
  Hash, Globe, Layers, MapPin, Shield, Zap, 
  ExternalLink, Info, Activity, AlertTriangle, Mail
} from 'lucide-react';

const Block = ({ title, emoji, children, borderColor = 'border-white/10', bgColor = 'bg-slate-900/50' }) => (
  <div className="mb-8 last:mb-0 animate-fade-in">
    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
      <span>{emoji}</span> {title}
    </div>
    <div className={`p-5 rounded-xl border ${borderColor} ${bgColor} backdrop-blur-md`}>
      {children}
    </div>
  </div>
);

const Row = ({ label, value, subValue, valueColor = 'text-slate-100' }) => (
  <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
    <div className="text-sm font-medium text-slate-400">{label}</div>
    <div className="text-right">
      <div className={`text-sm font-bold ${valueColor}`}>{value}</div>
      {subValue && <div className="text-[10px] text-slate-500 mt-0.5">{subValue}</div>}
    </div>
  </div>
);

export default function UnifiedDashboard({ data }) {
  const { query, type, data: scanData } = data;

  const renderContent = () => {
    switch (type) {
      case 'btc':
        return (
          <>
            <Block title="Wallet Identity" emoji="💰">
              <Row label="Address" value={query} valueColor="text-cyan-400 font-mono" />
              <Row label="Balance" value={`${scanData.balance_btc} BTC`} valueColor="text-emerald-400" />
              <Row label="Transactions" value={scanData.tx_count} />
              <div className="mt-5">
                <a href={scanData.explorer_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-blue-500/10 hover:bg-blue-500/20 text-cyan-400 border border-blue-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  <ExternalLink size={14} /> View on Blockchain.com
                </a>
              </div>
            </Block>
            <Block title="Intelligence Status" emoji="🤖" borderColor="border-blue-500/20" bgColor="bg-blue-500/5">
              <p className="text-sm m-0 text-cyan-400 font-medium">{scanData.message}</p>
            </Block>
          </>
        );

      case 'network':
        const net = scanData.network_intel || {};
        return (
          <>
            <Block title="Infrastructure Details" emoji="🖥️">
              <Row label="ISP" value={net.isp} />
              <Row label="Organization" value={net.org} />
              <Row label="Operating System" value={net.os || 'Undetected'} />
            </Block>
            <Block title="Security Audit" emoji="🛡️" borderColor="border-red-500/20" bgColor="bg-red-500/5">
              <div className="flex flex-wrap gap-2 mb-4">
                {net.ports?.map(p => (
                  <span key={p} className="text-xs font-bold bg-blue-500/10 text-cyan-400 border border-blue-500/20 px-2.5 py-1 rounded-md">Port {p}</span>
                ))}
              </div>
              {net.vulns?.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-400 font-semibold mb-2">
                  <AlertTriangle size={14} /> {v}
                </div>
              ))}
            </Block>
          </>
        );

      case 'bssid':
        const wifi = scanData.wifi_intel || {};
        return (
          <>
            <Block title="Geospatial Mapping" emoji="📍">
              <Row label="SSID" value={wifi.ssid || 'Unknown'} />
              <Row label="Road" value={wifi.road} />
              <Row label="City" value={wifi.city} />
              <div className="grid grid-cols-2 gap-4 mt-5">
                 <div className="p-3 bg-slate-900 border border-white/10 rounded-xl text-center shadow-inner">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Lat</div>
                    <div className="text-sm font-bold text-slate-200">{wifi.lat?.toFixed(5)}</div>
                 </div>
                 <div className="p-3 bg-slate-900 border border-white/10 rounded-xl text-center shadow-inner">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Lon</div>
                    <div className="text-sm font-bold text-slate-200">{wifi.lon?.toFixed(5)}</div>
                 </div>
              </div>
            </Block>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <a href={`https://www.google.com/maps?q=${wifi.lat},${wifi.lon}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                <MapPin size={14} /> Google Maps
              </a>
              <a href={`https://yandex.com/maps/?ll=${wifi.lon},${wifi.lat}&z=18&l=sat`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                <Globe size={14} /> Yandex Sat
              </a>
            </div>
          </>
        );

      case 'email':
        const breaches = scanData.breaches || {};
        const isCompromised = breaches.status === 'compromised';
        return (
          <>
            <Block title="Data Breach Radar" emoji="🚨" borderColor={isCompromised ? "border-red-500/30" : "border-emerald-500/30"} bgColor={isCompromised ? "bg-red-500/5" : "bg-emerald-500/5"}>
              <Row label="Status" value={isCompromised ? "COMPROMISED" : "SECURE"} valueColor={isCompromised ? "text-red-500" : "text-emerald-500"} />
              <Row label="Known Breaches" value={breaches.breach_count || 0} valueColor="text-slate-200" />
            </Block>
            {isCompromised && breaches.details?.length > 0 && (
              <Block title="Breach Footprint" emoji="☠️" borderColor="border-white/10">
                <div className="flex flex-col gap-4">
                  {breaches.details.map((b, i) => (
                    <div key={i} className="p-4 bg-slate-900 border border-white/5 rounded-lg shadow-inner">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-red-400">{b.name}</span>
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-mono">{b.date}</span>
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed max-h-24 overflow-y-auto pr-2 custom-scrollbar" dangerouslySetInnerHTML={{ __html: b.description }} />
                    </div>
                  ))}
                </div>
              </Block>
            )}
          </>
        );

      default:
        return (
          <div className="p-16 text-center animate-pulse glass-panel rounded-xl">
            <div className="text-4xl mb-4">⌛</div>
            <div className="font-semibold text-slate-400">Gathering Intelligence...</div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 p-5 glass-panel rounded-xl mb-10">
        <div className="w-14 h-14 bg-slate-900 rounded-xl border border-white/10 flex items-center justify-center text-2xl shadow-inner">
          {type === 'btc' ? '💰' : type === 'network' ? '🖥️' : type === 'email' ? '📧' : '📡'}
        </div>
        <div>
          <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Target Detected: {type}</div>
          <div className="text-xl font-bold text-slate-100 font-mono tracking-tight">{query}</div>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
