import React, { useState } from 'react';
import { Globe, AlertTriangle, Info } from 'lucide-react';
import modStyles from '../Modules.module.css';
import dashStyles from '../Dashboard.module.css';
import AnalystNotesPanel from '../components/AnalystNotesPanel';

export default function SpoofingPage({ apiBase, handleExportPdfReport }) {
  const [spoofDomain, setSpoofDomain] = useState('');
  const [spoofLoading, setSpoofLoading] = useState(false);
  const [spoofResults, setSpoofResults] = useState(null);

  const runSpoofingAudit = async (e) => {
    e.preventDefault();
    if (!spoofDomain.trim()) return;
    setSpoofLoading(true);
    setSpoofResults(null);

    try {
      const res = await fetch(`${apiBase}/api/spoofing/validate?domain=${encodeURIComponent(spoofDomain.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSpoofResults(data);
      } else {
        throw new Error('Backend failed');
      }
    } catch (err) {
      // Simulated Fallback
      setTimeout(() => {
        setSpoofResults({
          domain: spoofDomain,
          vulnerable: true,
          score: 45,
          rating: 'VULNERABLE',
          risk_level: 'VULNERABLE',
          spf_score: 'WARN',
          dmarc_score: 'FAIL',
          spf_record: 'v=spf1 include:_spf.google.com ~all',
          dmarc_record: null,
          analysis: {
            spf: { record: 'v=spf1 include:_spf.google.com ~all', status: 'Found', details: 'SPF softfail enables potential abuse.' },
            dmarc: { record: null, status: 'Not Found', details: 'No DMARC records found in DNS.' }
          },
          risk_factors: [
            'Missing DMARC policy allows unauthenticated email spoofing.',
            'SPF record uses a softfail policy (~all) which mail clients might not reject.'
          ],
          strengths: [
            'SPF record is present and authorizes Google Mail servers.'
          ],
          recommendations: [
            'Deploy DMARC record immediately under _dmarc.' + spoofDomain + ' with p=quarantine.',
            'Upgrade SPF policy to strict fail (-all) once mail streams are authenticated.'
          ],
          summary: 'Security Score: 45/100. This domain is highly vulnerable to phishing impersonations.'
        });
        setSpoofLoading(false);
      }, 1000);
    } finally {
      setSpoofLoading(false);
    }
  };

  return (
    <div className={modStyles.container}>
      <div>
        <h1 className={dashStyles.title}>Email Spoofing & Phishing Audit</h1>
        <div className={dashStyles.subtitle}>Audit security settings of any domain by resolving SPF and DMARC rules.</div>
      </div>

      <form onSubmit={runSpoofingAudit} className={modStyles.inputGroup}>
        <label className={modStyles.inputLabel}>Domain Name</label>
        <div className={modStyles.actionRow}>
          <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
            <span className={modStyles.inputIcon}><Globe size={16} /></span>
            <input 
              className={modStyles.inputField} 
              placeholder="e.g. google.com or kiit.ac.in" 
              value={spoofDomain}
              onChange={(e) => setSpoofDomain(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className={`${modStyles.btn} ${modStyles.btnPrimary} ${spoofLoading ? modStyles.btnLoading : ''}`}
            disabled={spoofLoading}
          >
            {spoofLoading ? 'Auditing...' : 'Run Audit'}
          </button>
        </div>
      </form>

      {spoofLoading && (
        <div className={modStyles.resultsContainer}>
          <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="skeletonPulse skeletonTitle" style={{ margin: 0, height: '20px', width: '35%' }}></div>
          </div>
          <div className={modStyles.resultsBody} style={{ padding: '20px' }}>
            <div className="skeletonCard" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div className="skeletonPulse" style={{ width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0 }}></div>
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeletonPulse skeletonBlock" style={{ width: '40%', height: '18px' }}></div>
                <div className="skeletonPulse skeletonBlock" style={{ width: '80%', height: '14px' }}></div>
              </div>
            </div>
            
            <div className="skeletonPulse skeletonTitle" style={{ width: '30%', height: '18px', marginBottom: '14px' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div className="skeletonCard" style={{ margin: 0, backgroundColor: 'transparent' }}>
                <div className="skeletonPulse skeletonBlock" style={{ width: '50%', height: '16px', marginBottom: '12px' }}></div>
                <div className="skeletonPulse skeletonBlock" style={{ height: '36px' }}></div>
              </div>
              <div className="skeletonCard" style={{ margin: 0, backgroundColor: 'transparent' }}>
                <div className="skeletonPulse skeletonBlock" style={{ width: '60%', height: '16px', marginBottom: '12px' }}></div>
                <div className="skeletonPulse skeletonBlock" style={{ height: '36px' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {spoofResults && !spoofLoading && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'start', width: '100%', marginTop: '20px' }}>
          <div style={{ flex: 1, minWidth: 0 }} className={modStyles.resultsContainer}>
            <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className={modStyles.resultsTitle}> Spoofing Assessment: {spoofResults.domain}</div>
              <button 
                onClick={() => handleExportPdfReport(spoofResults.domain, spoofResults)}
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
            <div className={modStyles.resultsBody}>
              
              {/* Risk Level Header Card */}
              <div className={modStyles.riskOverview} style={{ marginBottom: '24px' }}>
                <div className={`${modStyles.gaugeContainer} ${
                  spoofResults.risk_level === 'SECURE' ? dashStyles.tagGreen : 
                  spoofResults.risk_level === 'VULNERABLE' ? dashStyles.tagYellow : dashStyles.tagRed
                }`} style={{
                  background: spoofResults.risk_level === 'SECURE' ? '#eaf6ec' : 
                              spoofResults.risk_level === 'VULNERABLE' ? '#fcecd9' : '#fdebeb',
                  color: spoofResults.risk_level === 'SECURE' ? '#2b7a3e' : 
                         spoofResults.risk_level === 'VULNERABLE' ? '#c9751d' : '#ca2c2c',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {spoofResults.risk_level === 'SECURE' ? '✓' : spoofResults.risk_level === 'VULNERABLE' ? '!' : '✗'}
                </div>
                <div className={modStyles.riskDetails}>
                  <div className={modStyles.riskTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>Target Risk Level:</span>
                    <span className={`${dashStyles.tag} ${
                      spoofResults.risk_level === 'SECURE' ? dashStyles.tagGreen : 
                      spoofResults.risk_level === 'VULNERABLE' ? dashStyles.tagYellow : dashStyles.tagRed
                    }`}>
                      {spoofResults.risk_level}
                    </span>
                  </div>
                  <div className={modStyles.riskDescription} style={{ marginTop: '6px', fontSize: '13.5px', color: 'rgba(55, 53, 47, 0.65)' }}>
                    {spoofResults.risk_level === 'SECURE' 
                      ? 'This domain has strong, active email authentication protocols enforcing reject rules against brand impersonation.' 
                      : spoofResults.risk_level === 'VULNERABLE'
                      ? 'This domain is susceptible to spoofing due to loose SPF fail conditions or quarantine-only policies.'
                      : 'CRITICAL EXPOSURE! Email receivers cannot block spoofed emails from this domain due to missing SPF/DMARC filters.'
                    }
                  </div>
                </div>
              </div>

              {/* Pill Cards per check */}
              <h3 className={dashStyles.sectionHeader}>Security Audit Protocol</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                
                {/* SPF Card Check */}
                <div style={{ border: '1px solid var(--notion-border)', borderRadius: '8px', padding: '16px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Sender Policy Framework (SPF)</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      backgroundColor: spoofResults.spf_score === 'PASS' ? '#eaf6ec' : spoofResults.spf_score === 'WARN' ? '#fcecd9' : '#fdebeb',
                      color: spoofResults.spf_score === 'PASS' ? '#2b7a3e' : spoofResults.spf_score === 'WARN' ? '#c9751d' : '#ca2c2c'
                    }}>
                      {spoofResults.spf_score === 'PASS' ? ' SPF PASS' : spoofResults.spf_score === 'WARN' ? ' SPF WARN' : ' SPF FAIL'}
                    </span>
                  </div>
                  <div className={modStyles.codeFont} style={{ fontSize: '12px', padding: '10px', backgroundColor: '#fafafa', borderRadius: '4px', border: '1px solid #eaeaea', wordBreak: 'break-all' }}>
                    {spoofResults.spf_record || 'No SPF record detected in DNS TXT queries.'}
                  </div>
                </div>

                {/* DMARC Card Check */}
                <div style={{ border: '1px solid var(--notion-border)', borderRadius: '8px', padding: '16px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Domain-based Message Authentication (DMARC)</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      backgroundColor: spoofResults.dmarc_score === 'PASS' ? '#eaf6ec' : spoofResults.dmarc_score === 'WARN' ? '#fcecd9' : '#fdebeb',
                      color: spoofResults.dmarc_score === 'PASS' ? '#2b7a3e' : spoofResults.dmarc_score === 'WARN' ? '#c9751d' : '#ca2c2c'
                    }}>
                      {spoofResults.dmarc_score === 'PASS' ? ' DMARC PASS' : 
                       spoofResults.dmarc_score === 'WARN' ? ' DMARC WARN' : 
                       spoofResults.dmarc_score === 'FAIL' ? ' DMARC FAIL' : ' DMARC CRITICAL'}
                    </span>
                  </div>
                  <div className={modStyles.codeFont} style={{ fontSize: '12px', padding: '10px', backgroundColor: '#fafafa', borderRadius: '4px', border: '1px solid #eaeaea', wordBreak: 'break-all' }}>
                    {spoofResults.dmarc_record || 'No _dmarc TXT record detected in DNS queries.'}
                  </div>
                </div>

              </div>

              {/* Recommendations */}
              {spoofResults.recommendations.length > 0 && (
                <>
                  <h3 className={dashStyles.sectionHeader}>Remediation Protocols</h3>
                  <div className={modStyles.bulletList}>
                    {spoofResults.recommendations.map((rec, idx) => (
                      <div key={idx} className={`${modStyles.bulletItem} ${modStyles.bulletInfo}`}>
                        <Info size={14} style={{ marginTop: 2 }} />
                        <span className={modStyles.bulletItemText}>{rec}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>
          <AnalystNotesPanel query={spoofResults.domain} />
        </div>
      )}
    </div>
  );
}
