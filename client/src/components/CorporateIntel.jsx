import React from 'react';
import { Building2, MapPin, Calendar, CheckCircle2, FileText } from 'lucide-react';

export default function CorporateIntel({ results }) {
  if (!results) return null;

  const { company_name, jurisdiction_code, incorporation_date, current_status, registered_address_in_full } = results;

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Building2 size={16} /> Corporate Entity Intelligence
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
          gap: '4px',
          textTransform: 'uppercase'
        }}>
          {current_status || "Unknown Status"}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--notion-fg)' }}>
          {company_name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '4px', textTransform: 'uppercase' }}>
              <FileText size={14} /> Jurisdiction
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              {jurisdiction_code ? jurisdiction_code.toUpperCase() : "Unknown"}
            </div>
          </div>

          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '4px', textTransform: 'uppercase' }}>
              <Calendar size={14} /> Incorporation Date
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              {incorporation_date || "Unknown"}
            </div>
          </div>

        </div>

        {registered_address_in_full && (
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <MapPin size={14} /> Registered Address
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: '1.5' }}>
              {registered_address_in_full}
            </div>
          </div>
        )}

      </div>
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--notion-sidebar)', borderTop: '1px solid var(--notion-border)', fontSize: '11px', color: 'rgba(55,53,47,0.5)', textAlign: 'right' }}>
        Intelligence powered by OpenCorporates API
      </div>
    </div>
  );
}
