import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function CashFlowChart({ data }) {
  // Format dates for chart readability
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 21, 36, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.4rem' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
              <span>{entry.name}:</span>
              <span>{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 320 }}>
      {formattedData.length === 0 ? (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          No cash flow data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
            <XAxis 
              dataKey="formattedDate" 
              stroke="#6b7280" 
              fontSize={11} 
              tickLine={false}
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={11} 
              tickLine={false}
              axisLine={false} 
              tickFormatter={formatCurrency}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '0.85rem', fontWeight: 600, paddingBottom: '1rem' }}
            />
            <Area 
              type="monotone" 
              name="Inflow" 
              dataKey="inflow" 
              stroke="#10b981" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorInflow)" 
            />
            <Area 
              type="monotone" 
              name="Outflow" 
              dataKey="outflow" 
              stroke="#f43f5e" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorOutflow)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
