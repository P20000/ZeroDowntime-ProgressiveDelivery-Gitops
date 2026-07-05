import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

// Use connectionString if available, otherwise fallback to object config
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: config.postgres.connectionString }
    : {
        host: config.postgres.host,
        user: config.postgres.user,
        password: config.postgres.password,
        database: config.postgres.database,
        port: config.postgres.port,
      }
);

export async function initDb() {
  const client = await pool.connect();
  try {
    // Create Invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        due_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(12, 2) NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('inflow', 'outflow')),
        description VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if we need to seed the transactions for the dashboard
    const { rows } = await client.query('SELECT COUNT(*) FROM transactions');
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('Database empty. Seeding mock financial transactions...');
      
      // Seed some historical transactions for the last 30 days
      const types = ['inflow', 'outflow'];
      const inflowDescs = ['Stripe Payout', 'Invoice #1092 Paid', 'Client Retainer', 'SaaS Subscription Rev', 'AdSense Revenue'];
      const outflowDescs = ['AWS Hosting Bill', 'Co-working Office Rent', 'Marketing Ads', 'Github Enterprise Plan', 'Sentry Error Monitoring'];

      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        // Let's seed 1-3 transactions per day
        const numTransactions = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numTransactions; j++) {
          const type = Math.random() > 0.4 ? 'inflow' : 'outflow'; // slightly more inflow to show positive trend
          const description = type === 'inflow' 
            ? inflowDescs[Math.floor(Math.random() * inflowDescs.length)]
            : outflowDescs[Math.floor(Math.random() * outflowDescs.length)];
          
          const amount = type === 'inflow'
            ? (Math.random() * 2500 + 100).toFixed(2)
            : (Math.random() * 1200 + 20).toFixed(2);

          await client.query(
            'INSERT INTO transactions (amount, type, description, timestamp) VALUES ($1, $2, $3, $4)',
            [amount, type, description, date]
          );
        }
      }

      // Seed initial invoices
      await client.query(`
        INSERT INTO invoices (client_name, amount, status, due_date) VALUES
        ('Acme Corp', 5400.00, 'pending', NOW() + INTERVAL '14 days'),
        ('Global Tech LLC', 12000.00, 'pending', NOW() + INTERVAL '30 days'),
        ('Wayne Industries', 8500.00, 'paid', NOW() - INTERVAL '5 days'),
        ('Initech LLC', 250.00, 'overdue', NOW() - INTERVAL '10 days')
      `);
      
      console.log('Database seeded successfully.');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
