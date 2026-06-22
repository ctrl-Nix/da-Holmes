import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Globe } from 'lucide-react';
import styles from './GeoMap.module.css';

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A custom red icon for critical targets
const threatIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function GeoMap({ findings = [] }) {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // Process findings to extract coordinates
    // We expect some findings to have geo data like: { key: "geo_lat", value: "37.7749" }
    // or { key: "location", value: "San Francisco, CA" } which we'd need to geocode.
    // For this prototype, we'll look for explicitly passed lat/lon in the findings.
    
    let extractedMarkers = [];
    
    // As a demonstration, if findings is empty, let's just show a global view.
    // In a real scan, geoint modules return lat/lon pairs.
    
    findings.forEach(f => {
        if (f.lat && f.lon) {
            extractedMarkers.push({
                lat: parseFloat(f.lat),
                lon: parseFloat(f.lon),
                label: f.label || "Target IP",
                details: f.details || f.value || ""
            });
        }
    });
    
    // Add some mock data if empty for the dashboard preview
    if (extractedMarkers.length === 0) {
        extractedMarkers = [
            { lat: 51.505, lon: -0.09, label: "Proxy Node", details: "London" },
            { lat: 40.7128, lon: -74.0060, label: "Target Server", details: "New York" },
            { lat: 35.6895, lon: 139.6917, label: "VPN Exit", details: "Tokyo" },
            { lat: -33.8688, lon: 151.2093, label: "Database Host", details: "Sydney" }
        ];
    }

    setMarkers(extractedMarkers);
  }, [findings]);

  return (
    <div className={styles.mapContainer}>
      <div className={styles.header}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Globe size={18} color="#2383e2" /> Live Geo-Tracker Map
        </h3>
      </div>
      
      <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--notion-border)' }}>
        <MapContainer 
            center={[20, 0]} 
            zoom={2} 
            style={{ height: '100%', width: '100%', background: '#191A1A' }}
            scrollWheelZoom={false}
        >
          {/* Using CartoDB Dark Matter tile layer for a "hacker" OSINT feel */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {markers.map((marker, idx) => (
            <Marker key={idx} position={[marker.lat, marker.lon]} icon={threatIcon}>
              <Popup>
                <div style={{ color: '#333' }}>
                    <strong style={{ display: 'block', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '4px' }}>
                        {marker.label}
                    </strong>
                    <span style={{ fontSize: '12px' }}>{marker.details}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
