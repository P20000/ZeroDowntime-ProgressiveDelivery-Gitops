import React from 'react';
import { ServerCrash } from 'lucide-react';

export default function DevOpsControls({ errorSimulation, onToggle }) {
  return (
    <section className="card controls-card">
      <div className="control-info">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ServerCrash size={18} style={{ color: errorSimulation.active ? 'var(--danger)' : 'var(--primary)' }} />
          DevOps Testing & Canary Rollback Controls
        </h3>
        <p>
          Simulate backend errors to trigger Prometheus metric alerts and test Argo Rollouts automated rollback capabilities.
        </p>
      </div>
      <div className="control-actions">
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: errorSimulation.active ? 'var(--danger)' : 'var(--text-secondary)' }}>
          {errorSimulation.active ? "Simulating HTTP 500 Errors (60%)" : "Backend Running Normally"}
        </span>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={errorSimulation.active}
            onChange={onToggle}
          />
          <span className="slider"></span>
        </label>
      </div>
    </section>
  );
}
