import express from 'express';
import pool from '../db.js';
import { redisClient, redisPub } from '../redis.js';
import { 
  activeSseConnections 
} from '../metrics.js';

const router = express.Router();

// Error simulation state
let simulateErrors = false;
let errorRate = 0.0; // 0.0 to 1.0

// Active SSE client array
let sseClients = [];

// Middleware to inject artificial errors if simulation is active
export function errorSimulationMiddleware(req, res, next) {
  if (simulateErrors && Math.random() < errorRate && req.path !== '/metrics' && req.path !== '/api/health') {
    return res.status(500).json({ error: 'Internal Server Error (Simulated)' });
  }
  next();
}

// Helper to broadcast transaction to all active SSE clients
export function broadcastTransaction(transaction) {
  sseClients.forEach((clientRes) => {
    clientRes.write(`data: ${JSON.stringify(transaction)}\n\n`);
  });
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    version: '1.0.0', 
    redis: redisClient.isOpen ? 'CONNECTED' : 'DISCONNECTED',
    postgres: pool.totalCount > 0 ? 'CONNECTED' : 'DISCONNECTED',
    errorSimulation: simulateErrors ? `ACTIVE (${errorRate * 100}%)` : 'INACTIVE'
  });
});

export function updateErrorSimulationState(active, rate) {
  simulateErrors = active;
  errorRate = rate;
  console.log(`Local error simulation state updated via Redis: active=${simulateErrors}, rate=${errorRate}`);
}

// Toggle error simulation (extremely useful for demonstrating canary deployment rollbacks!)
router.post('/simulate-errors', async (req, res) => {
  const { active, rate } = req.body;
  const newActive = !!active;
  const newRate = typeof rate === 'number' ? Math.max(0, Math.min(1, rate)) : 0.5;
  
  try {
    await redisPub.publish('control-commands', JSON.stringify({
      type: 'error-simulation',
      active: newActive,
      rate: newRate
    }));
    console.log(`Published error simulation toggle to Redis: active=${newActive}, rate=${newRate}`);
    res.json({ active: newActive, rate: newRate });
  } catch (err) {
    console.error('Failed to publish error simulation control command:', err);
    res.status(500).json({ error: 'Failed to update error simulation' });
  }
});

// Server-Sent Events Route for real-time transaction updates
router.get('/transactions/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Add this client response to listener array
  sseClients.push(res);
  activeSseConnections.inc();

  console.log(`New client connected to real-time feed. Active clients: ${sseClients.length}`);

  // Send a heartbeat ping every 15s to keep connections alive
  const pingInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients = sseClients.filter(c => c !== res);
    activeSseConnections.dec();
    console.log(`Client disconnected. Active clients: ${sseClients.length}`);
  });
});

export default router;
