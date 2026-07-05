import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add standard default metrics (CPU, Memory, etc.)
client.collectDefaultMetrics({ register });

// Custom Metrics
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests made to the server',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5], // latency buckets
});

export const transactionsCountTotal = new client.Counter({
  name: 'fintech_transactions_total',
  help: 'Total number of fintech transactions simulated or generated',
  labelNames: ['type'],
});

export const activeSseConnections = new client.Gauge({
  name: 'active_sse_connections',
  help: 'Number of active SSE clients connected to real-time transaction feeds',
});

// Register custom metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(transactionsCountTotal);
register.registerMetric(activeSseConnections);

// Express Middleware to track request durations
export function metricsMiddleware(req, res, next) {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    
    // Ignore internal metrics requests themselves from skewing the results
    if (req.route && req.path !== '/metrics') {
      const route = req.route.path;
      const labels = {
        method: req.method,
        route: route,
        status_code: res.statusCode.toString(),
      };
      
      httpRequestsTotal.inc(labels);
      httpRequestDurationSeconds.observe(labels, durationInSeconds);
    }
  });

  next();
}

// Endpoint handler to expose the metrics
export async function handleMetrics(req, res) {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
}
