import React from 'react';
import { Car, Hash, MapPin, Wrench, Flame, AlertTriangle } from 'lucide-react';

export default function VehicleRecon({ results }) {
  if (!results) return null;

  const { vin, error, make, model, year, body_class, engine_cylinders, engine_hp, fuel_type, drive_type, plant_country, plant_city, manufacturer, vehicle_type } = results;

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Car size={16} /> VIN OSINT Decoder
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 700, 
          backgroundColor: error ? 'rgba(202, 44, 44, 0.1)' : 'rgba(43, 122, 62, 0.1)', 
          color: error ? '#ca2c2c' : '#2b7a3e',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          textTransform: 'uppercase'
        }}>
          {error ? 'DECODE FAILED' : 'DECODED'}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--notion-fg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Hash size={20} style={{ color: 'var(--notion-accent)' }} /> {vin}
        </div>

        {error ? (
          <div style={{ padding: '12px', border: '1px solid rgba(202, 44, 44, 0.2)', borderRadius: '6px', backgroundColor: 'rgba(202, 44, 44, 0.02)', color: '#ca2c2c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            
            {/* Primary Details */}
            <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
                <Car size={14} /> Vehicle Specification
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>
                {year} {make} {model}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(55,53,47,0.6)', marginTop: '4px' }}>
                {body_class} | {vehicle_type}
              </div>
            </div>

            {/* Engine & Power */}
            <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
                <Flame size={14} /> Powertrain
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {fuel_type && <div><strong>Fuel:</strong> {fuel_type}</div>}
                {engine_cylinders && <div><strong>Cylinders:</strong> {engine_cylinders}</div>}
                {engine_hp && <div><strong>Power:</strong> {engine_hp} HP</div>}
                {drive_type && <div><strong>Drive:</strong> {drive_type}</div>}
              </div>
            </div>

            {/* Manufacturing Origin */}
            <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
                <MapPin size={14} /> Origin & Assembly
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {manufacturer && <div><strong>Mfr:</strong> {manufacturer}</div>}
                {(plant_city || plant_country) && (
                  <div>
                    <strong>Plant:</strong> {plant_city ? `${plant_city}, ` : ''}{plant_country}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--notion-sidebar)', borderTop: '1px solid var(--notion-border)', fontSize: '11px', color: 'rgba(55,53,47,0.5)', textAlign: 'right' }}>
        Intelligence powered by US Dept of Transportation (NHTSA)
      </div>
    </div>
  );
}
