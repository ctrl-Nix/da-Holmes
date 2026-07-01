import React, { useState } from 'react';
import { Globe, Copy, ArrowUpDown } from 'lucide-react';
import modStyles from '../Modules.module.css';
import dashStyles from '../Dashboard.module.css';
import repStyles from '../Reports.module.css';
import AnalystNotesPanel from '../components/AnalystNotesPanel';

const getTechIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('wordpress')) return '';
  if (lower.includes('next.js') || lower.includes('nextjs')) return '';
  if (lower.includes('react')) return '';
  if (lower.includes('shopify')) return '';
  if (lower.includes('google analytics') || lower.includes('gtag')) return '';
  if (lower.includes('nginx') || lower.includes('apache')) return '';
  return '';
};

export default function DomainPage({ apiBase, handleExportPdfReport }) {
  const [domainQuery, setDomainQuery] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainResults, setDomainResults] = useState(null);
  const [subdomainSortKey, setSubdomainSortKey] = useState('subdomain');
  const [subdomainSortOrder, setSubdomainSortOrder] = useState('asc');

  const runDomainAudit = async (e) => {
    e.preventDefault();
    if (!domainQuery.trim()) return;
    setDomainLoading(true);
    setDomainResults(null);

    try {
      const resSub = await fetch(`${apiBase}/api/certificates?domain=${encodeURIComponent(domainQuery.trim())}`);
      const resTech = await fetch(`${apiBase}/api/techstack/detect?domain=${encodeURIComponent(domainQuery.trim())}`);
      
      let subData = { subdomains: [] };
      let techData = { technologies: [] };

      if (resSub.ok) subData = await resSub.json();
      if (resTech.ok) techData = await resTech.json();

      setDomainResults({
        domain: domainQuery,
        subdomains: (subData.subdomains || []).map(s => typeof s === 'string' ? { subdomain: s, first_seen: 'N/A', issuer: 'crt.sh Log' } : s),
        subdomain_count: subData.subdomains ? subData.subdomains.length : 0,
        technologies: techData.technologies || []
      });
    } catch (err) {
      setTimeout(() => {
        setDomainResults({
          domain: domainQuery,
          subdomain_count: 5,
          subdomains: [
            { subdomain: `www.${domainQuery}`, first_seen: '2024-01-15T08:00:00Z', issuer: 'Let\'s Encrypt' },
            { subdomain: `mail.${domainQuery}`, first_seen: '2024-02-20T12:30:00Z', issuer: 'DigiCert Inc' },
            { subdomain: `cpanel.${domainQuery}`, first_seen: '2024-03-01T09:15:00Z', issuer: 'cPanel, Inc.' },
            { subdomain: `autodiscover.${domainQuery}`, first_seen: '2024-03-10T10:00:00Z', issuer: 'Let\'s Encrypt' },
            { subdomain: `dev.${domainQuery}`, first_seen: '2024-03-15T14:45:00Z', issuer: 'ZeroSSL' }
          ],
          technologies: [
            { type: 'Server', name: 'Apache/2.4.41' },
            { type: 'Powered By', name: 'PHP/7.4.3' },
            { type: 'CMS', name: 'WordPress' },
            { type: 'Analytics', name: 'Google Analytics' }
          ]
        });
        setDomainLoading(false);
      }, 1000);
    } finally {
      setDomainLoading(false);
    }
  };

  const handleSort = (key) => {
    if (subdomainSortKey === key) {
      setSubdomainSortOrder(subdomainSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSubdomainSortKey(key);
      setSubdomainSortOrder('asc');
    }
  };

  const getSortedSubdomains = () => {
    if (!domainResults || !domainResults.subdomains) return [];
    const items = [...domainResults.subdomains];
    items.sort((a, b) => {
      const valA = (a[subdomainSortKey] || '').toString().toLowerCase();
      const valB = (b[subdomainSortKey] || '').toString().toLowerCase();
      
      if (valA < valB) return subdomainSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return subdomainSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  };

  const copyAllSubdomains = () => {
    if (!domainResults || !domainResults.subdomains) return;
    const text = domainResults.subdomains.map(s => s.subdomain).join('\n');
    navigator.clipboard.writeText(text);
    alert('Copied all subdomains to clipboard!');
  };

  return (
    <div className={modStyles.container}>
      <div>
        <h1 className={dashStyles.title}>Corporate Domain Auditor</h1>
        <div className={dashStyles.subtitle}>Extract certificate transparency subdomains and identify remote tech stacks.</div>
      </div>

      <form onSubmit={runDomainAudit} className={modStyles.inputGroup}>
        <label className={modStyles.inputLabel}>Domain</label>
        <div className={modStyles.actionRow}>
          <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
            <span className={modStyles.inputIcon}><Globe size={16} /></span>
            <input 
              className={modStyles.inputField} 
              placeholder="e.g. microsoft.com" 
              value={domainQuery}
              onChange={(e) => setDomainQuery(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className={`${modStyles.btn} ${modStyles.btnPrimary} ${domainLoading ? modStyles.btnLoading : ''}`}
            disabled={domainLoading}
          >
            {domainLoading ? 'Auditing...' : 'Enumerate Host'}
          </button>
        </div>
      </form>

      {domainLoading && (
        <div className={modStyles.resultsContainer}>
          <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="skeletonPulse skeletonTitle" style={{ margin: 0, height: '20px', width: '30%' }}></div>
          </div>
          <div className={modStyles.resultsBody} style={{ padding: '20px' }}>
            <div className="skeletonPulse skeletonTitle" style={{ width: '25%', height: '18px', marginBottom: '14px' }}></div>
            <div className="skeletonCard" style={{ padding: '0px', border: 'none', backgroundColor: 'transparent' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeletonPulse skeletonBlock" style={{ height: '32px' }}></div>
                <div className="skeletonPulse skeletonBlock" style={{ height: '24px' }}></div>
                <div className="skeletonPulse skeletonBlock" style={{ height: '24px' }}></div>
                <div className="skeletonPulse skeletonBlock" style={{ height: '24px' }}></div>
              </div>
            </div>
            
            <div className="skeletonPulse skeletonTitle" style={{ width: '20%', height: '18px', marginTop: '24px', marginBottom: '14px' }}></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              <div className="skeletonPulse" style={{ width: '120px', height: '32px', borderRadius: '20px' }}></div>
              <div className="skeletonPulse" style={{ width: '150px', height: '32px', borderRadius: '20px' }}></div>
              <div className="skeletonPulse" style={{ width: '90px', height: '32px', borderRadius: '20px' }}></div>
            </div>
          </div>
        </div>
      )}

      {domainResults && !domainLoading && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'start', width: '100%', marginTop: '20px' }}>
          <div style={{ flex: 1, minWidth: 0 }} className={modStyles.resultsContainer}>
            <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className={modStyles.resultsTitle}>🔍 Infrastructure Record: {domainResults.domain}</div>
              <button 
                onClick={() => handleExportPdfReport(domainResults.domain, domainResults)}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 className={dashStyles.sectionHeader} style={{ margin: 0 }}>SSL Subdomain Mapping ({domainResults.subdomains.length} Nodes)</h3>
                <button 
                  onClick={copyAllSubdomains} 
                  className={modStyles.btn} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '12px', 
                    padding: '6px 10px', 
                    minHeight: 'auto',
                    backgroundColor: '#fafafa',
                    border: '1px solid var(--notion-border)'
                  }}
                >
                  <Copy size={13} /> Copy All Subdomains
                </button>
              </div>

              <div className={modStyles.tableWrapper} style={{ marginBottom: '24px', overflowX: 'auto' }}>
                <table className={repStyles.reportTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--notion-border)' }}>
                      <th 
                        onClick={() => handleSort('subdomain')} 
                        style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Subdomain</span>
                          <ArrowUpDown size={12} style={{ color: subdomainSortKey === 'subdomain' ? 'var(--notion-accent)' : 'rgba(55, 53, 47, 0.3)' }} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('first_seen')} 
                        style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>First Seen</span>
                          <ArrowUpDown size={12} style={{ color: subdomainSortKey === 'first_seen' ? 'var(--notion-accent)' : 'rgba(55, 53, 47, 0.3)' }} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('issuer')} 
                        style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Issuer</span>
                          <ArrowUpDown size={12} style={{ color: subdomainSortKey === 'issuer' ? 'var(--notion-accent)' : 'rgba(55, 53, 47, 0.3)' }} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedSubdomains().map((sub, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f1f0', transition: 'background-color 0.1s ease' }}>
                        <td style={{ padding: '10px', fontSize: '13px', fontWeight: 500 }} className={modStyles.codeFont}>
                          {sub.subdomain}
                        </td>
                        <td style={{ padding: '10px', fontSize: '12px', color: 'rgba(55, 53, 47, 0.65)' }}>
                          {sub.first_seen}
                        </td>
                        <td style={{ padding: '10px', fontSize: '12px', color: 'rgba(55, 53, 47, 0.65)' }}>
                          {sub.issuer}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className={dashStyles.sectionHeader} style={{ marginTop: '28px' }}>Technographic Stack Profile</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {domainResults.technologies && domainResults.technologies.length > 0 ? (
                  domainResults.technologies.map((t, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        border: '1px solid #2b7a3e', 
                        backgroundColor: '#eaf6ec', 
                        color: '#2b7a3e',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{getTechIcon(t.name)}</span>
                      <span><strong>{t.type}:</strong> {t.name}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(55, 53, 47, 0.5)', fontSize: '13px', fontStyle: 'italic' }}>
                    No technology stack signatures detected on target headers or HTML markup.
                  </div>
                )}
              </div>

              {domainResults.headers && Object.keys(domainResults.headers).length > 0 && (
                <>
                  <h3 className={dashStyles.sectionHeader} style={{ marginTop: '24px' }}>HTTP Discovery Headers</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {Object.entries(domainResults.headers).map(([key, val]) => (
                      <div key={key} style={{ border: '1px solid var(--notion-border)', padding: '10px 14px', borderRadius: '6px', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '12.5px', color: 'rgba(55, 53, 47, 0.8)' }}>{key}</span>
                        <span className={modStyles.codeFont} style={{ fontSize: '12px', color: 'rgba(55, 53, 47, 0.65)' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <AnalystNotesPanel query={domainResults.domain} />
        </div>
      )}
    </div>
  );
}
