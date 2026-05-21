import React, { useState } from 'react';
import { Search, Copy, Check, ExternalLink, ShieldAlert, FileText, Lock, FolderOpen } from 'lucide-react';
import styles from './DorkBuilder.module.css';

export default function DorkBuilder() {
  const [target, setTarget] = useState('example.com');
  const [copied, setCopied] = useState(false);

  // Grouped pre-built Google dorking queries
  const getDorkCategories = (t) => {
    const cleanTarget = t.trim() || 'example.com';
    return [
      {
        category: "📄 Exposed Documents & Files",
        icon: <FileText size={14} />,
        dorks: [
          { label: "PDF Documents Audit", query: `site:${cleanTarget} filetype:pdf` },
          { label: "Excel Sheets (Financials)", query: `site:${cleanTarget} filetype:xls OR filetype:xlsx` },
          { label: "Word Documents", query: `site:${cleanTarget} filetype:doc OR filetype:docx` }
        ]
      },
      {
        category: "🔑 Login & Credential Portals",
        icon: <Lock size={14} />,
        dorks: [
          { label: "Public Login Portals", query: `site:${cleanTarget} inurl:login OR inurl:signin OR intitle:login` },
          { label: "Password Leaks Sniffer", query: `site:${cleanTarget} intext:"password" OR intext:"passwd" OR intext:"credentials"` },
          { label: "Admin Control Panels", query: `site:${cleanTarget} inurl:admin OR intitle:admin OR inurl:cpanel` }
        ]
      },
      {
        category: "⚙️ Exposed Config & Code Files",
        icon: <ShieldAlert size={14} />,
        dorks: [
          { label: "Git Repository Exposed", query: `site:${cleanTarget} inurl:.git OR intitle:"index of / .git"` },
          { label: "Config Files (.env / .json / .yaml)", query: `site:${cleanTarget} filetype:env OR filetype:yml OR filetype:yaml OR filetype:json` },
          { label: "SQL Backups & Dumps", query: `site:${cleanTarget} filetype:sql OR filetype:backup OR filetype:dump` }
        ]
      },
      {
        category: "📂 Directory Listing & Indices",
        icon: <FolderOpen size={14} />,
        dorks: [
          { label: "Directory Listing (Index of)", query: `site:${cleanTarget} intitle:"index of /" OR intitle:"index of /admin"` },
          { label: "Exposed Log Files", query: `site:${cleanTarget} filetype:log OR inurl:logs` },
          { label: "Backup Directories", query: `site:${cleanTarget} inurl:backup OR inurl:bak OR inurl:backups` }
        ]
      },
      {
        category: "🌐 Google Cached & Linked Pages",
        icon: <Search size={14} />,
        dorks: [
          { label: "Google Cache Snapshot", query: `cache:${cleanTarget}` },
          { label: "Related Domain Affiliations", query: `related:${cleanTarget}` },
          { label: "Backlink Associations", query: `link:${cleanTarget}` }
        ]
      }
    ];
  };

  const categories = getDorkCategories(target);

  const handleCopyAll = () => {
    const allQueries = categories
      .flatMap(c => c.dorks)
      .map(d => d.query)
      .join('\n');
    
    navigator.clipboard.writeText(allQueries);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyQuery = (queryText) => {
    navigator.clipboard.writeText(queryText);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Google Dorking Query Builder</h1>
          <div className={styles.subtitle}>Auto-generate advanced target intelligence search operators for passive reconnaissance.</div>
        </div>
        <button className={styles.copyAllBtn} onClick={handleCopyAll}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "All Dorks Copied!" : "Copy All 15 Dorks"}</span>
        </button>
      </div>

      {/* Target input */}
      <div className={styles.inputSection}>
        <label className={styles.inputLabel}>Recon Target Domain or Username</label>
        <div className={styles.inputWrapper}>
          <Search className={styles.searchIcon} size={16} />
          <input 
            type="text"
            className={styles.inputField}
            placeholder="e.g. google.com or torvalds"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
      </div>

      {/* Categories stack */}
      <div className={styles.categoriesStack}>
        {categories.map((cat, idx) => (
          <div key={idx} className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              {cat.icon}
              <span>{cat.category}</span>
            </div>
            <div className={styles.chipsGrid}>
              {cat.dorks.map((dork, dIdx) => {
                const searchUrl = `https://google.com/search?q=${encodeURIComponent(dork.query)}`;
                return (
                  <div key={dIdx} className={styles.dorkChip}>
                    <div className={styles.chipLeft}>
                      <span className={styles.chipLabel}>{dork.label}</span>
                      <code className={styles.chipCode}>{dork.query}</code>
                    </div>
                    <div className={styles.chipRight}>
                      <button 
                        onClick={() => handleCopyQuery(dork.query)}
                        className={styles.actionBtn}
                        title="Copy Query"
                      >
                        <Copy size={12} />
                      </button>
                      <a 
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionBtn}
                        title="Execute in Google"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
