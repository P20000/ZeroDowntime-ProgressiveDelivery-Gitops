import express from 'express';
import pool from '../db.js';
import { redisPub } from '../redis.js';
import { transactionsCountTotal } from '../metrics.js';

const router = express.Router();

// Fetch outstanding and paid invoices
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Create a new invoice
router.post('/', async (req, res) => {
  const { client_name, amount, due_date, status = 'pending' } = req.body;
  if (!client_name || !amount || !due_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO invoices (client_name, amount, due_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [client_name, amount, due_date, status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// Pay an invoice (automatically registers an inflow transaction!)
router.post('/:id/pay', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get the invoice details
    const { rows: invoiceRows } = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const invoice = invoiceRows[0];
    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    // 2. Update status to 'paid'
    await pool.query('UPDATE invoices SET status = $1 WHERE id = $2', ['paid', id]);

    // 3. Create a corresponding transaction
    const desc = `Payment received: ${invoice.client_name}`;
    const { rows: txRows } = await pool.query(
      'INSERT INTO transactions (amount, type, description) VALUES ($1, $2, $3) RETURNING *',
      [invoice.amount, 'inflow', desc]
    );

    const transaction = txRows[0];

    // 4. Publish transaction to Redis pub/sub
    await redisPub.publish('transactions', JSON.stringify(transaction));
    transactionsCountTotal.inc({ type: 'inflow' });

    res.json({ message: 'Invoice paid successfully', transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Operation failed' });
  }
});

export default router;
