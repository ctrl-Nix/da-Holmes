import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import modStyles from '../Modules.module.css';
import dashStyles from '../Dashboard.module.css';
import repStyles from '../Reports.module.css';
import AnalystNotesPanel from '../components/AnalystNotesPanel';

export default function CryptoPage({ apiBase, handleExportPdfReport }) {
  const [cryptoAddress, setCryptoAddress] = useState('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoResults, setCryptoResults] = useState(null);
  const [cryptoError, setCryptoError] = useState('');

  const runCryptoAudit = async (e) => {
    if (e) e.preventDefault();
    if (!cryptoAddress.trim()) return;
    setCryptoLoading(true);
    setCryptoResults(null);
    setCryptoError('');

    try {
      const res = await fetch(`${apiBase}/api/crypto/${encodeURIComponent(cryptoAddress.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setCryptoResults(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to resolve wallet telemetry');
      }
    } catch (err) {
      setCryptoError(err.message || 'Failed to connect to blockchain.info API.');
    } finally {
      setCryptoLoading(false);
    }
  };

  return (
    <div className={modStyles.container}>
      <div>
        <h1 className={dashStyles.title}>Blockchain Tracker</h1>
        <div className={dashStyles.subtitle}>Trace Bitcoin address balances and transaction histories using standard API telemetry.</div>
      </div>

      <form onSubmit={runCryptoAudit} className={modStyles.inputGroup}>
        <label className={modStyles.inputLabel}>Bitcoin Address</label>
        <div className={modStyles.actionRow}>
          <div className={modStyles.inputWrapper} style={{ flexGrow: 1 }}>
            <span className={modStyles.inputIcon}></span>
            <input 
              className={modStyles.inputField} 
              placeholder="e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" 
              value={cryptoAddress}
              onChange={(e) => setCryptoAddress(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className={`${modStyles.btn} ${modStyles.btnPrimary} ${cryptoLoading ? modStyles.btnLoading : ''}`}
            disabled={cryptoLoading}
          >
            {cryptoLoading ? 'Auditing...' : 'Track Address'}
          </button>
        </div>
      </form>

      {cryptoLoading && (
        <div className={modStyles.resultsContainer}>
          <div className={modStyles.resultsHeader}>
            <div className="skeletonPulse skeletonTitle" style={{ margin: 0, height: '20px', width: '30%' }}></div>
          </div>
          <div className={modStyles.resultsBody} style={{ padding: '20px' }}>
            <div className="skeletonPulse skeletonBlock" style={{ height: '80px', marginBottom: '20px' }}></div>
            <div className="skeletonPulse skeletonBlock" style={{ height: '160px' }}></div>
          </div>
        </div>
      )}

      {cryptoError && (
        <div className={`${modStyles.bulletItem} ${modStyles.bulletDanger}`} style={{ marginTop: '14px' }}>
          <AlertTriangle size={14} />
          <span className={modStyles.bulletItemText}>{cryptoError}</span>
        </div>
      )}

      {cryptoResults && !cryptoLoading && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'start', width: '100%', marginTop: '20px' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
            
            {/* Total Flow Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              
              <div className={dashStyles.statCard} style={{ margin: 0, padding: '16px' }}>
                <div className={dashStyles.statLabel}>Current Balance</div>
                <div className={dashStyles.statValue} style={{ fontSize: '20px', color: 'var(--notion-accent)', wordBreak: 'break-all' }}>
                  {(cryptoResults.final_balance || 0).toFixed(6)} BTC
                </div>
                <div className={dashStyles.statSubtext} style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.65)' }}>
                  ≈ {Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cryptoResults.final_balance_usd || 0)}
                </div>
              </div>

              <div className={dashStyles.statCard} style={{ margin: 0, padding: '16px' }}>
                <div className={dashStyles.statLabel}>Total Received</div>
                <div className={dashStyles.statValue} style={{ fontSize: '20px', color: '#2b7a3e', wordBreak: 'break-all' }}>
                  {(cryptoResults.total_received || 0).toFixed(6)} BTC
                </div>
                <div className={dashStyles.statSubtext} style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.65)' }}>
                  ≈ {Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cryptoResults.total_received_usd || 0)}
                </div>
              </div>

              <div className={dashStyles.statCard} style={{ margin: 0, padding: '16px' }}>
                <div className={dashStyles.statLabel}>Total Sent</div>
                <div className={dashStyles.statValue} style={{ fontSize: '20px', color: '#d13438', wordBreak: 'break-all' }}>
                  {(cryptoResults.total_sent || 0).toFixed(6)} BTC
                </div>
                <div className={dashStyles.statSubtext} style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.65)' }}>
                  ≈ {Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cryptoResults.total_sent_usd || 0)}
                </div>
              </div>

              <div className={dashStyles.statCard} style={{ margin: 0, padding: '16px' }}>
                <div className={dashStyles.statLabel}>Transaction Count</div>
                <div className={dashStyles.statValue} style={{ fontSize: '20px', color: 'rgba(55, 53, 47, 0.8)' }}>
                  {cryptoResults.n_tx || 0}
                </div>
                <div className={dashStyles.statSubtext} style={{ fontSize: '12.5px' }}>
                  Node Price: ${cryptoResults.btc_price_usd?.toLocaleString() || 'N/A'}
                </div>
              </div>

            </div>

            {/* Transaction History Timeline */}
            <div className={modStyles.resultsContainer}>
              <div className={modStyles.resultsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div className={modStyles.resultsTitle}> Ledger Transaction History (Last 10)</div>
                <button 
                  onClick={() => handleExportPdfReport(cryptoAddress, cryptoResults)}
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
              <div className={modStyles.resultsBody} style={{ padding: '20px' }}>
                {cryptoResults.txs && cryptoResults.txs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '18px', borderLeft: '2px solid var(--notion-border)' }}>
                    {cryptoResults.txs.map((tx, idx) => (
                      <div key={tx.hash || idx} style={{ position: 'relative' }}>
                        
                        {/* Bullet indicator */}
                        <div style={{ 
                          position: 'absolute', 
                          left: '-26px', 
                          top: '4px', 
                          width: '14px', 
                          height: '14px', 
                          borderRadius: '50%', 
                          backgroundColor: tx.direction === 'IN' ? '#2b7a3e' : '#d13438',
                          border: '3px solid #ffffff',
                          boxShadow: '0 0 0 1px var(--notion-border)'
                        }}></div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.5)' }}>{tx.time || 'N/A'}</span>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              padding: '3px 8px', 
                              borderRadius: '10px', 
                              backgroundColor: tx.direction === 'IN' ? 'rgba(43, 122, 62, 0.1)' : 'rgba(209, 52, 56, 0.1)', 
                              color: tx.direction === 'IN' ? '#2b7a3e' : '#d13438'
                            }}>
                              {tx.direction || 'IN'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={modStyles.codeFont} style={{ fontSize: '11px', color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(tx.hash || ''); alert('Copied transaction hash!'); }} title="Click to copy hash">
                              TX: {tx.hash ? `${tx.hash.slice(0, 16)}...${tx.hash.slice(-16)}` : 'N/A'}
                            </span>
                            <span className={modStyles.codeFont} style={{ fontSize: '13px', fontWeight: 600, color: tx.direction === 'IN' ? '#2b7a3e' : '#d13438' }}>
                              {tx.direction === 'IN' ? '+' : '-'}{(tx.amount || 0).toFixed(6)} BTC
                            </span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(55, 53, 47, 0.5)' }}>
                    No transactions found for this address.
                  </div>
                )}
              </div>
            </div>

          </div>
          <AnalystNotesPanel query={cryptoAddress} />
        </div>
      )}
    </div>
  );
}
