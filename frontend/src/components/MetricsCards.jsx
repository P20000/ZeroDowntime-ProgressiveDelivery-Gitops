import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function MetricsCards({ summary }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  return (
    <section className="metrics-grid">
      <div className="card metric-card inflow">
        <div className="metric-header">
          <span>Inflows (Revenue)</span>
          <TrendingUp size={16} style={{ color: 'var(--success)' }} />
        </div>
        <div className="metric-value" style={{ color: 'var(--success)' }}>
          {formatCurrency(summary.totalInflow)}
        </div>
        <div className="metric-trend up">
          <span>+12.4% vs last month</span>
        </div>
      </div>

      <div className="card metric-card outflow">
        <div className="metric-header">
          <span>Outflows (Expenses)</span>
          <TrendingDown size={16} style={{ color: 'var(--danger)' }} />
        </div>
        <div className="metric-value">
          {formatCurrency(summary.totalOutflow)}
        </div>
        <div className="metric-trend down">
          <span>-4.8% vs last month</span>
        </div>
      </div>

      <div className="card metric-card net">
        <div className="metric-header">
          <span>Net Cash Position</span>
          <DollarSign size={16} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <div className="metric-value" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(summary.netCash)}
        </div>
        <div className="metric-trend" style={{ color: summary.netCash >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          <span>Healthy balance</span>
        </div>
      </div>
    </section>
  );
}
