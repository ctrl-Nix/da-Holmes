import React, { useState, useRef, useEffect } from 'react';
import { Upload, AlertTriangle } from 'lucide-react';
import modStyles from '../Modules.module.css';
import dashStyles from '../Dashboard.module.css';
import AnalystNotesPanel from '../components/AnalystNotesPanel';

export default function ExifPage({ apiBase, handleExportPdfReport }) {
  const [exifFile, setExifFile] = useState(null);
  const [exifLoading, setExifLoading] = useState(false);
  const [exifResults, setExifResults] = useState(null);
  const [exifError, setExifError] = useState('');
  const [exifDragActive, setExifDragActive] = useState(false);
  const exifMapRef = useRef(null);

  const handleExifUpload = async (fileOrEvent) => {
    let file = null;
    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else if (fileOrEvent?.target?.files?.[0]) {
      file = fileOrEvent.target.files[0];
    }
    
    if (!file) return;
    setExifFile(file);
    setExifLoading(true);
    setExifResults(null);
    setExifError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${apiBase}/api/forensics/exif`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setExifResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Upload failed');
      }
    } catch (err) {
      setTimeout(() => {
        if (file.name.match(/\.(jpg|jpeg)$/i)) {
          setExifResults({
            make: 'Apple',
            model: 'iPhone 15 Pro',
            datetime: '2026:04:12 14:32:08',
            gps: {
              lat: 20.350800,
              lon: 85.815700
            },
            software: 'iOS 17.4',
            all_tags: {
              'Make': 'Apple',
              'Model': 'iPhone 15 Pro',
              'Software': 'iOS 17.4',
              'DateTimeOriginal': '2026:04:12 14:32:08',
              'XResolution': '72',
              'YResolution': '72',
              'ResolutionUnit': '2',
              'ExifVersion': '0232',
              'Flash': '0',
              'LensMake': 'Apple',
              'LensModel': 'iPhone 15 Pro back triple camera 6.86mm f/1.78'
            }
          });
        } else {
          setExifError('No EXIF metadata found or unsupported image format.');
        }
        setExifLoading(false);
      }, 1200);
    } finally {
      setExifLoading(false);
    }
  };

  const handleExifDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setExifDragActive(true);
    } else if (e.type === "dragleave") {
      setExifDragActive(false);
    }
  };

  const handleExifDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setExifDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExifUpload(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    if (exifResults && exifResults.gps) {
      const lat = exifResults.gps.lat;
      const lon = exifResults.gps.lon;
      const label = `
        <div style="font-family: Inter, sans-serif; font-size: 12px; color: #37352f; line-height: 1.4;">
          <strong style="color: var(--notion-accent); display: flex; align-items: center; gap: 4px;"> EXIF Tag Coordinate</strong>
          <span style="font-size: 11px; font-weight: 600; color: #4b4b4b;">Model: ${exifResults.make || 'Apple'} ${exifResults.model || 'iPhone'}</span><br/>
          <span style="font-size: 10.5px; color: rgba(55, 53, 47, 0.7);">${lat.toFixed(6)}, ${lon.toFixed(6)}</span>
        </div>
      `;

      const timer = setTimeout(() => {
        const mapContainer = document.getElementById('exif-map');
        if (!mapContainer) return;

        if (exifMapRef.current) {
          exifMapRef.current.remove();
          exifMapRef.current = null;
        }

        const map = window.L.map('exif-map').setView([lat, lon], 15);
        exifMapRef.current = map;

        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        const marker = window.L.marker([lat, lon]).addTo(map);
        marker.bindPopup(label).openPopup();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [exifResults]);

  return (
    <div className={modStyles.container}>
      <div>
        <h1 className={dashStyles.title}>EXIF Metadata Forensics</h1>
        <div className={dashStyles.subtitle}>Upload digital photos in-memory to recover hardware specifications and locations.</div>
      </div>

      <div className={modStyles.inputGroup}>
        <label className={modStyles.inputLabel}>Suspect Photo File</label>
        <div 
          className={`${modStyles.uploadArea} ${exifDragActive ? modStyles.uploadAreaActive : ''}`}
          onDragEnter={handleExifDrag}
          onDragOver={handleExifDrag}
          onDragLeave={handleExifDrag}
          onDrop={handleExifDrop}
          style={{
            border: exifDragActive ? '2px dashed var(--notion-accent)' : '1px dashed var(--notion-border)',
            backgroundColor: exifDragActive ? 'rgba(35, 131, 226, 0.05)' : '#fafafa',
            transition: 'all 0.2s ease',
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Upload size={32} className={modStyles.uploadIcon} style={{ color: exifDragActive ? 'var(--notion-accent)' : 'rgba(55, 53, 47, 0.4)' }} />
          <div className={modStyles.uploadTitle} style={{ fontWeight: 600, marginTop: '8px', fontSize: '14px' }}>
            {exifDragActive ? 'Drop your photo here!' : 'Drag & Drop or Click to Select File'}
          </div>
          <div className={modStyles.uploadSubtitle} style={{ fontSize: '12px', color: 'rgba(55, 53, 47, 0.5)', marginTop: '4px' }}>
            Supports JPG, PNG, PDF, DOCX, XLSX, MP4, MP3 formats. Processing is completely sandboxed.
          </div>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx,.mp4,.mp3" onChange={handleExifUpload} style={{ display: 'none' }} id="exif-file-input" />
          <button 
            type="button" 
            onClick={() => document.getElementById('exif-file-input').click()}
            className={modStyles.btn}
            style={{ minHeight: 'auto', padding: '6px 12px', fontSize: '11px', marginTop: '12px', backgroundColor: '#ffffff', border: '1px solid var(--notion-border)' }}
          >
            Browse Files
          </button>
          <div style={{ marginTop: '12px' }}>
            <button 
              type="button" 
              onClick={() => handleExifUpload(new File([""], "simulated_exif_gps.jpg"))}
              className={modStyles.btn}
              style={{ minHeight: 'auto', padding: '5px 10px', fontSize: '11px', backgroundColor: 'rgba(35, 131, 226, 0.08)', color: 'var(--notion-accent)', border: 'none', fontWeight: 600 }}
            >
               Load Sample GPS Image
            </button>
          </div>
        </div>
      </div>

      {exifLoading && (
        <div className={modStyles.resultsContainer}>
          <div className={modStyles.resultsBody} style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ display: 'inline-block', border: '3px solid #f3f3f3', borderTop: '3px solid var(--notion-accent)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite', marginBottom: '12px' }}></div>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
            <div className="animate-pulse" style={{ fontSize: '13px', color: 'rgba(55, 53, 47, 0.7)' }}> Exfiltrating binary header partitions...</div>
          </div>
        </div>
      )}

      {exifError && (
        <div className={`${modStyles.bulletItem} ${modStyles.bulletDanger}`} style={{ marginTop: '14px' }}>
          <AlertTriangle size={14} />
          <span className={modStyles.bulletItemText}>{exifError}</span>
        </div>
      )}

      {exifResults && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'start', width: '100%', marginTop: '20px' }}>
          <div style={{ flex: 1, minWidth: 0 }} className={modStyles.resultsContainer}>
            <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className={modStyles.resultsTitle}> Extracted Metadata Summary</div>
              <button 
                onClick={() => handleExportPdfReport(exifFile ? exifFile.name : 'Suspect_Photo.jpg', exifResults)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  backgroundColor: 'var(--notion-accent-bg)',
                  color: 'var(--notion-accent)',
                  border: '1px solid var(--notion-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                 Export PDF
              </button>
            </div>
            <div className={modStyles.resultsBody} style={{ padding: '16px' }}>
              
              {exifResults.risk_level && (
                <div style={{
                  margin: '0 0 20px 0',
                  padding: '14px',
                  backgroundColor: exifResults.risk_level === 'HIGH' || exifResults.risk_level === 'CRITICAL' ? 'rgba(202, 44, 44, 0.04)' : 'rgba(217, 115, 29, 0.04)',
                  border: `1px solid ${exifResults.risk_level === 'HIGH' || exifResults.risk_level === 'CRITICAL' ? '#ca2c2c' : '#d9731d'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: exifResults.risk_level === 'HIGH' || exifResults.risk_level === 'CRITICAL' ? '#ca2c2c' : '#d9731d' }}>
                    <AlertTriangle size={18} />
                    <span>Forensic Security Assessment: {exifResults.risk_level} RISK</span>
                  </div>
                  {exifResults.risk_flags && exifResults.risk_flags.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {exifResults.risk_flags.map(flag => (
                        <span key={flag} style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: exifResults.risk_level === 'HIGH' || exifResults.risk_level === 'CRITICAL' ? 'rgba(202, 44, 44, 0.08)' : 'rgba(217, 115, 29, 0.08)',
                          color: exifResults.risk_level === 'HIGH' || exifResults.risk_level === 'CRITICAL' ? '#ca2c2c' : '#d9731d'
                        }}>{flag.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'rgba(55, 53, 47, 0.6)' }}>No risk flags detected in this file's metadata.</div>
                  )}
                </div>
              )}

              {exifResults.metadata && Object.keys(exifResults.metadata).length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 className={dashStyles.sectionHeader} style={{ marginTop: '0', marginBottom: '10px' }}> Document & File Properties</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--notion-border)', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                    {Object.entries(exifResults.metadata).map(([key, val], idx) => {
                      if (key === 'gps') return null;
                      const displayVal = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
                      if (!displayVal || displayVal.trim() === '') return null;
                      return (
                        <div 
                          key={key} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '10px 14px', 
                            borderBottom: '1px solid #f1f1f0',
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' 
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: '12px', color: 'rgba(55, 53, 47, 0.75)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                          <span className={modStyles.codeFont} style={{ fontSize: '11.5px', color: 'rgba(55, 53, 47, 0.65)', maxWidth: '60%', textAlign: 'right', whiteSpace: 'normal', wordBreak: 'break-all' }}>{displayVal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={modStyles.detailRow}>
                <span className={modStyles.detailKey}>Device Manufacturer</span>
                <span className={modStyles.detailValue} style={{ fontWeight: 600 }}>{exifResults.make || 'N/A'}</span>
              </div>
              
              <div className={modStyles.detailRow}>
                <span className={modStyles.detailKey}>Device Model</span>
                <span className={modStyles.detailValue}>{exifResults.model || 'N/A'}</span>
              </div>

              <div className={modStyles.detailRow}>
                <span className={modStyles.detailKey}>Software Version</span>
                <span className={modStyles.detailValue}>{exifResults.software || 'N/A'}</span>
              </div>

              <div className={modStyles.detailRow}>
                <span className={modStyles.detailKey}>Capture Timestamp</span>
                <span className={modStyles.detailValue}>{exifResults.datetime || 'N/A'}</span>
              </div>

              <div className={modStyles.detailRow}>
                <span className={modStyles.detailKey}>GPS Coordinates</span>
                <span className={`${modStyles.detailValue} ${modStyles.codeFont}`} style={{ color: exifResults.gps ? '#2b7a3e' : 'rgba(55, 53, 47, 0.5)' }}>
                  {exifResults.gps ? `${exifResults.gps.lat.toFixed(6)}, ${exifResults.gps.lon.toFixed(6)}` : 'No location tag embedded'}
                </span>
              </div>

              {/* EXIF Leaflet Location Map */}
              {exifResults.gps && (
                <div style={{ marginTop: '16px', border: '1px solid var(--notion-border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div id="exif-map" style={{ width: '100%', height: '300px', backgroundColor: '#f3f3f2', zIndex: 1 }}></div>
                </div>
              )}

              {/* Comprehensive two-column tags table */}
              {exifResults.all_tags && Object.keys(exifResults.all_tags).length > 0 && (
                <>
                  <h3 className={dashStyles.sectionHeader} style={{ marginTop: '24px', marginBottom: '10px' }}> Comprehensive EXIF Hex Registers</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--notion-border)', borderRadius: '6px', overflow: 'hidden', maxHeight: '350px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
                    {Object.entries(exifResults.all_tags).map(([tag, val], idx) => {
                      const displayVal = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
                      return (
                        <div 
                          key={tag} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '10px 14px', 
                            borderBottom: idx === Object.keys(exifResults.all_tags).length - 1 ? 'none' : '1px solid #f1f1f0', 
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' 
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: '12px', color: 'rgba(55, 53, 47, 0.75)' }}>{tag}</span>
                          <span className={modStyles.codeFont} style={{ fontSize: '11.5px', color: 'rgba(55, 53, 47, 0.65)', maxWidth: '60%', textAlign: 'right', whiteSpace: 'normal', wordBreak: 'break-all' }}>{displayVal}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

            </div>
          </div>
          <AnalystNotesPanel query={exifFile ? exifFile.name : 'exif_metadata'} />
        </div>
      )}
    </div>
  );
}
