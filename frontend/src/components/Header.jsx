import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Header({ backendStatus, isConnected }) {
  return (
    <header className="header">
      <div className="brand-section">
        <div className="logo-icon">
          <Sparkles size={24} style={{ color: '#fff' }} />
        </div>
        <div>
          <h1 className="brand-title">AuraFinance</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            PLATFORM TELEMETRY DEMO
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Backend Status: <span style={{ 
            color: backendStatus === 'HEALTHY' ? 'var(--success)' : 'var(--danger)', 
            fontWeight: 700 
          }}>{backendStatus}</span>
        </div>
        <div className="connection-pill">
          <span className={isConnected ? "connection-dot" : ""} style={{ 
            backgroundColor: isConnected ? 'var(--success)' : 'var(--danger)',
            boxShadow: isConnected ? '0 0 10px var(--success)' : 'none'
          }}></span>
          <span>{isConnected ? "LIVE STREAM ACTIVE" : "STREAM DISCONNECTED"}</span>
        </div>
      </div>
    </header>
  );
}
