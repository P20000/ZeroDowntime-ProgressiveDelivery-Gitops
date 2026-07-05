import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Activity } from 'lucide-react';

export default function TransactionFeed({ transactions }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="card">
      <div className="section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} style={{ color: 'var(--accent-cyan)' }} /> 
          Real-Time Transaction Feed
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          SSE STREAM ACTIVE
        </span>
      </div>

      <div className="feed-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <Activity size={36} />
            <p>Waiting for transaction stream to start...</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id || Math.random()} className="feed-item">
              <div className={`feed-icon ${tx.type}`}>
                {tx.type === 'inflow' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
              </div>
              <div className="feed-details">
                <div className="feed-desc">{tx.description}</div>
                <div className="feed-time">{formatTime(tx.timestamp)}</div>
              </div>
              <div className={`feed-amount ${tx.type}`}>
                {tx.type === 'inflow' ? '+' : '-'}{formatCurrency(tx.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
