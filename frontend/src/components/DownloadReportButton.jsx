import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

export default function DownloadReportButton({ dashboardData, disabled = false }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!dashboardData) return;
    
    // Attempt to extract the primary target identifier
    const target = dashboardData.domain || dashboardData.target || dashboardData.username || dashboardData.query || 'osint_target';
    
    try {
      setIsDownloading(true);
      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/download-report?domain=${encodeURIComponent(target)}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }
      
      // Convert the response stream into a Blob
      const blob = await response.blob();
      
      // Create a secure Object URL for the blob
      const objectUrl = window.URL.createObjectURL(blob);
      
      // Create an invisible anchor to trigger the download
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${target}_osint_report.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Memory cleanup
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error("Error downloading PDF report:", error);
      alert("Failed to generate PDF. Check network connectivity.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isDisabled = disabled || !dashboardData || isDownloading;

  return (
    <button
      onClick={handleDownload}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs tracking-widest uppercase transition-all
        ${isDisabled
          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.15)] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]'}
      `}
    >
      {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {isDownloading ? 'Generating PDF...' : 'Download Report'}
    </button>
  );
}
