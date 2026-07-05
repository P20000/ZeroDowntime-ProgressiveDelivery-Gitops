import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import pool, { initDb } from './db.js';
import { redisSub, initRedis } from './redis.js';
import { metricsMiddleware, handleMetrics } from './metrics.js';

// Modular Route Imports
import invoicesRouter from './routes/invoices.js';
import statsRouter from './routes/stats.js';
import telemetryRouter, { 
  errorSimulationMiddleware, 
  broadcastTransaction,
  updateErrorSimulationState
} from './routes/telemetry.js';

// Modular Worker Imports
import { startSimulator } from './workers/simulator.js';

const app = express();

app.use(cors());
app.use(express.json());

// Enable Prometheus metrics collection middleware
app.use(metricsMiddleware);

// Middleware to inject artificial errors if DevOps simulation controls are toggled
app.use(errorSimulationMiddleware);

// Mount Modular API Routers
app.use('/api/invoices', invoicesRouter);
app.use('/api/cashflow', statsRouter);
app.use('/api', telemetryRouter);

// Raw Prometheus metrics endpoint for scraper agent
app.get('/metrics', handleMetrics);

// Initialize DB, Redis, Subscriber, and background simulator worker
async function startServer() {
  try {
    console.log('Initializing database tables...');
    await initDb();
    console.log('Database tables successfully initialized.');

    console.log('Initializing Redis client...');
    await initRedis();
    console.log('Redis client successfully initialized.');

    // Subscribe the shared Subscriber to Redis channels
    console.log('Subscribing to Redis channels...');
    await redisSub.subscribe('transactions', (message) => {
      const transaction = JSON.parse(message);
      broadcastTransaction(transaction);
    });
    await redisSub.subscribe('control-commands', (message) => {
      const command = JSON.parse(message);
      if (command.type === 'error-simulation') {
        updateErrorSimulationState(command.active, command.rate);
      }
    });
    console.log('Successfully subscribed to Redis channels.');

    // Start generating simulated transactions traffic
    startSimulator();

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`Fintech Backend Service running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Critical server startup error:', err);
    process.exit(1);
  }
}

startServer();

