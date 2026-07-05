import pool from '../db.js';
import { redisPub } from '../redis.js';
import { transactionsCountTotal } from '../metrics.js';

const MOCK_INFLOW_DESCS = ['Stripe Payout', 'Consulting Retainer', 'SaaS Client Billing', 'App Store Rev Share', 'Angel Investment Interest'];
const MOCK_OUTFLOW_DESCS = ['Vercel Deploy Fee', 'Slack Subscription', 'OpenAI API Bill', 'Marketing Ads Run', 'Contractor Invoice'];

async function generateMockTransaction() {
  try {
    const isInflow = Math.random() > 0.45; // 55% inflow
    const type = isInflow ? 'inflow' : 'outflow';
    const amount = isInflow 
      ? (Math.random() * 800 + 50).toFixed(2)
      : (Math.random() * 400 + 10).toFixed(2);
    const description = isInflow
      ? MOCK_INFLOW_DESCS[Math.floor(Math.random() * MOCK_INFLOW_DESCS.length)]
      : MOCK_OUTFLOW_DESCS[Math.floor(Math.random() * MOCK_OUTFLOW_DESCS.length)];

    const { rows } = await pool.query(
      'INSERT INTO transactions (amount, type, description) VALUES ($1, $2, $3) RETURNING *',
      [amount, type, description]
    );

    const transaction = rows[0];
    
    // Publish to Redis for real-time dashboard listeners
    await redisPub.publish('transactions', JSON.stringify(transaction));
    
    // Increment telemetry metric
    transactionsCountTotal.inc({ type });

    console.log(`Generated simulated transaction: ${type} of $${amount} - "${description}"`);
  } catch (err) {
    console.error('Failed to generate mock transaction:', err);
  }
}

export function startSimulator() {
  console.log('Starting background transaction traffic simulator...');
  // Generate a mock transaction every 6 seconds
  setInterval(generateMockTransaction, 6000);
}
