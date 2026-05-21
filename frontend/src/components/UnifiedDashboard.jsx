import React from 'react';
import { 
  Hash, Globe, Layers, MapPin, Shield, Zap, 
  ExternalLink, Info, Activity, AlertTriangle 
} from 'lucide-react';

const Block = ({ title, emoji, children, color = 'rgba(55,53,47,0.03)' }) => (
  <div className="mb-8 last:mb-0">
    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[rgba(55,53,47,0.4)] uppercase tracking-widest">
      <span>{emoji}</span> {title}
    </div>
    <div className="p-4 rounded-lg" style={{ backgroundColor: color }}>
      {children}
    </div>
  </div>
);

const Row = ({ label, value, subValue }) => (
  <div className="flex items-start justify-between py-2 border-b border-[rgba(55,53,47,0.05)] last:border-0">
    <div className="text-sm font-medium text-[rgba(55,53,47,0.5)]">{label}</div>
    <div className="text-right">
      <div className="text-sm font-semibold">{value}</div>
      {subValue && <div className="text-[10px] text-[rgba(55,53,47,0.4)]">{subValue}</div>}
    </div>
  </div>
);

export default function UnifiedDashboard({ data }) {
  const { query, type, data: scanData } = data;

  const renderContent = () => {
    switch (type) {
      case 'btc':
        return (
          <div className="animate-fade-in">
            <Block title="Wallet Identity" emoji="💰">
              <Row label="Address" value={query} />
              <Row label="Balance" value={`${scanData.balance_btc} BTC`} />
              <Row label="Transactions" value={scanData.tx_count} />
              <div className="mt-4">
                <a href={scanData.explorer_url} target="_blank" rel="noreferrer" className="notion-button w-full text-xs">
                  <ExternalLink size={12} /> View on Blockchain.com
                </a>
              </div>
            </Block>
            <Block title="Intelligence Status" emoji="🤖" color="rgba(35,131,226,0.05)">
              <p className="text-sm m-0 text-blue-700 font-medium">{scanData.message}</p>
            </Block>
          </div>
        );

      case 'network':
        const net = scanData.network_intel || {};
        return (
          <div className="animate-fade-in">
            <Block title="Infrastructure Details" emoji="🖥️">
              <Row label="ISP" value={net.isp} />
              <Row label="Organization" value={net.org} />
              <Row label="Operating System" value={net.os || 'Undetected'} />
            </Block>
            <Block title="Security Audit" emoji="🛡️" color="rgba(235,87,87,0.05)">
              <div className="flex flex-wrap gap-2 mb-4">
                {net.ports?.map(p => (
                  <span key={p} className="notion-tag">Port {p}</span>
                ))}
              </div>
              {net.vulns?.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-red-600 font-semibold mb-2">
                  <AlertTriangle size={12} /> {v}
                </div>
              ))}
            </Block>
          </div>
        );

      case 'bssid':
        const wifi = scanData.wifi_intel || {};
        return (
          <div className="animate-fade-in">
            <Block title="Geospatial Mapping" emoji="📍">
              <Row label="SSID" value={wifi.ssid || 'Unknown'} />
              <Row label="Road" value={wifi.road} />
              <Row label="City" value={wifi.city} />
              <div className="grid grid-cols-2 gap-4 mt-4">
                 <div className="p-3 bg-white border border-[rgba(55,53,47,0.1)] rounded-md text-center">
                    <div className="text-[10px] text-[rgba(55,53,47,0.4)] font-bold uppercase">Lat</div>
                    <div className="text-sm font-bold">{wifi.lat?.toFixed(5)}</div>
                 </div>
                 <div className="p-3 bg-white border border-[rgba(55,53,47,0.1)] rounded-md text-center">
                    <div className="text-[10px] text-[rgba(55,53,47,0.4)] font-bold uppercase">Lon</div>
                    <div className="text-sm font-bold">{wifi.lon?.toFixed(5)}</div>
                 </div>
              </div>
            </Block>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <a href={`https://www.google.com/maps?q=${wifi.lat},${wifi.lon}`} target="_blank" rel="noreferrer" className="notion-button text-xs">
                <MapPin size={12} /> Google Maps
              </a>
              <a href={`https://yandex.com/maps/?ll=${wifi.lon},${wifi.lat}&z=18&l=sat`} target="_blank" rel="noreferrer" className="notion-button text-xs">
                <Globe size={12} /> Yandex Sat
              </a>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-12 text-center animate-pulse">
            <div className="text-4xl mb-4">⌛</div>
            <div className="font-semibold text-[rgba(55,53,47,0.5)]">Gathering Intelligence...</div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 p-4 bg-[rgba(55,53,47,0.03)] rounded-lg mb-8 border border-[rgba(55,53,47,0.05)]">
        <div className="w-12 h-12 bg-white rounded-xl border border-[rgba(55,53,47,0.1)] flex items-center justify-center text-2xl shadow-sm">
          {type === 'btc' ? '💰' : type === 'network' ? '🖥️' : '📡'}
        </div>
        <div>
          <div className="text-[10px] font-bold text-[rgba(55,53,47,0.4)] uppercase tracking-widest">Target Detected: {type}</div>
          <div className="text-lg font-bold text-[#37352f] font-mono">{query}</div>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
