import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import DevOpsControls from './components/DevOpsControls';
import MetricsCards from './components/MetricsCards';
import CashFlowChart from './components/CashFlowChart';
import InvoiceBuilder from './components/InvoiceBuilder';
import TransactionFeed from './components/TransactionFeed';

export default function App() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    summary: { totalInflow: 0, totalOutflow: 0, netCash: 0 },
    dailyData: []
  });
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [errorSimulation, setErrorSimulation] = useState({ active: false, rate: 0.5 });
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const eventSourceRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    fetchInvoices();
    fetchStats();
    checkBackendHealth();
    
    // Check backend health every 10s
    const healthInterval = setInterval(checkBackendHealth, 10000);
    return () => clearInterval(healthInterval);
  }, []);

  // Establish SSE stream connection
  useEffect(() => {
    connectSseStream();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setBackendStatus('HEALTHY');
        setErrorSimulation({
          active: data.errorSimulation !== 'INACTIVE',
          rate: data.errorSimulation !== 'INACTIVE' ? 0.5 : 0
        });
      } else {
        setBackendStatus('ERROR');
      }
    } catch (e) {
      setBackendStatus('UNREACHABLE');
    }
  };

  const connectSseStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log('Connecting to SSE Transaction stream...');
    const es = new EventSource('/api/transactions/stream');
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('SSE Stream connected.');
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const transaction = JSON.parse(event.data);
        console.log('Received transaction via stream:', transaction);
        
        // 1. Add to live feed state (cap at 15 items)
        setLiveTransactions(prev => [transaction, ...prev].slice(0, 15));
        
        // 2. Fetch updated stats to trigger chart redraw
        fetchStats();
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    };

    es.onerror = (err) => {
      console.error('SSE Stream error, closing connection.', err);
      setIsConnected(false);
      es.close();
      
      // Attempt reconnection after 5s
      setTimeout(connectSseStream, 5000);
    };
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (e) {
      console.error('Error fetching invoices:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/cashflow/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const handleCreateInvoice = async (invoiceData) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      if (res.ok) {
        fetchInvoices();
      }
    } catch (e) {
      console.error('Error creating invoice:', e);
    }
  };

  const handlePayInvoice = async (id) => {
    try {
      const res = await fetch(`/api/invoices/${id}/pay`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchInvoices();
        fetchStats();
      }
    } catch (e) {
      console.error('Error paying invoice:', e);
    }
  };

  const handleToggleErrorSimulation = async () => {
    const newActive = !errorSimulation.active;
    const rate = newActive ? 0.6 : 0.0;
    try {
      const res = await fetch('/api/simulate-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive, rate })
      });
      if (res.ok) {
        setErrorSimulation({ active: newActive, rate });
        checkBackendHealth();
      }
    } catch (e) {
      console.error('Error toggling error simulation:', e);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Brand Header Component */}
      <Header backendStatus={backendStatus} isConnected={isConnected} />

      {/* DevOps Canary Controller Switch */}
      <DevOpsControls 
        errorSimulation={errorSimulation} 
        onToggle={handleToggleErrorSimulation} 
      />

      {/* Financial Stats Indicators */}
      <MetricsCards summary={stats.summary} />

      {/* Chart & Live Workspaces Layout */}
      <main className="workspace-grid">
        {/* Left Side - Large Cash Flow Graph */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="section-header">
            <h2>Cash Flow History (30 Days)</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              AUTO-REFRESHING CHART
            </span>
          </div>
          <CashFlowChart data={stats.dailyData} />
        </div>

        {/* Right Side - Action Modals & Alert Streams */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Invoice builder */}
          <InvoiceBuilder 
            invoices={invoices} 
            onCreateInvoice={handleCreateInvoice} 
            onPayInvoice={handlePayInvoice} 
          />

          {/* SSE Live Transaction Feed */}
          <TransactionFeed transactions={liveTransactions} />
        </div>
      </main>
    </div>
  );
}
