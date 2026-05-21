import { useState } from 'react';
import { ExternalLink, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Search } from 'lucide-react';

const PLATFORM_META = {
  github:    { color: '#37352f', icon: '⌥' },
  twitter:   { color: '#1d9bf0', icon: '𝕏' },
  reddit:    { color: '#ff4500', icon: '⬤' },
  instagram: { color: '#e1306c', icon: '◈' },
  pinterest: { color: '#e60023', icon: '◙' },
  medium:    { color: '#02b875', icon: '◉' },
  dev:       { color: '#3b49df', icon: '◈' },
  hackernews:{ color: '#ff6600', icon: '◈' },
  producthunt:{ color: '#da552f', icon: '◈' },
};

function ResultCard({ platform, url, status, data }) {
  const meta  = PLATFORM_META[platform?.toLowerCase()] ?? { color: '#37352f', icon: '◈' };
  const label = platform?.charAt(0).toUpperCase() + platform?.slice(1);
  const [expanded, setExpanded] = useState(false);

  const hasData = data && (
    (data.bio && data.bio !== 'Data not available') || 
    (data.follower_count && data.follower_count !== 'Data not available') ||
    (data.name && data.name !== 'Data not available')
  );

  const isFound = status === 'found';
  const isError = status === 'error';

  return (
    <div className={`
      flex flex-col border border-[rgba(55,53,47,0.08)] rounded-lg transition-all duration-200
      ${isFound ? 'bg-white hover:bg-[rgba(55,53,47,0.02)]' : 'opacity-40 grayscale cursor-default'}
    `}>
      <div className="p-4 flex flex-col items-center gap-3">
        <div 
          className="w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
        >
          {meta.icon}
        </div>
        
        <div className="text-center">
          <div className="text-sm font-bold text-[#37352f]">{label}</div>
          <div className={`text-[10px] font-semibold flex items-center justify-center gap-1 mt-0.5 ${isFound ? 'text-green-600' : 'text-[rgba(55,53,47,0.4)]'}`}>
            {isFound ? <><CheckCircle2 size={10} /> Active</> : 'Not Linked'}
          </div>
        </div>

        {isFound && (
          <div className="flex gap-2 w-full">
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              className="flex-1 notion-button text-[10px] py-1"
            >
              <ExternalLink size={10} /> Visit
            </a>
            {hasData && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="notion-button text-[10px] py-1 px-2"
              >
                {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && hasData && (
        <div className="px-4 pb-4 pt-2 border-t border-[rgba(55,53,47,0.05)] bg-[rgba(55,53,47,0.02)] rounded-b-lg">
          <div className="space-y-2">
            {data.name && data.name !== 'Data not available' && (
              <div className="text-[10px] font-bold text-[#37352f]">{data.name}</div>
            )}
            {data.follower_count && data.follower_count !== 'Data not available' && (
              <span className="notion-tag text-[9px] bg-white border border-[rgba(55,53,47,0.1)]">
                {data.follower_count}
              </span>
            )}
            {data.bio && data.bio !== 'Data not available' && (
              <p className="text-[10px] text-[rgba(55,53,47,0.6)] leading-relaxed m-0 italic">
                "{data.bio}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlatformGrid({ footprint = [], scanResults = [] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const allPlatforms = scanResults.length > 0 
    ? scanResults.map(sr => {
        const fpItem = footprint.find(f => f.platform === sr.platform);
        return { ...sr, data: fpItem?.data };
      })
    : footprint;

  const totalScanned = allPlatforms.length;
  const foundCount = allPlatforms.filter(p => p.status === 'found').length;

  const filteredPlatforms = allPlatforms.filter(p => 
    p.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[rgba(55,53,47,0.1)] pb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(55,53,47,0.3)]" />
          <input
            type="text"
            placeholder="Search footprints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[rgba(242,241,238,0.5)] border border-[rgba(55,53,47,0.1)] rounded-md text-xs outline-none focus:bg-white focus:border-blue-500/30"
          />
        </div>
        
        <div className="flex items-center gap-2">
           <span className="text-xs font-medium text-[rgba(55,53,47,0.4)]">Linked Identities:</span>
           <span className="notion-tag bg-blue-50 text-blue-700 border-blue-100">{foundCount} / {totalScanned}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredPlatforms.map((item) => (
          <ResultCard
            key={item.platform}
            platform={item.platform}
            url={item.url}
            status={item.status}
            data={item.data}
          />
        ))}
      </div>
    </div>
  );
}
