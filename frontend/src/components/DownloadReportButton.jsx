import React from 'react';
import { Download } from 'lucide-react';
import { generatePDF } from '../utils/reportGenerator';

export default function DownloadReportButton({ dashboardData, disabled = false }) {
  const handleDownload = () => {
    if (!dashboardData) return;
    generatePDF(dashboardData);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !dashboardData}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs tracking-widest uppercase transition-all
        ${disabled || !dashboardData
          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.15)] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]'}
      `}
    >
      <Download size={16} />
      Download Report
    </button>
  );
}
