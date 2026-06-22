import React, { useState } from 'react';
import { Users, Loader2, AlertCircle, GitBranch, Bird, Camera, Link2 } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const PLATFORMS = [
  { id: 'github', label: 'GitHub', icon: GitBranch, color: 'text-slate-300', accent: 'border-slate-500/30 bg-slate-500/10' },
  { id: 'twitter', label: 'Twitter / X', icon: Bird, color: 'text-sky-400', accent: 'border-sky-500/30 bg-sky-500/10' },
  { id: 'instagram', label: 'Instagram', icon: Camera, color: 'text-pink-400', accent: 'border-pink-500/30 bg-pink-500/10' },
];

export default function FriendshipWidget() {
  const [target1, setTarget1] = useState('');
  const [target2, setTarget2] = useState('');
  const [platform, setPlatform] = useState('github');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!target1 || !target2) { setError('Please enter both targets'); return; }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/friendship/graph?target1=${target1}&target2=${target2}&platform=${platform}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      setData(await res.json());
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const activePlatform = PLATFORMS.find(p => p.id === platform);

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto my-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <Users size={24} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Friendship Graph</h1>
          <p className="text-sm text-slate-400 mt-0.5">Discover common connections between two users</p>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="flex items-center gap-2">
        {PLATFORMS.map(p => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => { setPlatform(p.id); setData(null); setError(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${platform === p.id ? `${p.accent} ${p.color}` : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'}`}
            >
              <Icon size={13} /> {p.label}
            </button>
          );
        })}
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-3">
        <div className="search-container flex-1 flex items-center gap-2">
          <Users size={14} className="text-slate-500 flex-shrink-0" />
          <input
            className="notion-input text-sm"
            placeholder="First username..."
            value={target1}
            onChange={e => setTarget1(e.target.value)}
          />
        </div>
        <Link2 size={16} className="text-slate-600 flex-shrink-0" />
        <div className="search-container flex-1 flex items-center gap-2">
          <Users size={14} className="text-slate-500 flex-shrink-0" />
          <input
            className="notion-input text-sm"
            placeholder="Second username..."
            value={target2}
            onChange={e => setTarget2(e.target.value)}
          />
        </div>
        <button
          onClick={handleScan}
          disabled={loading}
          className="notion-button-primary px-5 py-2 text-xs whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Compare'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: target1 || 'Target 1', value: data.target1_count, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
              { label: 'Common', value: data.common_count, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
              { label: target2 || 'Target 2', value: data.target2_count, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            ].map((stat, i) => (
              <div key={i} className={`glass-panel rounded-xl p-4 text-center border ${stat.border} ${stat.bg}`}>
                <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value ?? '—'}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold truncate">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Common Connections */}
          <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-amber-500/5">
              <Users size={14} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Common Connections on {data.platform || platform}
              </span>
              <span className="ml-auto text-[9px] text-slate-600 font-mono">{data.common_count} found</span>
            </div>

            <div className="p-4">
              {data.nodes?.filter(n => n.type === 'common').length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.nodes.filter(n => n.type === 'common').map((node, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    >
                      {node.label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users size={32} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No common connections found.</p>
                  <p className="text-slate-600 text-xs mt-1">Only the first page of connections was checked.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
