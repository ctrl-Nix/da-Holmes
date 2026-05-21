import React, { useState, useEffect, useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, X } from 'lucide-react';
import { transformToGraphData } from '../utils/graphTransformer';

const NODE_COLORS = {
  Root: '#f59e0b', // Amber
  NetworkTarget: '#f59e0b',
  Domain: '#f59e0b',
  Platform: '#22d3ee', // Cyan
  Location: '#10b981', // Emerald
  Organization: '#6366f1', // Indigo
  Person: '#ec4899', // Pink
  ISP: '#8b5cf6', // Violet
  IP: '#ef4444', // Red
  Subdomain: '#06b6d4', // Darker Cyan
  Hostname: '#14b8a6', // Teal
  Default: '#94a3b8' // Slate
};

export default function GraphWidget({ rawData }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef(null);

  // Parse raw API data into graph structure when rawData changes
  useEffect(() => {
    if (rawData) {
      const filteredData = { ...rawData };
      
      // Filter out non-found entities if results are present
      if (rawData.results) {
        filteredData.results = rawData.results.filter(r => r.status === 'found');
      }
      
      // Also check platform_footprint just in case
      if (rawData.platform_footprint) {
        filteredData.platform_footprint = rawData.platform_footprint.filter(p => p.status === 'found' || p.found === true);
      }
      
      setGraphData(transformToGraphData(filteredData));
    }
  }, [rawData]);

  // Handle responsive sizing
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  // Node rendering customisation for "glow" effect
  const paintNode = (node, ctx, globalScale) => {
    const color = NODE_COLORS[node.type] || NODE_COLORS.Default;
    const size = node.type === 'Root' || node.type === 'Domain' || node.type === 'NetworkTarget' ? 8 : 4;

    // Outer glow
    ctx.beginPath();
    ctx.arc(node.x, node.y, size * 2.5, 0, 2 * Math.PI, false);
    ctx.fillStyle = `${color}33`; // 20% opacity
    ctx.fill();

    // Inner core
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    // Node Label
    const label = node.label;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cbd5e1'; // slate-300
    ctx.fillText(label, node.x, node.y + size + 6);
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full z-10 pointer-events-none p-4 flex justify-between items-start bg-gradient-to-b from-slate-950/80 to-transparent">
        <div className="flex items-center gap-2">
          <Network className="text-cyan-400" size={20} />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">
            Relationship Graph
          </h2>
        </div>
        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase border border-slate-800 bg-slate-900/50 px-2 py-1 rounded">
          {graphData.nodes.length} Entities / {graphData.links.length} Vectors
        </div>
      </div>

      {/* Force Graph Container */}
      <div ref={containerRef} className="flex-1 w-full h-full min-h-[500px]">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node, color, ctx) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
              ctx.fill();
            }}
            linkColor={() => '#334155'} // slate-700
            linkWidth={1.5}
            linkOpacity={0.6}
            onNodeClick={handleNodeClick}
            cooldownTicks={100} // Let it settle quickly for performance
            backgroundColor="#020617" // slate-950
          />
        ) : (
          <div className="flex w-full h-full items-center justify-center text-slate-600 font-mono text-xs uppercase tracking-widest">
            Awaiting Data...
          </div>
        )}
      </div>

      {/* Interactive Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.15)] z-20">
          <button 
            onClick={() => setSelectedNode(null)}
            className="absolute top-2 right-2 text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: NODE_COLORS[selectedNode.type] || NODE_COLORS.Default }}
            ></div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">{selectedNode.type}</h3>
          </div>
          
          <div className="flex flex-col gap-2 font-mono text-[10px]">
            <div className="flex justify-between border-b border-slate-800/50 pb-1">
              <span className="text-slate-500">ID</span>
              <span className="text-cyan-400 text-right truncate max-w-[180px]">{selectedNode.label}</span>
            </div>
            
            {/* Conditional Metadata Display */}
            {selectedNode.url && (
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-500">URL</span>
                <a href={selectedNode.url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline truncate max-w-[180px]">Link</a>
              </div>
            )}
            
            {selectedNode.data?.bio && selectedNode.data.bio !== 'Data not available' && (
              <div className="flex flex-col gap-1 border-b border-slate-800/50 pb-1">
                <span className="text-slate-500">Bio / Excerpt</span>
                <span className="text-slate-400 italic leading-relaxed">"{selectedNode.data.bio}"</span>
              </div>
            )}

            {selectedNode.coords && (
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-500">Coordinates</span>
                <span className="text-cyan-400">[{selectedNode.coords.join(', ')}]</span>
              </div>
            )}
            
            {/* Fallback if no specific metadata */}
            {!selectedNode.url && !selectedNode.coords && (!selectedNode.data || selectedNode.data.bio === 'Data not available') && (
              <div className="text-slate-600 italic text-center py-2">
                No advanced telemetry available.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
