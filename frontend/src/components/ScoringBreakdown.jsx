import { FileSearch, BarChart3 } from 'lucide-react';

const WEIGHT_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

function getWeightColor(weight) {
  if (weight >= 15) return WEIGHT_COLORS.high;
  if (weight >= 8)  return WEIGHT_COLORS.medium;
  return WEIGHT_COLORS.low;
}

/**
 * Scoring breakdown table showing per-platform weights and rationale.
 */
export default function ScoringBreakdown({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={13} className="text-slate-500" />
        <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
          Scoring Audit Trail
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Platform</th>
              <th className="text-left px-4 py-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Category</th>
              <th className="text-center px-4 py-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Found</th>
              <th className="text-right px-4 py-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Weight</th>
              <th className="text-left px-4 py-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider hidden md:table-cell">Rationale</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const wColor = item.exists ? getWeightColor(item.weight_applied) : '#475569';
              return (
                <tr
                  key={idx}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-200 capitalize">{item.platform}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 uppercase tracking-wide">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${item.exists ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {item.exists ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: wColor }}>
                    {item.exists ? `+${item.weight_applied}` : '0'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{item.rationale}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
