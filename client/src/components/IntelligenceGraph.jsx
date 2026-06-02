import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// Color map for node types
const NODE_COLORS = {
  ip: '#e74c3c',
  domain: '#3498db',
  email: '#f1c40f',
  breach: '#9b59b6',
  phone: '#2ecc71',
  username: '#e67e22',
  default: '#95a5a6'
};

export default function IntelligenceGraph({ data }) {
  const fgRef = useRef();
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef();

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setContainerDimensions({ width: clientWidth, height: clientHeight || 600 });
    }
    
    // Setup resize observer
    const observer = new ResizeObserver(entries => {
      if (entries.length > 0) {
        setContainerDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height || 600
        });
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleNodeClick = useCallback(node => {
    // Center/zoom on node
    fgRef.current.centerAt(node.x, node.y, 1000);
    fgRef.current.zoom(3, 2000);
  }, [fgRef]);

  // Custom node rendering for better aesthetics
  const paintNode = useCallback((node, ctx, globalScale) => {
    const label = node.label || node.id;
    const fontSize = 12/globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = NODE_COLORS[node.type] || NODE_COLORS.default;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw label
    if (globalScale > 1.5) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#333';
      ctx.fillText(label, node.x, node.y + 10);
    }
  }, []);

  const paintLink = useCallback((link, ctx, globalScale) => {
    const start = link.source;
    const end = link.target;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.4)';
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();

    // Draw label if zoomed in enough
    if (link.label && globalScale > 2) {
      const x = start.x + (end.x - start.x) / 2;
      const y = start.y + (end.y - start.y) / 2;
      const fontSize = 8 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(link.label, x, y);
    }
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '500px', backgroundColor: '#fcfcfc', borderRadius: '12px', border: '1px solid var(--notion-border)', overflow: 'hidden' }}>
      <ForceGraph2D
        ref={fgRef}
        width={containerDimensions.width}
        height={containerDimensions.height}
        graphData={data}
        nodeLabel="id"
        nodeColor={node => NODE_COLORS[node.type] || NODE_COLORS.default}
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        onNodeClick={handleNodeClick}
        cooldownTicks={100}
        d3VelocityDecay={0.3}
        linkColor={() => 'rgba(150, 150, 150, 0.4)'}
      />
      
      {/* Legend */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Entity Types</div>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          type !== 'default' && (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></span>
              <span style={{ textTransform: 'capitalize' }}>{type}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
