import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, Trash2, Search, Globe, AtSign, Hash, Layers, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const TYPE_ICONS = {
  username: { icon: Search, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  domain: { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  email: { icon: AtSign, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  btc: { icon: Hash, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  network: { icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  unified: { icon: Zap, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
};

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HistoryView({ onRerun }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const clearHistory = async () => {
    if (!window.confirm('Clear all investigation history?')) return;
    setClearing(true);
    try {
      await fetch(`${API_BASE_URL}/api/history`, { method: 'DELETE' });
      setHistory([]);
    } finally {
      setClearing(false);
    }
  };

  const filtered = history.filter(h =>
    !filter || h.target.toLowerCase().includes(filter.toLowerCase()) || h.type.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
          <Clock size={24} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            Investigation History
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Browse and replay past intelligence sessions</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={clearHistory}
            disabled={clearing || history.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors disabled:opacity-40"
          >
            {clearing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Clear All
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="search-container flex items-center gap-2">
        <Search size={16} className="text-slate-500" />
        <input
          className="notion-input text-sm"
          placeholder="Filter by target or type..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        {filter && (
          <span className="text-[10px] bg-blue-500/10 text-cyan-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
            {filtered.length} results
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="text-cyan-400 animate-spin" size={32} />
          <p className="text-slate-500 text-sm">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 glass-panel rounded-2xl">
          <Clock size={48} className="text-slate-600" />
          <p className="text-slate-400 font-semibold">
            {filter ? 'No matches found' : 'No investigation history yet'}
          </p>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            {filter ? 'Try adjusting your filter.' : 'Run your first scan from the Investigation Portal to see it appear here.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item, idx) => {
            const typeInfo = TYPE_ICONS[item.type] || TYPE_ICONS.unified;
            const Icon = typeInfo.icon;
            return (
              <div
                key={item.id || idx}
                className={`group glass-panel rounded-xl px-5 py-4 flex items-center gap-4 hover:border-white/20 transition-all cursor-default border border-white/5`}
              >
                {/* Type Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeInfo.bg} ${typeInfo.border}`}>
                  <Icon size={18} className={typeInfo.color} />
                </div>

                {/* Target Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-slate-100 truncate text-sm">{item.target}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${typeInfo.bg} ${typeInfo.color} border ${typeInfo.border} flex-shrink-0`}>
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock size={10} />
                    <span>{timeAgo(item.date)}</span>
                    <span className="text-slate-700">·</span>
                    <span>{new Date(item.date).toLocaleString()}</span>
                  </div>
                </div>

                {/* Re-run Button */}
                {onRerun && (
                  <button
                    onClick={() => onRerun(item.target, item.type)}
                    className="flex items-center gap-2 px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-cyan-400 text-xs font-bold border border-blue-500/20 flex-shrink-0"
                  >
                    <RefreshCw size={12} /> Re-run
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && history.length > 0 && (
        <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono pt-2 border-t border-white/5">
          <span>{history.length} total investigations logged</span>
          <span>Stored in local SQLite database</span>
        </div>
      )}
    </div>
  );
}
