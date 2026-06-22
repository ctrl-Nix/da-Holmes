import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function TimelineView({ target }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!target) return;
    
    const fetchTimeline = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('holmes_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const res = await fetch(`${API_BASE}/api/timeline/events?target=${encodeURIComponent(target)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setEvents(data.timeline);
        }
      } catch (err) {
        console.error("Failed to fetch timeline", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeline();
  }, [target]);

  if (!target) return null;

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--notion-border)', marginTop: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#fff' }}>
          <Clock size={18} color="#2383e2" /> Discovery Timeline
        </h3>
        <p style={{ color: '#aaa', fontSize: '12px', margin: '4px 0 0 0' }}>
          Chronological sequence of intelligence discovery for {target}.
        </p>
      </div>
      
      {loading ? (
        <div style={{ color: '#666' }}>Reconstructing timeline...</div>
      ) : events.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
          {events.map((ev, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2383e2', marginTop: '6px' }}></div>
                {idx < events.length - 1 && <div style={{ width: '2px', height: '100%', backgroundColor: '#333', flexGrow: 1, marginTop: '4px' }}></div>}
              </div>
              <div style={{ backgroundColor: '#191A1A', padding: '12px', borderRadius: '8px', border: '1px solid #333', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>{new Date(ev.timestamp).toLocaleString()}</span>
                  <span style={{ fontSize: '10px', backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>
                    {ev.event_type}
                  </span>
                </div>
                <div style={{ color: '#e0e0e0', fontSize: '14px', wordBreak: 'break-word' }}>
                  {ev.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: '#666', padding: '20px 0' }}>No timeline events recorded for this target yet.</div>
      )}
    </div>
  );
}
