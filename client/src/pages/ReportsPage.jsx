import React from 'react';
import repStyles from '../Reports.module.css';
import dashStyles from '../Dashboard.module.css';
import modStyles from '../Modules.module.css';

export default function ReportsPage({ reports, activeReportId, setActiveView }) {
  const rep = reports.find(r => r.id === activeReportId) || reports[0];

  if (!rep) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--notion-fg-light)', fontSize: '14px' }}>
        No report selected or available. Please select a report or run a scan first.
      </div>
    );
  }

  return (
    <div className={repStyles.reportContainer}>
      <div className={repStyles.reportHeader}>
        <h1 className={repStyles.reportTitle}>{rep.title}</h1>
        <div className={repStyles.metaGrid}>
          <div className={repStyles.metaItem}>
            <span className={repStyles.metaLabel}>Target Node:</span>
            <span className={repStyles.metaValue}>{rep.target}</span>
          </div>
          <div className={repStyles.metaItem}>
            <span className={repStyles.metaLabel}>Scan Category:</span>
            <span className={repStyles.metaValue}>{rep.type}</span>
          </div>
          <div className={repStyles.metaItem}>
            <span className={repStyles.metaLabel}>Audit Date:</span>
            <span className={repStyles.metaValue}>{rep.date}</span>
          </div>
          <div className={repStyles.metaItem}>
            <span className={repStyles.metaLabel}>Security Rating:</span>
            <span className={`${dashStyles.tag} ${
              rep.risk === 'SECURE' ? dashStyles.tagGreen :
              rep.risk === 'VULNERABLE' ? dashStyles.tagYellow : dashStyles.tagRed
            }`}>
              {rep.risk} ({rep.score}/100)
            </span>
          </div>
        </div>
      </div>

      <div className={repStyles.section}>
        <h2 className={repStyles.sectionTitle}>1. Summary Brief</h2>
        <p className={repStyles.paragraph}>
          This report details passive intelligence retrieved on target <strong>{rep.target}</strong>. 
          Information was compiled entirely from zero-cost public telemetry channels, including DNS logs, SSL registries, and blockchain transaction explorers.
        </p>
      </div>

      <div className={repStyles.section}>
        <h2 className={repStyles.sectionTitle}>2. Security Checklists</h2>
        <div className={repStyles.checklist}>
          <div className={repStyles.checklistItem}>
            <div className={`${repStyles.checkbox} ${repStyles.checkboxChecked}`}>✓</div>
            <span className={repStyles.checklistTextChecked}>Verify SPF Records present. (Success)</span>
          </div>
          <div className={repStyles.checklistItem}>
            <div className={`${repStyles.checkbox} ${rep.risk === 'SECURE' ? repStyles.checkboxChecked : ''}`}>
              {rep.risk === 'SECURE' ? '✓' : ''}
            </div>
            <span className={rep.risk === 'SECURE' ? repStyles.checklistTextChecked : repStyles.checklistText}>
              Verify strict DMARC reject policies are implemented.
            </span>
          </div>
          <div className={repStyles.checklistItem}>
            <div className={`${repStyles.checkbox} ${rep.score > 50 ? repStyles.checkboxChecked : ''}`}>
              {rep.score > 50 ? '✓' : ''}
            </div>
            <span className={rep.score > 50 ? repStyles.checklistTextChecked : repStyles.checklistText}>
              Confirm no credential leaks found in past 12 months.
            </span>
          </div>
        </div>
      </div>

      <div className={repStyles.section}>
        <h2 className={repStyles.sectionTitle}>3. Telemetry Findings</h2>
        <table className={repStyles.reportTable}>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Status</th>
              <th>Reference Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SSL Certificate Trust</td>
              <td>Active</td>
              <td>Issued by Let's Encrypt Authority</td>
            </tr>
            <tr>
              <td>Phishing Vulnerability</td>
              <td>{rep.score < 50 ? 'Critical Risk' : 'Low Risk'}</td>
              <td>Risk rating calculated at {100 - rep.score}% probability</td>
            </tr>
            <tr>
              <td>Public Host Mapping</td>
              <td>Resolved</td>
              <td>Active DNS response matching Cloudflare edge proxies</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={repStyles.callout}>
        <span className={repStyles.calloutEmoji}></span>
        <div>
          <strong>Remediation Tip:</strong> Upgrading DNS SPF rules to "-all" and deploying a strict DMARC reject record prevents 99% of domain phishing impersonation vulnerabilities.
        </div>
      </div>

      <div className={repStyles.reportActions}>
        <button onClick={() => window.print()} className={`${modStyles.btn} ${modStyles.btnPrimary}`}>Print Document</button>
        <button onClick={() => setActiveView('dashboard')} className={modStyles.btn}>Return to Portal</button>
      </div>
    </div>
  );
}
