import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Key, Search, Layers, ChevronRight, ChevronLeft, 
  Shield, AlertTriangle, Eye, EyeOff, Save, Check, Zap, 
  Globe, User, Mail, Database, FileText, X
} from 'lucide-react';
import styles from './OnboardingModal.module.css';

const STORAGE_KEY = 'holmes-onboarding-seen';
const API_KEYS_STORAGE_KEY = 'holmes-api-keys';

const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // API Keys state
  const [formKeys, setFormKeys] = useState({
    shodan: '',
    virustotal: '',
    hibp_api_key: '',
    github: '',
    groq_api_key: '',
  });

  const [showKeys, setShowKeys] = useState({
    shodan: false,
    virustotal: false,
    hibp_api_key: false,
    github: false,
    groq_api_key: false,
  });

  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setOpen(true);
    }

    // Pre-fill keys from local storage if available
    try {
      const savedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys);
        setFormKeys(prev => ({
          ...prev,
          shodan: parsed.shodan || '',
          virustotal: parsed.virustotal || '',
          hibp_api_key: parsed.hibp_api_key || '',
          github: parsed.github || '',
          groq_api_key: parsed.groq_api_key || '',
        }));
      }
    } catch (e) {
      console.warn('Failed to parse pre-existing API keys:', e);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
    setStep(0);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleOpen = () => {
    setStep(0);
    setOpen(true);
  };

  const handleKeyChange = (e) => {
    const { name, value } = e.target;
    setFormKeys(prev => ({ ...prev, [name]: value }));
    setSaveStatus('');
  };

  const toggleShowKey = (field) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Sync / Vault save logic
  const handleSaveKeys = async () => {
    setSaveStatus('saving');
    try {
      // 1. Get existing keys in localStorage
      let existing = {};
      try {
        const saved = localStorage.getItem(API_KEYS_STORAGE_KEY);
        if (saved) existing = JSON.parse(saved);
      } catch (e) {}

      // 2. Merge current form keys
      const merged = { ...existing, ...formKeys };
      localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(merged));

      // 3. Save to backend Vault securely
      for (const [service, key] of Object.entries(formKeys)) {
        if (key && key.trim()) {
          const response = await fetch('/api/vault/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service, api_key: key.trim() }),
          });
          if (!response.ok) {
            throw new Error(`Vault save failed for ${service}`);
          }
        }
      }

      setSaveStatus('saved');
      // Dispatch keys updated event so other panels know keys changed
      window.dispatchEvent(new CustomEvent('holmes-api-keys-updated'));
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      console.error('Onboarding Vault save failed:', e);
      setSaveStatus('error');
    }
  };

  if (!open) {
    return (
      <button
        className={styles.helpButton}
        onClick={handleOpen}
        title="Help / Tour"
        aria-label="Open onboarding tour"
      >
        ?
      </button>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Onboarding tour">
      <div className={styles.card}>
        {/* Skip button top right */}
        <button className={styles.skipBtn} onClick={handleClose} aria-label="Skip onboarding">
          <X size={16} />
        </button>

        {/* Wizard Headers */}
        <div className={styles.header}>
          <div className={styles.logo}>🕵️</div>
          <h1 className={styles.mainTitle}>Welcome to Holmes OSINT</h1>
          <p className={styles.mainSubtitle}>Let's configure your investigator workspace</p>
        </div>

        {/* Progress Tracker */}
        <div className={styles.progressTracker}>
          <div className={`${styles.progressStep} ${step >= 0 ? styles.stepActive : ''}`}>Intro</div>
          <div className={styles.progressLine}></div>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.stepActive : ''}`}>API Keys</div>
          <div className={styles.progressLine}></div>
          <div className={`${styles.progressStep} ${step >= 2 ? styles.stepActive : ''}`}>Walkthrough</div>
          <div className={styles.progressLine}></div>
          <div className={`${styles.progressStep} ${step >= 3 ? styles.stepActive : ''}`}>Features</div>
        </div>

        {/* Wizard Body content */}
        <div className={styles.slideBody}>
          {step === 0 && (
            <div className={styles.welcomePane}>
              <div className={styles.paneIcon}><Sparkles size={36} className={styles.purpleGlow} /></div>
              <h2 className={styles.paneTitle}>Your Passive Reconnaissance Hub</h2>
              <p className={styles.paneText}>
                Holmes is a production-hardened Open Source Intelligence platform. Map target surfaces, trace cryptographic entities, monitor domain shifts, and analyze public logs from a single workspace.
              </p>
              <div className={styles.quickFeatures}>
                <div className={styles.qFeature}><Shield size={14} /> Passive Intel Harvesting</div>
                <div className={styles.qFeature}><Zap size={14} /> Real-Time SSE Streams</div>
                <div className={styles.qFeature}><Layers size={14} /> Multi-Category Entity Mappings</div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className={styles.keysPane}>
              <div className={styles.paneHeader}>
                <Key size={20} className={styles.blueGlow} />
                <h3 className={styles.paneSub}>Configure API Credentials (BYOK)</h3>
              </div>
              <p className={styles.paneTextCompact}>
                Provide your custom API keys to run queries against external threat intelligence networks. Stored securely in your encrypted local SQLite vault.
              </p>

              <div className={styles.formGrid}>
                {/* Shodan */}
                <div className={styles.formGroup}>
                  <label>Shodan API Key</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type={showKeys.shodan ? "text" : "password"}
                      name="shodan"
                      placeholder="Enter Shodan key..."
                      value={formKeys.shodan}
                      onChange={handleKeyChange}
                    />
                    <button type="button" onClick={() => toggleShowKey('shodan')}>
                      {showKeys.shodan ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* VirusTotal */}
                <div className={styles.formGroup}>
                  <label>VirusTotal API Key</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type={showKeys.virustotal ? "text" : "password"}
                      name="virustotal"
                      placeholder="Enter VirusTotal key..."
                      value={formKeys.virustotal}
                      onChange={handleKeyChange}
                    />
                    <button type="button" onClick={() => toggleShowKey('virustotal')}>
                      {showKeys.virustotal ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* HaveIBeenPwned */}
                <div className={styles.formGroup}>
                  <label>HaveIBeenPwned API Key</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type={showKeys.hibp_api_key ? "text" : "password"}
                      name="hibp_api_key"
                      placeholder="Enter HIBP v3 key..."
                      value={formKeys.hibp_api_key}
                      onChange={handleKeyChange}
                    />
                    <button type="button" onClick={() => toggleShowKey('hibp_api_key')}>
                      {showKeys.hibp_api_key ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* GitHub */}
                <div className={styles.formGroup}>
                  <label>GitHub Personal Token</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type={showKeys.github ? "text" : "password"}
                      name="github"
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={formKeys.github}
                      onChange={handleKeyChange}
                    />
                    <button type="button" onClick={() => toggleShowKey('github')}>
                      {showKeys.github ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Groq */}
                <div className={styles.formGroup}>
                  <label>Groq API Key (AI summaries)</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type={showKeys.groq_api_key ? "text" : "password"}
                      name="groq_api_key"
                      placeholder="gsk_xxxxxxxxxxxx"
                      value={formKeys.groq_api_key}
                      onChange={handleKeyChange}
                    />
                    <button type="button" onClick={() => toggleShowKey('groq_api_key')}>
                      {showKeys.groq_api_key ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.saveActionRow}>
                <button 
                  type="button" 
                  className={styles.saveBtn} 
                  onClick={handleSaveKeys}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? 'Encrypting & Storing...' : (
                    saveStatus === 'saved' ? 'Saved Successfully!' : (
                      <>
                        <Save size={14} /> Save & Store to Vault
                      </>
                    )
                  )}
                </button>
                {saveStatus === 'error' && (
                  <span className={styles.saveError}><AlertTriangle size={12} /> Sync failed</span>
                )}
                {saveStatus === 'saved' && (
                  <span className={styles.saveSuccess}><Check size={12} /> Encrypted</span>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.walkthroughPane}>
              <div className={styles.paneHeader}>
                <Search size={20} className={styles.greenGlow} />
                <h3 className={styles.paneSub}>First Scan Walkthrough</h3>
              </div>
              <p className={styles.paneText}>
                Holmes features auto-detection of query syntax. Type usernames, domains, IPs, email addresses, or Bitcoin wallets directly.
              </p>

              <div className={styles.mockSearchContainer}>
                <div className={styles.mockInputGroup}>
                  <Search size={14} className={styles.mockInputIcon} />
                  <div className={styles.mockInputField}>example.com</div>
                </div>
                <div className={styles.mockIndicators}>
                  <span className={styles.mockPill}><Globe size={10} /> Auto-Detected: Domain Target</span>
                  <span className={styles.mockPill}><Shield size={10} /> Subdomain Enumeration</span>
                  <span className={styles.mockPill}><Database size={10} /> WHOIS Records</span>
                </div>
              </div>

              <p className={styles.paneNote}>
                👉 Click **Unified Scanner** in the sidebar, input your target selector, and run the scan. You will see streaming results in real-time.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className={styles.featuresPane}>
              <div className={styles.paneHeader}>
                <Layers size={20} className={styles.orangeGlow} />
                <h3 className={styles.paneSub}>Core Forensic Modules</h3>
              </div>

              <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.fIcon}>🌐</div>
                  <div>
                    <h4>Maltego Link Graph</h4>
                    <p>Inspect interconnected entity relationships visually.</p>
                  </div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.fIcon}>📁</div>
                  <div>
                    <h4>Metadata Forensics</h4>
                    <p>Extract EXIF and revision markers from files.</p>
                  </div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.fIcon}>📄</div>
                  <div>
                    <h4>Agency-Grade Reports</h4>
                    <p>Compile details into standard PDFs with AI summaries.</p>
                  </div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.fIcon}>⏰</div>
                  <div>
                    <h4>Passive Monitor</h4>
                    <p>Track targets over time for DNS or credential leaks.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions: dots navigation and Back/Next */}
        <div className={styles.footer}>
          <button
            className={`${styles.navBtn} ${styles.backBtn}`}
            onClick={handleBack}
            disabled={step === 0}
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          {/* Progress dots */}
          <div className={styles.dotsContainer} aria-label="Progress dots">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === step ? styles.activeDot : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            className={`${styles.navBtn} ${step === 3 ? styles.startBtn : styles.nextBtn}`}
            onClick={handleNext}
          >
            {step === 3 ? (
              <>
                Launch Workspace <Check size={16} style={{ marginLeft: '4px' }} />
              </>
            ) : (
              <>
                Next <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
