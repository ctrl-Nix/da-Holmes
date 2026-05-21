import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, ShieldAlert, Server, ShieldCheck, RefreshCw } from 'lucide-react';

import { API_BASE_URL } from '../utils/api';

export default function ApiVault() {
  const [keys, setKeys] = useState({
    virustotal: '',
    shodan: '',
    hunterio: '',
  });
  const [visibility, setVisibility] = useState({
    virustotal: false,
    shodan: false,
    hunterio: false,
  });
  const [status, setStatus] = useState('idle'); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [dbStatus, setDbStatus] = useState('unknown'); // unknown | connected | error

  const API_BASE = API_BASE_URL;

  // Fetch already saved keys (they will return masked as ******** if set)
  useEffect(() => {
    async function loadKeys() {
      try {
        const res = await fetch(`${API_BASE}/api/keys`);
        if (res.ok) {
          const data = await res.json();
          setKeys(prev => ({
            ...prev,
            virustotal: data.virustotal || '',
            shodan: data.shodan || '',
            hunterio: data.hunterio || '',
          }));
          setDbStatus('connected');
        } else {
          setDbStatus('error');
        }
      } catch (err) {
        console.error('Error fetching API keys:', err);
        setDbStatus('error');
      }
    }
    loadKeys();
  }, [API_BASE]);

  const handleInputChange = (service, value) => {
    setKeys(prev => ({
      ...prev,
      [service]: value
    }));
  };

  const toggleVisibility = (service) => {
    setVisibility(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keys }),
      });

      if (!res.ok) {
        throw new Error('Failed to save configuration. Server returned error.');
      }

      setStatus('success');
      // Re-mask input values to indicate they are saved
      const savedData = await res.json();
      setKeys(prev => ({
        ...prev,
        virustotal: savedData.virustotal || prev.virustotal,
        shodan: savedData.shodan || prev.shodan,
        hunterio: savedData.hunterio || prev.hunterio,
      }));

      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Network error occurred while saving.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-slate-950 border border-emerald-500/30 rounded-xl shadow-2xl shadow-emerald-500/5 text-slate-100 font-mono animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Key className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-emerald-400">API Credentials Vault</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage keys for third-party intelligence modules</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] bg-slate-900 border border-slate-800 rounded px-2.5 py-1">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500">Database:</span>
          {dbStatus === 'connected' ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> ONLINE
            </span>
          ) : dbStatus === 'error' ? (
            <span className="text-rose-500 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> ERROR
            </span>
          ) : (
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> CHECKING
            </span>
          )}
        </div>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-xs text-emerald-300/80 mb-6 flex gap-2.5 items-start">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Keys are encrypted at-rest inside the secure local database store using AES-256 (Fernet block encryption). Configured integrations will authenticate requests automatically.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* VirusTotal Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-200">VirusTotal API Key</label>
            <span className="text-[10px] text-slate-500">IP reputation & hash scanning</span>
          </div>
          <div className="relative flex items-center">
            <input
              type={visibility.virustotal ? 'text' : 'password'}
              placeholder={keys.virustotal === '********' ? '••••••••••••••••' : 'Enter VirusTotal API Key'}
              value={keys.virustotal === '********' ? '' : keys.virustotal}
              onChange={(e) => handleInputChange('virustotal', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
            />
            {keys.virustotal === '********' && (
              <span className="absolute left-3.5 text-xs text-emerald-500/60 font-semibold uppercase tracking-wider pointer-events-none">
                [Configured]
              </span>
            )}
            <button
              type="button"
              onClick={() => toggleVisibility('virustotal')}
              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              {visibility.virustotal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Shodan Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-200">Shodan API Key</label>
            <span className="text-[10px] text-slate-500">Port scanner & banner intelligence</span>
          </div>
          <div className="relative flex items-center">
            <input
              type={visibility.shodan ? 'text' : 'password'}
              placeholder={keys.shodan === '********' ? '••••••••••••••••' : 'Enter Shodan API Key'}
              value={keys.shodan === '********' ? '' : keys.shodan}
              onChange={(e) => handleInputChange('shodan', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
            />
            {keys.shodan === '********' && (
              <span className="absolute left-3.5 text-xs text-emerald-500/60 font-semibold uppercase tracking-wider pointer-events-none">
                [Configured]
              </span>
            )}
            <button
              type="button"
              onClick={() => toggleVisibility('shodan')}
              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              {visibility.shodan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hunter.io Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-200">Hunter.io API Key</label>
            <span className="text-[10px] text-slate-500">Email format & domain verification</span>
          </div>
          <div className="relative flex items-center">
            <input
              type={visibility.hunterio ? 'text' : 'password'}
              placeholder={keys.hunterio === '********' ? '••••••••••••••••' : 'Enter Hunter.io API Key'}
              value={keys.hunterio === '********' ? '' : keys.hunterio}
              onChange={(e) => handleInputChange('hunterio', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
            />
            {keys.hunterio === '********' && (
              <span className="absolute left-3.5 text-xs text-emerald-500/60 font-semibold uppercase tracking-wider pointer-events-none">
                [Configured]
              </span>
            )}
            <button
              type="button"
              onClick={() => toggleVisibility('hunterio')}
              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              {visibility.hunterio ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Success: API Credentials Saved & Encrypted.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Error: {errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={status === 'saving'}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 text-slate-950 font-bold py-2.5 px-4 rounded-lg cursor-pointer transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/10"
          >
            {status === 'saving' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                Encrypting & Storing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-950" />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
