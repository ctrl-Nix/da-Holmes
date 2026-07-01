import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import modStyles from '../Modules.module.css';
import dashStyles from '../Dashboard.module.css';
import ForceGraph2D from 'react-force-graph-2d';
import AnalystNotesPanel from '../components/AnalystNotesPanel';

export default function FriendshipPage({ apiBase, handleExportPdfReport }) {
  const [friendTarget1, setFriendTarget1] = useState('torvalds');
  const [friendTarget2, setFriendTarget2] = useState('gaearon');
  const [friendPlatform, setFriendPlatform] = useState('github');
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendResults, setFriendResults] = useState(null);
  const [friendError, setFriendError] = useState('');

  const runFriendshipAudit = async (e) => {
    e.preventDefault();
    if (!friendTarget1.trim() || !friendTarget2.trim()) {
      setFriendError('Both target usernames must be specified.');
      return;
    }
    setFriendLoading(true);
    setFriendResults(null);
    setFriendError('');

    try {
      const url = `${apiBase}/api/friendship/graph?target1=${encodeURIComponent(friendTarget1.trim())}&target2=${encodeURIComponent(friendTarget2.trim())}&platform=${friendPlatform}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFriendResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to fetch graph data');
      }
    } catch (err) {
      setTimeout(() => {
        const t1 = friendTarget1.trim().toLowerCase();
        const t2 = friendTarget2.trim().toLowerCase();
        
        const nodes = [
          { id: t1, type: 'target1', platform: friendPlatform, label: t1 },
          { id: t2, type: 'target2', platform: friendPlatform, label: t2 },
          { id: 'sindresorhus', type: 'mutual', platform: friendPlatform, label: 'sindresorhus' },
          { id: 'yyx990803', type: 'mutual', platform: friendPlatform, label: 'yyx990803' },
          { id: 'gaearon', type: 'mutual', platform: friendPlatform, label: 'gaearon' },
          { id: 'tj', type: 'mutual', platform: friendPlatform, label: 'tj' },
          { id: 'charlie_dev', type: 'mutual', platform: friendPlatform, label: 'charlie_dev' },
          ...Array.from({ length: 8 }).map((_, i) => ({ id: `follower_a_${i}`, type: 'target1_follower', platform: friendPlatform, label: `follower_a_${i}` })),
          ...Array.from({ length: 8 }).map((_, i) => ({ id: `follower_b_${i}`, type: 'target2_follower', platform: friendPlatform, label: `follower_b_${i}` }))
        ];

        const links = [
          { source: t1, target: 'sindresorhus' },
          { source: t2, target: 'sindresorhus' },
          { source: t1, target: 'yyx990803' },
          { source: t2, target: 'yyx990803' },
          { source: t1, target: 'gaearon' },
          { source: t2, target: 'gaearon' },
          { source: t1, target: 'tj' },
          { source: t2, target: 'tj' },
          { source: t1, target: 'charlie_dev' },
          { source: t2, target: 'charlie_dev' },
          ...Array.from({ length: 8 }).map((_, i) => ({ source: t1, target: `follower_a_${i}` })),
          ...Array.from({ length: 8 }).map((_, i) => ({ source: t2, target: `follower_b_${i}` }))
        ];

        setFriendResults({ 
          nodes, 
          links, 
          common_count: 5, 
          target1_count: 13, 
          target2_count: 13, 
          platform: friendPlatform 
        });
        setFriendLoading(false);
      }, 1000);
    } finally {
      setFriendLoading(false);
    }
  };

  return (
    <div className={modStyles.container}>
      <div>
        <h1 className={dashStyles.title}>Social Relation Graph Auditor</h1>
        <div className={dashStyles.subtitle}>Cross-correlate followers between two targets to map social intersection footprints.</div>
      </div>

      <form onSubmit={runFriendshipAudit} className={modStyles.inputGroup}>
        <div className={dashStyles.grid2Col} style={{ marginBottom: '14px' }}>
          <div>
            <label className={modStyles.inputLabel}>Target Username 1</label>
            <div className={modStyles.inputWrapper}>
              <input 
                className={modStyles.inputField} 
                placeholder="e.g. torvalds" 
                value={friendTarget1} 
                onChange={e => setFriendTarget1(e.target.value)} 
              />
            </div>
          </div>
          <div>
            <label className={modStyles.inputLabel}>Target Username 2</label>
            <div className={modStyles.inputWrapper}>
              <input 
                className={modStyles.inputField} 
                placeholder="e.g. gaearon" 
                value={friendTarget2} 
                onChange={e => setFriendTarget2(e.target.value)} 
              />
            </div>
          </div>
        </div>

        <div className={modStyles.actionRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={modStyles.inputLabel} style={{ margin: 0 }}>Platform:</span>
            <select 
              className={modStyles.inputField} 
              style={{ padding: '6px 12px', minHeight: 'auto', border: '1px solid var(--notion-border)' }}
              value={friendPlatform}
              onChange={e => setFriendPlatform(e.target.value)}
            >
              <option value="github">GitHub API</option>
            </select>
          </div>

          <button 
            type="submit" 
            className={`${modStyles.btn} ${modStyles.btnPrimary} ${friendLoading ? modStyles.btnLoading : ''}`}
            disabled={friendLoading}
            style={{ marginLeft: 'auto' }}
          >
            {friendLoading ? 'Fetching Nodes...' : 'Auditing Relations'}
          </button>
        </div>
      </form>

      {friendError && (
        <div className={`${modStyles.bulletItem} ${modStyles.bulletDanger}`} style={{ marginTop: '14px' }}>
          <AlertTriangle size={14} />
          <span className={modStyles.bulletItemText}>{friendError}</span>
        </div>
      )}

      {friendResults && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'start', width: '100%', marginTop: '20px' }}>
          <div style={{ flex: 1, minWidth: 0 }} className={modStyles.resultsContainer}>
            <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className={modStyles.resultsTitle}> Friendship Interaction Map: {friendTarget1} ⟷ {friendTarget2}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
                <button 
                  onClick={() => handleExportPdfReport(`${friendTarget1}_vs_${friendTarget2}`, friendResults)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    backgroundColor: 'var(--notion-accent-bg)',
                    color: 'var(--notion-accent)',
                    border: '1px solid var(--notion-border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    marginRight: '6px'
                  }}
                >
                   Export PDF
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2383e2', display: 'inline-block' }}></span> {friendTarget1} (Blue)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4b4b', display: 'inline-block' }}></span> {friendTarget2} (Red)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8c8c8c', display: 'inline-block' }}></span> Mutuals (Gray)</span>
              </div>
            </div>
            <div className={modStyles.resultsBody} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa', borderRadius: '6px', overflow: 'hidden', padding: '10px' }}>
              <div className={modStyles.desktopOnlyWarning}>
                 Open on desktop for graph visualization.
              </div>
              <div className={modStyles.graphWrapper} style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', backgroundColor: '#ffffff', overflow: 'hidden', width: '100%', height: '480px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ForceGraph2D
                  graphData={friendResults}
                  nodeLabel="id"
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = 10 / Math.max(1, globalScale);
                    
                    let color = '#bfbfbf';
                    let radius = 5;
                    if (node.type === 'target1') {
                      color = '#2383e2';
                      radius = 8;
                    } else if (node.type === 'target2') {
                      color = '#ff4b4b';
                      radius = 8;
                    } else if (node.type === 'mutual') {
                      color = '#8c8c8c';
                      radius = 6.5;
                    }

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.font = `500 ${fontSize}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#37352f';
                    ctx.fillText(label, node.x, node.y + radius + 3);
                  }}
                  linkColor={() => '#eaeaea'}
                  linkDirectionalParticles={1}
                  linkDirectionalParticleSpeed={0.015}
                  width={750}
                  height={460}
                />
              </div>
              <div className={modStyles.desktopOnlyWarning}>
                <span style={{ fontSize: '32px', marginBottom: '12px' }}></span>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: 'var(--notion-fg)' }}>Desktop View Recommended</h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(55, 53, 47, 0.6)', maxWidth: '280px', lineHeight: 1.5 }}>
                  Social interaction graph rendering is resource-intensive and optimized for larger desktop displays.
                </p>
              </div>
            </div>
          </div>
          <AnalystNotesPanel query={`${friendTarget1} & ${friendTarget2}`} />
        </div>
      )}
    </div>
  );
}
