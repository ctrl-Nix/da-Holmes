import React from 'react';
import { Server, MapPin, CheckCircle, Target, Tag } from 'lucide-react';

export default function MacDecoder({ results }) {
  if (!results) return null;

  const { mac_address, prefix, vendor, address, country, block_type } = results;

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Server size={16} /> MAC Address Vendor Decoder
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 700, 
          backgroundColor: 'rgba(43, 122, 62, 0.1)', 
          color: '#2b7a3e',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          textTransform: 'uppercase'
        }}>
          {vendor ? 'OUI MATCHED' : 'UNKNOWN VENDOR'}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--notion-fg)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
            {mac_address}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px', backgroundColor: 'var(--notion-sidebar)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Tag size={14} /> Hardware Vendor
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--notion-fg)' }}>
              {vendor || "Unknown / Private"}
            </div>
            {prefix && (
              <div style={{ fontSize: '12px', color: 'rgba(55,53,47,0.6)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Target size={12}/> Prefix (OUI): {prefix}
              </div>
            )}
          </div>

          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <MapPin size={14} /> Vendor Location
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>
                {address || "Address details unavailable"}
              </div>
              {country && (
                <div style={{ fontSize: '12px', color: 'rgba(55,53,47,0.6)' }}>
                  <strong>Country Code:</strong> {country}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--notion-sidebar)', borderTop: '1px solid var(--notion-border)', fontSize: '11px', color: 'rgba(55,53,47,0.5)', textAlign: 'right' }}>
        Intelligence powered by IEEE OUI Registry (maclookup.app)
      </div>
    </div>
  );
}
