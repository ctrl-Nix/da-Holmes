import React, { useState, useEffect } from 'react';
import { Database, Search, Target, Calendar, AlertTriangle, FileText, Activity, Layers, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function WorkspaceDashboard() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [activeScan, setActiveScan] = useState(null);
  const [scanDetails, setScanDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('findings'); // findings, correlations
  
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [compareScanId, setCompareScanId] = useState('');
  const [diffResults, setDiffResults] = useState(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const fetchScans = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workspace/scans`);
      if (res.ok) {
        const data = await res.json();
        setScans(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch workspace scans", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const loadScan = async (scan) => {
    setActiveScan(scan);
    setLoadingDetails(true);
    setActiveTab('findings');
    try {
      const res = await fetch(`${API_BASE}/api/workspace/scans/${scan.id}`);
      if (res.ok) {
        const data = await res.json();
        setScanDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const updateFindingStatus = async (f_id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/workspace/findings/${f_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: newStatus })
      });
      if (res.ok) {
        setScanDetails(prev => ({
          ...prev,
          findings: prev.findings.map(f => f.id === f_id ? { ...f, confirmed: newStatus } : f)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteScan = async (id) => {
    if (!confirm('Are you sure you want to delete this scan?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspace/scans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setScans(scans.filter(s => s.id !== id));
        if (activeScan?.id === id) {
          setActiveScan(null);
          setScanDetails(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompare = async () => {
    if (!compareScanId) return;
    setLoadingDiff(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/scans/${activeScan.id}/diff/${compareScanId}`);
      if (res.ok) {
        setDiffResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingDiff(false);
  };

  const filteredScans = scans.filter(s => s.target && s.target.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 40px)', gap: '20px', padding: '20px', backgroundColor: 'var(--notion-bg)' }}>
      
      {/* Left Sidebar: List */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid var(--notion-border)', paddingRight: '20px' }}>
        <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Database size={18} /> Workspace Scans
        </h2>
        
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input 
            type="text" 
            placeholder="Search targets..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '6px', border: '1px solid var(--notion-border)', fontSize: '13px' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '12px' }}>Loading...</div>
          ) : filteredScans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '12px' }}>No scans found.</div>
          ) : (
            filteredScans.map(scan => (
              <div 
                key={scan.id} 
                onClick={() => loadScan(scan)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${activeScan?.id === scan.id ? '#2383e2' : 'var(--notion-border)'}`,
                  backgroundColor: activeScan?.id === scan.id ? 'rgba(35, 131, 226, 0.05)' : 'var(--notion-sidebar)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-fg)' }}>{scan.target}</span>
                  <span style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {scan.target_type}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={10} /> {new Date(scan.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Content: Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeScan ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#999', gap: '12px' }}>
            <Layers size={48} style={{ opacity: 0.5 }} />
            <div style={{ fontSize: '14px' }}>Select a scan from the workspace to view details.</div>
          </div>
        ) : loadingDetails ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Loading details...</div>
        ) : scanDetails ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Header */}
            <div style={{ padding: '0 0 20px 0', borderBottom: '1px solid var(--notion-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>{activeScan.target}</h1>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Target size={14} /> Type: {activeScan.target_type}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Scanned: {new Date(activeScan.created_at).toLocaleString()}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14} /> Findings: {scanDetails.findings?.length || 0}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setShowDiffModal(true)}
                  style={{ padding: '6px 12px', backgroundColor: 'var(--notion-bg)', color: 'var(--notion-fg)', border: '1px solid var(--notion-border)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
                >
                  <ArrowRightLeft size={14} /> Compare
                </button>
                <button 
                  onClick={() => deleteScan(activeScan.id)}
                  style={{ padding: '6px 12px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '20px', padding: '16px 0', borderBottom: '1px solid var(--notion-border)' }}>
              {['findings', 'correlations'].map(tab => (
                <div 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    textTransform: 'capitalize',
                    color: activeTab === tab ? '#2383e2' : 'var(--notion-fg)',
                    borderBottom: activeTab === tab ? '2px solid #2383e2' : '2px solid transparent',
                    paddingBottom: '4px'
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
              
              {/* Findings Tab */}
              {activeTab === 'findings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {scanDetails.findings?.map(f => (
                    <div key={f.id} style={{ display: 'flex', backgroundColor: 'var(--notion-sidebar)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ width: '6px', backgroundColor: f.risk_level === 'CRITICAL' ? '#e74c3c' : (f.risk_level === 'HIGH' ? '#e67e22' : '#f39c12') }} />
                      <div style={{ flex: 1, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{f.module}</div>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>{f.key}</div>
                          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{f.value}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                            {f.risk_level}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={() => updateFindingStatus(f.id, 1)}
                              title="Confirm Finding"
                              style={{ padding: '6px', backgroundColor: f.confirmed === 1 ? '#2ecc71' : 'transparent', color: f.confirmed === 1 ? '#fff' : '#666', border: '1px solid var(--notion-border)', borderRadius: '4px', cursor: 'pointer' }}
                            ><CheckCircle2 size={16} /></button>
                            <button 
                              onClick={() => updateFindingStatus(f.id, 2)}
                              title="Mark False Positive"
                              style={{ padding: '6px', backgroundColor: f.confirmed === 2 ? '#e74c3c' : 'transparent', color: f.confirmed === 2 ? '#fff' : '#666', border: '1px solid var(--notion-border)', borderRadius: '4px', cursor: 'pointer' }}
                            ><XCircle size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!scanDetails.findings || scanDetails.findings.length === 0) && <div style={{ color: '#999' }}>No findings mapped for this scan.</div>}
                </div>
              )}

              {/* Correlations Tab */}
              {activeTab === 'correlations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {scanDetails.correlations?.map(c => (
                    <div key={c.id} style={{ display: 'flex', backgroundColor: 'var(--notion-sidebar)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ width: '6px', backgroundColor: c.severity === 'CRITICAL' ? '#e74c3c' : '#f39c12' }} />
                      <div style={{ flex: 1, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.rule_name}</div>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                            {c.severity}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>{c.description}</div>
                        {c.recommendation && (
                          <div style={{ fontSize: '12px', color: '#2383e2', marginTop: '8px', padding: '8px', backgroundColor: '#eaf4fc', borderRadius: '4px' }}>
                            <strong>Recommendation:</strong> {c.recommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!scanDetails.correlations || scanDetails.correlations.length === 0) && <div style={{ color: '#999' }}>No risk correlations identified for this scan.</div>}
                </div>
              )}

            </div>
          </div>
        ) : null}
      </div>
      {showDiffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--notion-bg)', padding: '24px', borderRadius: '8px', width: '600px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--notion-border)', color: 'var(--notion-fg)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRightLeft size={18} /> Compare Scans</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>Select previous scan for {activeScan.target}:</label>
              <select 
                value={compareScanId} 
                onChange={e => setCompareScanId(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)', color: 'var(--notion-fg)', outline: 'none' }}
              >
                <option value="">-- Select Scan --</option>
                {scans.filter(s => s.target === activeScan.target && s.id !== activeScan.id).map(s => (
                  <option key={s.id} value={s.id}>{new Date(s.created_at).toLocaleString()}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button 
                onClick={handleCompare}
                disabled={!compareScanId || loadingDiff}
                style={{ padding: '8px 16px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, opacity: (!compareScanId || loadingDiff) ? 0.7 : 1 }}
              >
                {loadingDiff ? 'Comparing...' : 'Compare'}
              </button>
              <button 
                onClick={() => { setShowDiffModal(false); setDiffResults(null); setCompareScanId(''); }}
                style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--notion-fg)', border: '1px solid var(--notion-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>

            {diffResults && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#27ae60', borderBottom: '1px solid rgba(39, 174, 96, 0.2)', paddingBottom: '4px' }}>New Findings ({diffResults.new?.length || diffResults.new_findings?.length || 0})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(diffResults.new || diffResults.new_findings)?.map((f, i) => (
                      <div key={i} style={{ padding: '12px', backgroundColor: 'rgba(39, 174, 96, 0.05)', border: '1px solid rgba(39, 174, 96, 0.2)', borderRadius: '6px', fontSize: '13px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', color: '#27ae60' }}>{f.key}</div>
                        <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', opacity: 0.9 }}>{typeof f.value === 'object' ? JSON.stringify(f.value) : f.value}</div>
                      </div>
                    ))}
                    {!(diffResults.new?.length || diffResults.new_findings?.length) && <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>No new findings discovered.</div>}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#7f8c8d', borderBottom: '1px solid rgba(127, 140, 141, 0.2)', paddingBottom: '4px' }}>Resolved Findings ({diffResults.resolved_findings?.length || 0})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {diffResults.resolved_findings?.map((f, i) => (
                      <div key={i} style={{ padding: '12px', backgroundColor: 'rgba(127, 140, 141, 0.05)', border: '1px solid rgba(127, 140, 141, 0.2)', borderRadius: '6px', fontSize: '13px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', textDecoration: 'line-through', color: '#7f8c8d' }}>{f.key}</div>
                        <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', textDecoration: 'line-through', opacity: 0.7 }}>{typeof f.value === 'object' ? JSON.stringify(f.value) : f.value}</div>
                      </div>
                    ))}
                    {!diffResults.resolved_findings?.length && <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>No findings were resolved.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
