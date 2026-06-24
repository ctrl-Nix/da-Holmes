import React, { useEffect, useRef } from 'react';
import { MapPin, Globe, Terminal, ShieldAlert, Cpu, Network } from 'lucide-react';
import styles from './IpIntel.module.css';

export default function IpIntel({ results, onInvestigate }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (results && results.latitude && results.longitude && window.L) {
      const lat = results.latitude;
      const lon = results.longitude;
      const label = `
        <div style="font-family: Inter, sans-serif; font-size: 12px; color: #37352f; line-height: 1.4;">
          <strong style="color: var(--notion-accent); display: flex; align-items: center; gap: 4px;"> Geolocation Resolved</strong>
          <span style="font-size: 11px; font-weight: 600; color: #4b4b4b;">${results.city}, ${results.region}, ${results.country}</span><br/>
          <span style="font-size: 10.5px; color: rgba(55, 53, 47, 0.7);">${lat.toFixed(6)}, ${lon.toFixed(6)}</span>
        </div>
      `;

      const timer = setTimeout(() => {
        const mapContainer = document.getElementById('ip-intel-map');
        if (!mapContainer) return;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = window.L.map('ip-intel-map').setView([lat, lon], 12);
        mapRef.current = map;

        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        const marker = window.L.marker([lat, lon]).addTo(map);
        marker.bindPopup(label).openPopup();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [results]);

  if (!results) return null;

  const { ip, city, region, country, org, asn, timezone, is_datacenter, ports_scan, reverse } = results;

  // Port scan parsing helper
  const parsePorts = (rawText) => {
    if (!rawText) return [];
    const ports = [];
    const lines = rawText.split('\n');
    const portRegex = /^(\d+\/[a-z]+)\s+(\S+)\s+(\S+)/;
    
    for (const line of lines) {
      const match = line.trim().match(portRegex);
      if (match) {
        ports.push({
          port: match[1],
          state: match[2],
          service: match[3]
        });
      }
    }
    return ports;
  };

  const parsedPorts = parsePorts(ports_scan);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleSec}>
          <span className={styles.icon}></span>
          <span className={styles.titleText}>Network Host Telemetry: <strong>{ip}</strong></span>
        </div>
        {is_datacenter && (
          <span className={styles.dcBadge}>
            <ShieldAlert size={12} style={{ marginRight: '4px' }} /> VPN/PROXY
          </span>
        )}
      </div>

      <div className={styles.grid2Col}>
        
        {/* Card 1: Geolocational Context */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <MapPin size={15} style={{ color: 'var(--notion-accent)' }} />
            <span>Geographical Core Coordinates</span>
          </div>
          <div className={styles.cardBody} style={{ padding: 0 }}>
            {results.latitude && results.longitude ? (
              <div id="ip-intel-map" className={styles.mapContainer}></div>
            ) : (
              <div className={styles.mapPlaceholder}>No geolocation metrics present.</div>
            )}
            <div style={{ padding: '16px' }}>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Location</span>
                <span className={styles.detailVal}>{city}, {region}, {country}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Time Zone</span>
                <span className={styles.detailVal}>{timezone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Autonomous Registry & Network Diagnostics */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Globe size={15} style={{ color: '#2b7a3e' }} />
            <span>Autonomous System & Active Ports</span>
          </div>
          <div className={styles.cardBody} style={{ padding: '16px' }}>
            <div className={styles.detailRow}>
              <span className={styles.detailKey}>ASN Identifier</span>
              <span className={`${styles.detailVal} ${styles.codeFont}`} style={{ color: 'var(--notion-accent)', fontWeight: 600 }}>{asn}</span>
            </div>
            <div className={styles.detailRow} style={{ borderBottom: 'none', marginBottom: '16px' }}>
              <span className={styles.detailKey}>Provider Org</span>
              <span className={styles.detailVal} style={{ fontWeight: 600 }}>{org}</span>
            </div>

            <span className={styles.subHeading}> Diagnostic Socket Mapping (Nmap Scan)</span>
            {parsedPorts.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.portsTable}>
                  <thead>
                    <tr>
                      <th>Port / Proto</th>
                      <th>State</th>
                      <th>Service Decoded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPorts.map((p, idx) => (
                      <tr key={idx}>
                        <td className={styles.codeFont} style={{ fontWeight: 600 }}>{p.port}</td>
                        <td>
                          <span className={p.state === 'open' ? styles.portOpen : styles.portClosed}>
                            {p.state}
                          </span>
                        </td>
                        <td className={styles.codeFont}>{p.service}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.terminalContainer}>
                <div className={styles.terminalHeader}>
                  <Terminal size={11} />
                  <span>Raw Nmap System Audit Terminal</span>
                </div>
                <pre className={styles.terminalBody}>
                  {ports_scan}
                </pre>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Reverse IP Records section if present */}
      {reverse && reverse.domains && reverse.domains.length > 0 && (
        <div className={styles.card} style={{ marginTop: '20px' }}>
          <div className={styles.cardHeader}>
            <Network size={15} style={{ color: '#e67e22' }} />
            <span>Associated Reverse IP Domain Resolution ({reverse.count} Domains)</span>
          </div>
          <div className={styles.cardBody} style={{ padding: '16px' }}>
            <div className={styles.tableWrapper}>
              <table className={styles.portsTable}>
                <thead>
                  <tr>
                    <th>Domain Name</th>
                    <th style={{ textAlign: 'right' }}>Active Core Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reverse.domains.map((dom, idx) => (
                    <tr key={idx}>
                      <td className={styles.codeFont} style={{ fontWeight: 600 }}>{dom}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => onInvestigate(dom)}
                          className={styles.investigateBtn}
                        >
                          🔍 Investigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
