import React from 'react';

export default function ActivityHeatmap({ data }) {
  if (!data || data.length === 0) return null;

  // Group by day
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Activity Heatmap (24h)</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600">Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: `rgba(245, 158, 11, ${0.1 + i * 0.2})` }} />
            ))}
          </div>
          <span className="text-[10px] text-slate-600">More</span>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex flex-col gap-1 min-w-[600px]">
          {days.map(day => (
            <div key={day} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 w-8">{day}</span>
              <div className="flex flex-1 gap-1">
                {data.filter(d => d.day === day).map((d, i) => (
                  <div 
                    key={i} 
                    title={`${day} ${d.hour}:00 - Intensity: ${d.intensity}%`}
                    className="flex-1 h-3 rounded-sm transition-all hover:scale-110 cursor-help"
                    style={{ 
                      backgroundColor: `rgba(245, 158, 11, ${d.intensity / 100})`,
                      opacity: d.intensity === 0 ? 0.05 : 1
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-8" />
            <div className="flex flex-1 justify-between px-1">
              {[0, 4, 8, 12, 16, 20, 23].map(h => (
                <span key={h} className="text-[9px] font-mono text-slate-600">{h}h</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
