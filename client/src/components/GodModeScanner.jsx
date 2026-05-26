import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, CheckCircle, XCircle, AlertTriangle, Play, ShieldAlert, Download } from 'lucide-react';
import BreachIntel from './BreachIntel';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function GodModeScanner({ initialQuery = '', onNavigate }) {
  const [target, setTarget] = useState(initialQuery);
  const [saveToWorkspace, setSaveToWorkspace] = useState(true);
  
  useEffect(() => {
    if (initialQuery) {
      setTarget(initialQuery);
    }
  }, [initialQuery]);

  const getDetectedType = (input) => {
    const val = input.trim();
    if (!val) return null;
    if (val.includes('@')) return 'email';
    if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,34}$/.test(val)) return 'bitcoin';
    if (/^0x[a-fA-F0-9]{40}$/.test(val)) return 'ethereum';
    if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(val) || /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(val)) return 'ip';
    if (/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(val)) return 'domain';
    return 'username';
  };
  const detectedType = getDetectedType(target);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  
  const [logs, setLogs] = useState([]);
  const [modules, setModules] = useState({});
  const [finalResult, setFinalResult] = useState(null);
  const eventSourceRef = useRef(null);
  
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startScan = (e) => {
    e.preventDefault();
    if (!target.trim()) return;
    
    // Reset state
    setLogs([]);
    setModules({});
    setFinalResult(null);
    setScanComplete(false);
    setIsScanning(true);
    
    // Connect to SSE
    const queryUrl = `${API_BASE}/api/scan/full?target=${encodeURIComponent(target)}&save=${saveToWorkspace}`;
    
    const es = new EventSource(queryUrl);
    eventSourceRef.current = es;
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'complete') {
          setFinalResult(data);
          setScanComplete(true);
          setIsScanning(false);
          es.close();
          setLogs(prev => [...prev, `[SYSTEM] Scan complete for ${data.target_type} target.`]);
          
          // Save to history
          try {
            const history = JSON.parse(localStorage.getItem('holmes-history') || '[]');
            const cleanQuery = target.trim();
            const updated = [
              { query: cleanQuery, type: detectedType || 'username', timestamp: Date.now(), riskScore: data.risk_score },
              ...history.filter(h => h.query !== cleanQuery)
            ].slice(0, 50);
            localStorage.setItem('holmes-history', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('holmes-history-updated'));
          } catch (e) {
            console.error('Failed to log GodMode history:', e);
          }
          
          return;
        }
        
        if (data.module) {
          setModules(prev => ({
            ...prev,
            [data.module]: data
          }));
          
          if (data.status === 'running') {
            setLogs(prev => [...prev, `[EXEC] Module ${data.module.toUpperCase()} initialized...`]);
          } else if (data.status === 'complete') {
            setLogs(prev => [...prev, `[OK] Module ${data.module.toUpperCase()} finished parsing.`]);
          } else if (data.status === 'error') {
            setLogs(prev => [...prev, `[FAIL] Module ${data.module.toUpperCase()} failed: ${data.error}`]);
          }
        }
      } catch (err) {
        console.error("SSE Parse Error", err);
      }
    };
    
    es.onerror = (err) => {
      console.error("SSE Connection Error", err);
      setLogs(prev => [...prev, `[FATAL] Stream connection lost or terminated abnormally.`]);
      es.close();
      setIsScanning(false);
    };
  };

  const handleDownload = async () => {
    if (!finalResult) return;
    // Download logic via fetch
    try {
      const exportPayload = { ...finalResult };
      if (Object.keys(modules).length > 0) {
        Object.entries(modules).forEach(([modName, modData]) => {
          if (modData && modData.status === 'complete' && modData.data) {
            exportPayload[modName] = modData.data;
          }
        });
      }
      const response = await fetch(`${API_BASE}/api/report/generate?query=${encodeURIComponent(target)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportPayload)
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `holmes_report_${target}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Report generation failed: " + e.message);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Search */}
      <div style={{ backgroundColor: 'var(--notion-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--notion-border)' }}>
        <h2 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert style={{ color: '#2383e2' }} /> God-Mode Reconnaissance
        </h2>
        
        <form onSubmit={startScan} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input 
              type="text" 
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="Enter Domain, IP, Email, Wallet, or Username..."
              disabled={isScanning}
              style={{ width: '100%', padding: '14px 100px 14px 44px', borderRadius: '8px', border: '1px solid var(--notion-border)', fontSize: '15px' }}
            />
            {detectedType && (
              <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(35, 131, 226, 0.1)', color: '#2383e2', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                {detectedType}
              </span>
            )}
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={saveToWorkspace} 
              onChange={e => setSaveToWorkspace(e.target.checked)} 
              disabled={isScanning} 
            />
            Save to Workspace
          </label>
          
          <button 
            type="submit" 
            disabled={isScanning || !target}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', backgroundColor: isScanning ? '#ccc' : '#2383e2', 
              color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: isScanning ? 'not-allowed' : 'pointer'
            }}
          >
            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {isScanning ? 'Scanning...' : 'Launch Recon'}
          </button>
        </form>
      </div>

      {/* Main UI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Module Matrix */}
        <div style={{ backgroundColor: 'var(--notion-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--notion-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--notion-fg)' }}>Module Matrix</h3>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {Object.keys(modules).length} Active Modules
              </span>
            </div>
            
            {/* Progress Bar */}
            {(isScanning || scanComplete) && Object.keys(modules).length > 0 && (
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--notion-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  backgroundColor: scanComplete ? '#2ecc71' : '#2383e2', 
                  width: `${(Object.values(modules).filter(m => m.status === 'complete' || m.status === 'error').length / Object.keys(modules).length) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {Object.entries(modules).map(([name, mData]) => {
              const isRun = mData.status === 'running';
              const isErr = mData.status === 'error';
              const isOk = mData.status === 'complete';
              
              let bg = 'var(--notion-hover)';
              if (isOk) bg = 'rgba(46, 204, 113, 0.1)';
              if (isErr) bg = 'rgba(231, 76, 60, 0.1)';
              
              let border = 'var(--notion-border)';
              if (isOk) border = '#2ecc71';
              if (isErr) border = '#e74c3c';
              
              return (
                <div key={name} style={{ 
                  padding: '12px', borderRadius: '8px', border: `1px solid ${border}`,
                  backgroundColor: bg, display: 'flex', flexDirection: 'column', gap: '8px',
                  alignItems: 'center', justifyContent: 'center', textAlign: 'center'
                }}>
                  {isRun && <Loader2 size={24} className="animate-spin" style={{ color: '#2383e2' }} />}
                  {isOk && <CheckCircle size={24} style={{ color: '#2ecc71' }} />}
                  {isErr && <XCircle size={24} style={{ color: '#e74c3c' }} />}
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {name}
                  </span>
                </div>
              );
            })}
            
            {Object.keys(modules).length === 0 && !isScanning && (
              <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                Waiting for deployment...
              </div>
            )}
          </div>
        </div>
        
        {/* Hacker Terminal Logs */}
        <div style={{ 
          backgroundColor: '#0a0a0a', color: '#00ff41', padding: '16px', 
          borderRadius: '12px', fontFamily: 'monospace', fontSize: '12px',
          height: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
        }}>
          {logs.length === 0 ? (
            <div style={{ opacity: 0.5 }}>sys.stdout listening...</div>
          ) : (
            logs.map((l, i) => (
              <div key={i} style={{ marginBottom: '4px', opacity: 0.9 }}>{l}</div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

      </div>

      {/* Final Risk Dashboard */}
      {scanComplete && finalResult && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--notion-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--notion-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Analysis Complete</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {onNavigate && (
                <button 
                  onClick={() => onNavigate('maltego')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  <Search size={16} /> Visualize in Intel Graph
                </button>
              )}
              <button 
                onClick={handleDownload}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#fff', border: '1px solid var(--notion-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                <Download size={16} /> Export PDF Report
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Score Box */}
            <div style={{ flex: 1, backgroundColor: 'var(--notion-sidebar)', padding: '24px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--notion-border)' }}>
              <div style={{ fontSize: '48px', fontWeight: 800, color: finalResult.risk_score < 40 ? '#e74c3c' : (finalResult.risk_score < 70 ? '#f39c12' : '#2ecc71') }}>
                {finalResult.risk_score}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: '#666', marginTop: '8px' }}>
                Overall Risk Score
              </div>
              <div style={{ display: 'inline-block', marginTop: '12px', padding: '4px 12px', backgroundColor: finalResult.risk_level === 'CRITICAL' ? '#e74c3c' : (finalResult.risk_level === 'HIGH' ? '#e67e22' : '#2383e2'), color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {finalResult.risk_level}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--notion-sidebar)', padding: '16px', borderRadius: '8px', border: '1px solid var(--notion-border)' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Target Resolved</div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{finalResult.target}</div>
                <div style={{ fontSize: '11px', color: '#2383e2', marginTop: '4px', textTransform: 'uppercase' }}>{finalResult.target_type}</div>
              </div>
              <div style={{ backgroundColor: 'var(--notion-sidebar)', padding: '16px', borderRadius: '8px', border: '1px solid var(--notion-border)' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Modules Fired</div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{finalResult.modules_run} Modules</div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Yielding {finalResult.total_findings} data points</div>
              </div>
            </div>
          </div>

          {/* Correlations List */}
          {finalResult.correlations && finalResult.correlations.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Automated Correlation Findings</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {finalResult.correlations.map((corr, idx) => (
                  <div key={idx} style={{ 
                    padding: '16px', 
                    borderLeft: `4px solid ${corr.severity === 'CRITICAL' ? '#e74c3c' : (corr.severity === 'HIGH' ? '#e67e22' : '#f39c12')}`,
                    backgroundColor: 'var(--notion-sidebar)',
                    borderRadius: '0 8px 8px 0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <AlertTriangle size={16} style={{ color: corr.severity === 'CRITICAL' ? '#e74c3c' : '#f39c12' }} />
                      <strong style={{ fontSize: '13px' }}>{corr.rule.replace(/_/g, ' ')}</strong>
                      <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px', fontWeight: 700 }}>{corr.severity}</span>
                    </div>
                    <div style={{ fontSize: '13px', marginBottom: '4px' }}>{corr.description}</div>
                    <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>Rec: {corr.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Module Insights */}
          {modules.breach && modules.breach.status === 'complete' && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--notion-fg)' }}>Detailed Breach Intelligence</h4>
              <BreachIntel results={modules.breach.data} />
            </div>
          )}
        </div>
      )}

    </div>
  );
}
