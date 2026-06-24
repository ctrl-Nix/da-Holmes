import React, { useState, useRef } from 'react';
import { Cpu, Loader, AlertCircle, Image as ImageIcon, FileText, Upload, Brain } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function LocalMLIntel() {
  const [tab, setTab] = useState('text'); // 'text' | 'vision' | 'predictive'

  // Text state
  const [text, setText] = useState('');
  const [entities, setEntities] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [errorText, setErrorText] = useState(null);

  // Vision state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [objects, setObjects] = useState(null);
  const [loadingVision, setLoadingVision] = useState(false);
  const [errorVision, setErrorVision] = useState(null);
  const fileInputRef = useRef(null);

  // Predictive state
  const [profileStats, setProfileStats] = useState({
    follower_count: '',
    following_count: '',
    account_age_days: '',
    bio_length: '',
    is_verified: false
  });
  const [botPrediction, setBotPrediction] = useState(null);
  const [loadingPredictive, setLoadingPredictive] = useState(false);
  const [errorPredictive, setErrorPredictive] = useState(null);

  // --- Handlers ---
  const handleAnalyzeText = async () => {
    if (!text.trim()) return;
    setLoadingText(true); setErrorText(null); setEntities(null);
    try {
      const response = await fetch(`${API_BASE}/api/extract-entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
      if (!response.ok) throw new Error('Local ML Inference Failed');
      const data = await response.json();
      setEntities(data.entities || []);
    } catch (err) { setErrorText(err.message); } finally { setLoadingText(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setObjects(null); setErrorVision(null);
  };

  const handleAnalyzeVision = async () => {
    if (!imageFile) return;
    setLoadingVision(true); setErrorVision(null); setObjects(null);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const response = await fetch(`${API_BASE}/api/detect-objects`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Local YOLO Inference Failed');
      const data = await response.json();
      setObjects(data.objects || []);
    } catch (err) { setErrorVision(err.message); } finally { setLoadingVision(false); }
  };

  const handlePredictBot = async () => {
    setLoadingPredictive(true); setErrorPredictive(null); setBotPrediction(null);
    try {
      const payload = {
        follower_count: parseInt(profileStats.follower_count || 0),
        following_count: parseInt(profileStats.following_count || 0),
        account_age_days: parseInt(profileStats.account_age_days || 0),
        bio_length: parseInt(profileStats.bio_length || 0),
        is_verified: profileStats.is_verified
      };
      const response = await fetch(`${API_BASE}/api/predict-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Local Bot Prediction Failed');
      const data = await response.json();
      setBotPrediction(data);
    } catch (err) { setErrorPredictive(err.message); } finally { setLoadingPredictive(false); }
  };

  return (
    <div style={{
      border: '1px solid var(--notion-border)', borderRadius: '8px', padding: '24px',
      backgroundColor: 'var(--notion-bg)', fontFamily: 'Inter, sans-serif', color: 'var(--notion-fg)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
        <Cpu size={22} color="#6d28d9" />
        <h2 style={{ margin: 0, fontSize: '18px' }}>Local Intelligence Engine</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--notion-border)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setTab('text')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', 
            background: tab === 'text' ? 'var(--notion-sidebar)' : 'transparent',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
            color: tab === 'text' ? '#6d28d9' : 'var(--notion-fg-light)'
          }}
        >
          <FileText size={16} /> NLP (Entity)
        </button>
        <button 
          onClick={() => setTab('vision')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', 
            background: tab === 'vision' ? 'var(--notion-sidebar)' : 'transparent',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
            color: tab === 'vision' ? '#ea580c' : 'var(--notion-fg-light)'
          }}
        >
          <ImageIcon size={16} /> Vision (YOLO)
        </button>
        <button 
          onClick={() => setTab('predictive')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', 
            background: tab === 'predictive' ? 'var(--notion-sidebar)' : 'transparent',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
            color: tab === 'predictive' ? '#059669' : 'var(--notion-fg-light)'
          }}
        >
          <Brain size={16} /> Predictive ML
        </button>
      </div>

      {/* --- TEXT TAB --- */}
      {tab === 'text' && (
        <div className="animate-fade-in">
          <textarea 
            value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Enter raw text here..."
            style={{
              width: '100%', minHeight: '120px', padding: '12px', borderRadius: '6px',
              border: '1px solid var(--notion-border)', fontSize: '14px', marginBottom: '12px',
              resize: 'vertical', backgroundColor: 'var(--notion-bg)', color: 'var(--notion-fg)'
            }}
          />
          <button 
            onClick={handleAnalyzeText} disabled={loadingText || !text.trim()}
            style={{
              padding: '8px 16px', backgroundColor: loadingText ? '#d1d5db' : '#6d28d9', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: loadingText || !text.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {loadingText && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {loadingText ? 'Running Local Inference...' : 'Extract Entities Locally'}
          </button>

          {errorText && <div style={{ color: '#ef4444', marginTop: '16px', fontSize: '14px' }}>{errorText}</div>}
          
          {entities && (
            <div style={{ marginTop: '20px', backgroundColor: 'var(--notion-sidebar)', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', marginTop: 0 }}>Extracted Intel ({entities.length}):</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {entities.map((ent, idx) => {
                  let bgColor = '#f3f4f6'; let color = '#374151';
                  if (ent.entity_group === 'PER') { bgColor = '#dbeafe'; color = '#1d4ed8'; }
                  if (ent.entity_group === 'ORG') { bgColor = '#fce7f3'; color = '#be185d'; }
                  if (ent.entity_group === 'LOC') { bgColor = '#dcfce7'; color = '#15803d'; }
                  return (
                    <div key={idx} style={{ padding: '4px 10px', backgroundColor: bgColor, color: color, borderRadius: '16px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {ent.word} <span style={{ fontSize: '10px', opacity: 0.7 }}>({ent.entity_group})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- VISION TAB --- */}
      {tab === 'vision' && (
        <div className="animate-fade-in">
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--notion-border)', borderRadius: '8px', padding: '32px',
              textAlign: 'center', cursor: 'pointer', marginBottom: '16px', backgroundColor: 'var(--notion-sidebar)'
            }}
          >
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ maxHeight: '200px', borderRadius: '4px', margin: '0 auto' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--notion-fg-light)' }}>
                <Upload size={32} /> <span style={{ fontWeight: 600 }}>Click to Upload Target Image</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleAnalyzeVision} disabled={loadingVision || !imageFile}
            style={{
              padding: '8px 16px', backgroundColor: loadingVision ? '#d1d5db' : '#ea580c', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: loadingVision || !imageFile ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {loadingVision && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {loadingVision ? 'Running YOLO Object Detection...' : 'Identify Objects Locally'}
          </button>
          
          {errorVision && <div style={{ color: '#ef4444', marginTop: '16px', fontSize: '14px' }}>{errorVision}</div>}
          
          {objects && (
            <div style={{ marginTop: '20px', backgroundColor: 'var(--notion-sidebar)', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', marginTop: 0 }}>Detected Objects ({objects.length}):</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {objects.map((obj, idx) => (
                  <div key={idx} style={{ padding: '4px 10px', backgroundColor: '#ffedd5', color: '#c2410c', borderRadius: '16px', fontSize: '12px', fontWeight: '600', display: 'flex', gap: '6px', border: '1px solid #fdba74' }}>
                    <span>{obj.label.toUpperCase()}</span>
                    <span style={{ fontSize: '10px', opacity: 0.7, backgroundColor: 'rgba(255,255,255,0.5)', padding: '2px 4px', borderRadius: '4px' }}>{(obj.confidence * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- PREDICTIVE TAB --- */}
      {tab === 'predictive' && (
        <div className="animate-fade-in">
          <p style={{ fontSize: '13px', color: 'var(--notion-fg-light)', marginBottom: '16px' }}>
            Input metadata of a social media profile to predict if it's a fake/bot account using a Local Random Forest algorithm.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Follower Count</label>
              <input type="number" value={profileStats.follower_count} onChange={e => setProfileStats({...profileStats, follower_count: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--notion-border)', borderRadius: '6px', backgroundColor: 'var(--notion-bg)', color: 'var(--notion-fg)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Following Count</label>
              <input type="number" value={profileStats.following_count} onChange={e => setProfileStats({...profileStats, following_count: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--notion-border)', borderRadius: '6px', backgroundColor: 'var(--notion-bg)', color: 'var(--notion-fg)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Account Age (Days)</label>
              <input type="number" value={profileStats.account_age_days} onChange={e => setProfileStats({...profileStats, account_age_days: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--notion-border)', borderRadius: '6px', backgroundColor: 'var(--notion-bg)', color: 'var(--notion-fg)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Bio Length (Chars)</label>
              <input type="number" value={profileStats.bio_length} onChange={e => setProfileStats({...profileStats, bio_length: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--notion-border)', borderRadius: '6px', backgroundColor: 'var(--notion-bg)', color: 'var(--notion-fg)' }} />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={profileStats.is_verified} onChange={e => setProfileStats({...profileStats, is_verified: e.target.checked})} id="is_verified" />
              <label htmlFor="is_verified" style={{ fontSize: '13px', fontWeight: 600 }}>Is Account Verified?</label>
            </div>
          </div>

          <button 
            onClick={handlePredictBot} disabled={loadingPredictive}
            style={{
              padding: '8px 16px', backgroundColor: loadingPredictive ? '#d1d5db' : '#059669', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: loadingPredictive ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {loadingPredictive && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {loadingPredictive ? 'Computing Probability...' : 'Generate Bot Probability Score'}
          </button>

          {errorPredictive && <div style={{ color: '#ef4444', marginTop: '16px', fontSize: '14px' }}>{errorPredictive}</div>}
          
          {botPrediction && (
            <div style={{ marginTop: '20px', backgroundColor: 'var(--notion-sidebar)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '14px', margin: 0, color: 'var(--notion-fg-light)' }}>Prediction Results</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  padding: '12px 20px', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '18px',
                  backgroundColor: botPrediction.is_bot ? '#ef4444' : '#10b981' 
                }}>
                  {botPrediction.is_bot ? ' HIGH RISK (BOT)' : ' LEGITIMATE'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--notion-fg-light)', textTransform: 'uppercase', fontWeight: 700 }}>Probability Score</span>
                  <span style={{ fontSize: '20px', fontWeight: 800 }}>{botPrediction.bot_probability.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
