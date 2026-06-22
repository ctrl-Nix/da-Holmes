import React from 'react';
import { ArrowRight, Globe, AtSign, Layers, Hash, Search, User, GitBranch, ShieldAlert } from 'lucide-react';

const PIVOT_TYPES = {
  domain: {
    icon: Globe,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  email: {
    icon: AtSign,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  network: {
    icon: Layers,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  btc: {
    icon: Hash,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  username: {
    icon: User,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  security: {
    icon: ShieldAlert,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  github: {
    icon: GitBranch,
    color: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
};

/**
 * Generates pivot suggestions based on scan result data.
 * @param {object} results - The scan results object
 * @returns {Array} Array of {label, value, type, description} pivot actions
 */
function buildPivots(results) {
  const pivots = [];
  const type = results?._type || results?.type;
  const data = results?.data || results;

  if (type === 'domain' || type === 'unified') {
    // From domain → pivot to IP
    const ip = data?.bgp?.ip || data?.main_ip;
    if (ip) pivots.push({ label: 'Scan IP', value: ip, type: 'network', description: `Network Intel on ${ip}` });

    // From domain → pivot to email pattern
    const emailFormat = data?.email_format?.most_likely_format;
    if (emailFormat) pivots.push({ label: 'Check Email', value: emailFormat, type: 'email', description: `Breach check: ${emailFormat}` });

    // From domain → security headers
    const domain = results?.query || data?.domain;
    if (domain) pivots.push({ label: 'Security Audit', value: domain, type: 'security', description: `Header audit on ${domain}` });

    // From domain → GitHub org
    const orgName = results?.query?.split('.')[0];
    if (orgName) pivots.push({ label: 'GitHub Scan', value: orgName, type: 'github', description: `Org scan: ${orgName}` });
  }

  if (type === 'email') {
    // From email → pivot to domain
    const parts = (results?.query || '').split('@');
    if (parts[1]) pivots.push({ label: 'Scan Domain', value: parts[1], type: 'domain', description: `Full domain scan: ${parts[1]}` });

    // From email → username guess
    if (parts[0]) pivots.push({ label: 'Username Hunt', value: parts[0], type: 'username', description: `Social footprint: ${parts[0]}` });
  }

  if (type === 'username') {
    // From username → pivot to email guess
    const username = results?.username;
    if (username) {
      pivots.push({ label: 'GitHub Intel', value: username, type: 'github', description: `GitHub profile: ${username}` });
    }
    // Extract domains from found platforms
    const platforms = results?.platform_footprint?.filter(p => p.found) || [];
    platforms.slice(0, 2).forEach(p => {
      try {
        const host = new URL(p.url).hostname;
        if (host && !pivots.find(piv => piv.value === host)) {
          pivots.push({ label: 'Domain Intel', value: host, type: 'domain', description: `Domain scan: ${host}` });
        }
      } catch (_) {}
    });
  }

  if (type === 'network' || type === 'ip') {
    const ipData = data?.network_intel || data;
    const hostname = ipData?.hostname;
    if (hostname && hostname !== 'Unknown') {
      pivots.push({ label: 'Domain Scan', value: hostname, type: 'domain', description: `Full scan: ${hostname}` });
    }
  }

  return pivots.slice(0, 5); // Max 5 pivots
}

export default function PivotBar({ results, onPivot }) {
  if (!results) return null;

  const pivots = buildPivots(results);
  if (pivots.length === 0) return null;

  return (
    <div className="animate-fade-in mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pivot Actions</span>
        <span className="text-[9px] text-slate-600 font-mono">— Connect the dots</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {pivots.map((pivot, i) => {
          const typeInfo = PIVOT_TYPES[pivot.type] || PIVOT_TYPES.domain;
          const Icon = typeInfo.icon;
          return (
            <button
              key={i}
              onClick={() => onPivot && onPivot(pivot.value, pivot.type)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] ${typeInfo.bg} ${typeInfo.border} ${typeInfo.color} hover:shadow-lg`}
              title={pivot.description}
            >
              <Icon size={13} />
              <span>{pivot.label}</span>
              <span className="text-[10px] opacity-60 font-mono max-w-[100px] truncate">{pivot.value}</span>
              <ArrowRight size={11} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
