import React, { useState } from 'react';
import { Plus, X, CreditCard, Calendar, User, DollarSign } from 'lucide-react';

export default function InvoiceBuilder({ invoices, onCreateInvoice, onPayInvoice }) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName || !amount || !dueDate) return;
    
    onCreateInvoice({
      client_name: clientName,
      amount: parseFloat(amount),
      due_date: dueDate,
      status
    });

    // Reset form
    setClientName('');
    setAmount('');
    setDueDate('');
    setStatus('pending');
    setIsOpen(false);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid': return 'badge badge-paid';
      case 'pending': return 'badge badge-pending';
      case 'overdue': return 'badge badge-overdue';
      default: return 'badge';
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  return (
    <div className="card">
      <div className="section-header">
        <h2>Invoices</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setIsOpen(true)}>
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      <div className="invoice-list">
        {invoices.length === 0 ? (
          <div className="empty-state">
            <Plus size={36} />
            <p>No invoices created yet. Click "Create Invoice" to start.</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} className="invoice-item">
              <div className="invoice-info">
                <h4>{invoice.client_name}</h4>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} /> Due: {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              </div>
              <div className="invoice-meta">
                <span className="invoice-amount">{formatCurrency(invoice.amount)}</span>
                <span className={getStatusBadgeClass(invoice.status)}>{invoice.status}</span>
                {invoice.status !== 'paid' && (
                  <button 
                    className="btn btn-secondary btn-sm" 
                    title="Mark as Paid"
                    onClick={() => onPayInvoice(invoice.id)}
                    style={{ padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <CreditCard size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsOpen(false)} style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
            }}>
              <X size={20} />
            </button>
            
            <h3 className="modal-title">Create Mock Invoice</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Client Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Acme Corp" 
                    required 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Amount (USD)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="1500.00" 
                    required 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input 
                  type="date" 
                  required 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Initial Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
