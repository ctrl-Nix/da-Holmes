import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Search, Loader2, Crosshair, RefreshCw, ZoomIn, ZoomOut, Database, Wifi } from 'lucide-react';
import modStyles from '../Modules.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MaltegoGraph() {
  const [seed, setSeed] = useState('');
  const [seedType, setSeedType] = useState('domain');
  const [isLive, setIsLive] = useState(false);
  
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const graphRef = useRef();

  // Helper to get color by node type
  const getNodeColor = (type) => {
    switch(type) {
      case 'domain': return '#2383e2'; // Blue
      case 'ip': return '#ff4b4b'; // Red
      case 'email': return '#e67e22'; // Orange
      case 'breach': return '#2c3e50'; // Dark Slate
      case 'asn': return '#8e44ad'; // Purple
      case 'location': return '#27ae60'; // Green
      default: return '#95a5a6'; // Gray
    }
  };

  const getNodeIcon = (type) => {
    switch(type) {
      case 'domain': return '🌐';
      case 'ip': return '🖥️';
      case 'email': return '📧';
      case 'breach': return '☠️';
      case 'asn': return '🏢';
      case 'location': return '📍';
      default: return '📄';
    }
  };

  const expandNode = async (nodeId, nodeType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/graph/expand?node_id=${encodeURIComponent(nodeId)}&node_type=${encodeURIComponent(nodeType)}&live=${isLive}`);
      if (!res.ok) throw new Error("Failed to expand node");
      
      const data = await res.json();
      
      setGraphData(prev => {
        const newNodes = [...prev.nodes];
        const newLinks = [...prev.links];
        
        // Merge nodes
        data.nodes.forEach(n => {
          if (!newNodes.find(pn => pn.id === n.id)) {
            newNodes.push(n);
          }
        });
        
        // Merge links
        data.links.forEach(l => {
          if (!newLinks.find(pl => pl.source === l.source && pl.target === l.target)) {
            newLinks.push(l);
          }
        });
        
        return { nodes: newNodes, links: newLinks };
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runLiveRecon = (target, type) => {
    setLoading(true);
    setError(null);
    
    const es = new EventSource(`${API_BASE}/api/pivot?target=${encodeURIComponent(target)}&type=${encodeURIComponent(type)}&save=false`);
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'complete') {
          setLoading(false);
          es.close();
          return;
        }
        
        // Extract pivot data
        const nodeType = data.event ? data.event.replace('_found', '') : 'unknown';
        const nodeId = data.value;
        const sourceId = data.source;
        
        setGraphData(prev => {
          const newNodes = [...prev.nodes];
          const newLinks = [...prev.links];
          
          if (!newNodes.find(n => n.id === nodeId)) {
            newNodes.push({ id: nodeId, type: nodeType, label: nodeId });
          }
          
          if (sourceId !== 'user_input') {
            if (!newLinks.find(l => (l.source.id === sourceId || l.source === sourceId) && (l.target.id === nodeId || l.target === nodeId))) {
              newLinks.push({ source: sourceId, target: nodeId });
            }
          }
          
          return { nodes: newNodes, links: newLinks };
        });
        
      } catch (err) {
        console.error("SSE Parse error", err);
      }
    };
    
    es.onerror = () => {
      es.close();
      setLoading(false);
      setError("Live recon stream disconnected or completed.");
    };
  };

  const handleSeedSubmit = (e) => {
    e.preventDefault();
    if (!seed.trim()) return;
    
    // Reset graph with seed node
    const seedNode = { id: seed.trim(), type: seedType, label: seed.trim() };
    setGraphData({ nodes: [seedNode], links: [] });
    
    if (isLive) {
      runLiveRecon(seed.trim(), seedType);
    } else {
      expandNode(seedNode.id, seedNode.type);
    }
  };

  const handleNodeClick = useCallback((node) => {
    if (isLive) {
      runLiveRecon(node.id, node.type);
    } else {
      expandNode(node.id, node.type);
    }
  }, [isLive]);

  return (
    <div className={modStyles.container} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crosshair size={24} color="var(--notion-accent)" /> Interactive Relation Graph (Maltego Mode)
        </h1>
        <div style={{ fontSize: '13px', color: 'rgba(55,53,47,0.6)' }}>
          Start with a seed target and click nodes to recursively map infrastructure, breaches, and personnel.
        </div>
      </div>

      <form onSubmit={handleSeedSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--notion-sidebar)', padding: '16px', borderRadius: '8px', border: '1px solid var(--notion-border)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#666' }}>Target Type</label>
          <select 
            value={seedType} 
            onChange={e => setSeedType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--notion-border)', fontSize: '13px' }}
          >
            <option value="domain">Domain / Host</option>
            <option value="ip">IP Address</option>
            <option value="email">Email Address</option>
          </select>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#666' }}>Seed Target</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: '#999' }} />
            <input 
              type="text" 
              placeholder="e.g. microsoft.com" 
              value={seed}
              onChange={e => setSeed(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '4px', border: '1px solid var(--notion-border)', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#666' }}>Resolution Mode</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '4px', backgroundColor: isLive ? '#ffebee' : '#e3f2fd', border: `1px solid ${isLive ? '#ffcdd2' : '#bbdefb'}`, cursor: 'pointer' }} onClick={() => setIsLive(!isLive)}>
            {isLive ? <Wifi size={14} color="#e53935" /> : <Database size={14} color="#1e88e5" />}
            <span style={{ fontSize: '12px', fontWeight: 600, color: isLive ? '#e53935' : '#1e88e5' }}>
              {isLive ? "Live Recon" : "SQLite Database"}
            </span>
          </div>
        </div>

        <div style={{ alignSelf: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '8px 24px', 
              backgroundColor: 'var(--notion-accent)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '14px', 
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '36px'
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
            Initialize Graph
          </button>
        </div>
      </form>

      {error && (
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⚠️</span> {error}
        </div>
      )}

      {/* Graph Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        {['domain', 'ip', 'email', 'breach', 'asn', 'location'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getNodeColor(t) }}></div>
            {t}
          </div>
        ))}
      </div>

      {/* Graph Canvas */}
      <div style={{ flex: 1, marginTop: '16px', border: '1px solid var(--notion-border)', borderRadius: '8px', backgroundColor: '#fafafa', position: 'relative', overflow: 'hidden', minHeight: '500px' }}>
        
        {/* Controls Overlay */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
          <button onClick={() => graphRef.current?.zoomToFit(400)} title="Center Graph" style={{ padding: '8px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}><Crosshair size={16} color="#666" /></button>
          <button onClick={() => setGraphData({nodes: [], links: []})} title="Clear Canvas" style={{ padding: '8px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}><RefreshCw size={16} color="#666" /></button>
        </div>

        {graphData.nodes.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', color: '#999' }}>
            <Crosshair size={48} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: '14px' }}>Enter a seed target to generate the intelligence map.</div>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel="label"
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.label || node.id;
              const fontSize = 12 / Math.max(1, globalScale);
              
              const color = getNodeColor(node.type);
              const icon = getNodeIcon(node.type);
              const radius = 8;

              // Node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();
              
              // Node border
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Icon inside node (simplified)
              ctx.font = `6px Arial`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#fff';
              ctx.fillText(icon, node.x, node.y);

              // Text Label under node
              ctx.font = `500 ${fontSize}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillStyle = '#37352f';
              
              // Text background for readability
              const textWidth = ctx.measureText(label).width;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(node.x - textWidth/2 - 2, node.y + radius + 2, textWidth + 4, fontSize + 2);
              
              ctx.fillStyle = '#37352f';
              ctx.fillText(label, node.x, node.y + radius + 3);
            }}
            linkColor={() => '#c1c1c1'}
            linkWidth={1}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={handleNodeClick}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current?.zoomToFit(400, 20)}
          />
        )}
      </div>
      
      {/* Loading overlay for node expansion */}
      {loading && graphData.nodes.length > 0 && (
        <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(35, 131, 226, 0.9)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Loader2 size={14} className="animate-spin" /> Resolving relationships...
        </div>
      )}
    </div>
  );
}
