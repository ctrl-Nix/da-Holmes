import { ShieldAlert, ShieldCheck, ShieldOff, ShieldQuestion } from 'lucide-react';

const RISK_CONFIG = {
  CRITICAL: { color: '#ef4444', label: 'Critical',   icon: ShieldAlert, track: '#7f1d1d' },
  HIGH:     { color: '#f97316', label: 'High',        icon: ShieldAlert, track: '#7c2d12' },
  MEDIUM:   { color: '#f59e0b', label: 'Medium',      icon: ShieldQuestion, track: '#78350f' },
  LOW:      { color: '#22c55e', label: 'Low',         icon: ShieldCheck, track: '#14532d' },
  MINIMAL:  { color: '#6366f1', label: 'Minimal',     icon: ShieldOff,  track: '#312e81' },
};

/**
 * Circular SVG gauge showing the risk score out of 100.
 */
export default function RiskGauge({ score = 0, level = 'MINIMAL' }) {
  const cfg   = RISK_CONFIG[level] ?? RISK_CONFIG.MINIMAL;
  const Icon  = cfg.icon;
  const R     = 52;                          // circle radius
  const C     = 2 * Math.PI * R;            // circumference ≈ 326.7
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = C - (clampedScore / 100) * C;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 160, height: 160 }}>
        {/* Outer decorative ring */}
        <svg width="160" height="160" viewBox="0 0 160 160" className="absolute inset-0">
          <circle
            cx="80" cy="80" r="72"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            strokeDasharray="6 4"
          />
        </svg>

        {/* Gauge SVG */}
        <svg width="160" height="160" viewBox="0 0 160 160" className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx="80" cy="80" r={R}
            fill="none"
            stroke="#000"
            strokeWidth="16"
          />
          {/* Fill */}
          <circle
            cx="80" cy="80" r={R}
            fill="none"
            stroke={cfg.color}
            strokeWidth="12"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Icon size={24} style={{ color: cfg.color }} />
          <span
            className="text-4xl font-black leading-none tabular-nums text-black"
          >
            {clampedScore}
          </span>
          <span className="text-[10px] text-black font-black uppercase tracking-widest">/ 100</span>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div
        className="px-6 py-2 border-4 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_#000]"
        style={{
          color: '#fff',
          backgroundColor: cfg.color,
        }}
      >
        {cfg.label} Risk
      </div>
    </div>
  );
}
