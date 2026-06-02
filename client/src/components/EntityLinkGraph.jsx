import React, { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network } from 'lucide-react';

export default function EntityLinkGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('holmes_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const res = await fetch(`${API_BASE}/api/entity/links`, { headers });
        if (res.ok) {
          const data = await res.json();
          
          const nodes = [];
          const links = [];
          const nodeMap = new Set();
          
          data.cross_target_links.forEach(link => {
            const sharedValueNodeId = `shared_${link.shared_value}`;
            if (!nodeMap.has(sharedValueNodeId)) {
              nodes.push({ id: sharedValueNodeId, name: link.shared_value, group: 'shared', val: link.connection_count * 2 });
              nodeMap.add(sharedValueNodeId);
            }
            
            link.connected_targets.forEach(target => {
              if (!nodeMap.has(target)) {
                nodes.push({ id: target, name: target, group: 'target', val: 5 });
                nodeMap.add(target);
              }
              
              links.push({
                source: target,
                target: sharedValueNodeId,
                label: link.attribute_type
              });
            });
          });
          
          setGraphData({ nodes, links });
        }
      } catch (err) {
        console.error("Failed to fetch entity links", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLinks();
  }, []);

  if (loading) return <div>Loading Entity Links...</div>;

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--notion-border)', marginTop: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#fff' }}>
          <Network size={18} color="#2383e2" /> Cross-Workspace Entity Link Analysis
        </h3>
        <p style={{ color: '#aaa', fontSize: '12px', margin: '4px 0 0 0' }}>
          Automatically maps overlapping IP addresses, emails, and tracking codes across entirely different investigations.
        </p>
      </div>
      
      <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel="name"
            nodeColor={node => node.group === 'target' ? '#e83e8c' : '#20c997'}
            linkColor={() => 'rgba(255,255,255,0.2)'}
            backgroundColor="#191A1A"
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            No cross-target links discovered yet. Run more scans to build the intelligence graph.
          </div>
        )}
      </div>
    </div>
  );
}
