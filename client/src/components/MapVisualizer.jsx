import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix Leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapVisualizer({ lat, lon, label }) {
  if (!lat || !lon) return null;
  const position = [parseFloat(lat), parseFloat(lon)];

  return (
    <div style={{ marginTop: '16px', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'var(--notion-sidebar)', borderBottom: '1px solid var(--notion-border)', fontWeight: 600, fontSize: '14px' }}>
        <MapPin size={16} color="#e74c3c" /> GPS Location Extracted
      </div>
      <div style={{ height: '300px', width: '100%', position: 'relative', zIndex: 1 }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              {label || "Extracted GPS Coordinate"} <br/>
              Lat: {lat}, Lon: {lon}
            </Popup>
          </Marker>
          <ChangeView center={position} zoom={13} />
        </MapContainer>
      </div>
    </div>
  );
}
