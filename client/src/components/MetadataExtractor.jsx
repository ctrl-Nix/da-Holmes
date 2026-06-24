import React from 'react';
import { FileSearch, FileText, Calendar, User, Info, Hash } from 'lucide-react';
import MapVisualizer from './MapVisualizer';

export default function MetadataExtractor({ results }) {
  if (!results || !results.metadata) return null;

  const { filename, metadata, count, message } = results;

  // Extract Lat/Lon from metadata if it exists
  let lat = null;
  let lon = null;
  
  // Example of how backend might send GPS coords:
  // GPSInfo: "20.350800, 85.815700" or similar
  const gpsVal = metadata['GPSInfo'] || metadata['gps'] || metadata['GPSPosition'] || metadata['gps_coordinates'];
  if (gpsVal && typeof gpsVal === 'string' && gpsVal.includes(',')) {
    const parts = gpsVal.split(',');
    if (parts.length >= 2) {
      lat = parts[0].trim();
      lon = parts[1].trim();
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <FileSearch size={16} /> Document Metadata: {filename}
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 700, 
          backgroundColor: 'rgba(35, 131, 226, 0.1)', 
          color: '#2383e2',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Hash size={12}/> {count} FIELDS RECOVERED
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {message && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--notion-sidebar)', borderRadius: '6px', fontSize: '13px', fontStyle: 'italic', color: 'rgba(55,53,47,0.7)' }}>
            {message}
          </div>
        )}

        {count > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {Object.entries(metadata).map(([key, value], idx) => {
              // Beautify keys
              const displayKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
              const formattedKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);
              
              let icon = <Info size={14} />;
              if (key.toLowerCase().includes('author') || key.toLowerCase().includes('creator')) icon = <User size={14} />;
              if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key.toLowerCase().includes('created') || key.toLowerCase().includes('modified')) icon = <Calendar size={14} />;
              if (key.toLowerCase().includes('title') || key.toLowerCase().includes('subject')) icon = <FileText size={14} />;

              return (
                <div key={idx} style={{ padding: '10px 14px', border: '1px solid var(--notion-border)', borderRadius: '6px', backgroundColor: 'var(--notion-sidebar)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.6)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {icon} {formattedKey}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, wordBreak: 'break-all' }}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--notion-border)', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}></div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>No hidden metadata found</div>
            <div style={{ fontSize: '12px', color: 'rgba(55, 53, 47, 0.6)', marginTop: '4px' }}>
              This document has been thoroughly sanitized or doesn't contain standard metadata fields.
            </div>
          </div>
        )}

        {/* Map Visualizer */}
        {lat && lon && (
          <MapVisualizer lat={lat} lon={lon} label={filename} />
        )}

      </div>
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--notion-sidebar)', borderTop: '1px solid var(--notion-border)', fontSize: '11px', color: 'rgba(55,53,47,0.5)', textAlign: 'right' }}>
        Local processing — Document contents are not stored.
      </div>
    </div>
  );
}
