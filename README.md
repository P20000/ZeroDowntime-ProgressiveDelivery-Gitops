# AuraFinance: Mock Fintech Dashboard with Telemetry

A mock fintech dashboard built for small businesses to track cash flow, manage mock invoices, and view real-time transaction feeds. This application serves as the fullstack workload for testing our **Zero-Downtime Progressive Delivery & GitOps Pipeline**.

## Architecture Overview

```
                        ┌──────────────────┐
                        │   Web Browser    │
                        │ (React Frontend) │
                        └────────┬─────────┘
                                 │
                                 │ HTTP / SSE
                                 ▼
                        ┌──────────────────┐
                        │   Nginx Proxy    │
                        │ (Frontend Port)  │
                        └────────┬─────────┘
                                 │
                       ┌─────────┴─────────┐
                       │                   │
                       ▼                   ▼
             ┌──────────────────┐ ┌──────────────────┐
             │   Node.js API    │ │    Prometheus    │ Scrapes /metrics
             │ (Backend Port)   │ │  (Telemetry Port)│◄────────────────┐
             └──────┬─────┬─────┘ └──────────────────┘                 │
                    │     │                                            │
           Postgres │     │ Redis Pub/Sub                              │
                    ▼     ▼                                            │
             ┌──────────┐ ┌──────────┐                                 │
             │ Database │ │ Cache/MQ │                                 │
             └──────────┘ └──────────┘                                 │
                                                                       │
             (Background Traffic Simulator) ───────────────────────────┘
```

1. **Frontend (React + Vite):** A responsive dark-themed dashboard. Retrieves invoice and cash flow data, connects to backend Server-Sent Events (SSE) for real-time transaction updates, and contains controls to inject simulated errors.
2. **Backend (Node.js + Express):** Serves JSON endpoints, generates background transaction traffic to mock real business activity, runs SSE streams, and exports Prometheus metrics.
3. **Database (PostgreSQL):** Stores persistent financial transactions and invoice states.
4. **Cache & Stream (Redis):** Orchestrates transaction pub/sub triggers to push immediate updates to SSE clients.
5. **Observability (Prometheus):** Periodically scrapes `/metrics` endpoint from the backend to track request volume, errors, and latencies.

## Telemetry and DevOps Features

- **Background Simulator:** The backend automatically generates dummy transactions every 6 seconds. This guarantees active, real-world-style traffic patterns.
- **Prometheus Metrics Endpoint:** The backend exposes raw metrics at `/metrics` using `prom-client` including custom metrics:
  - `http_requests_total`: Counter tracking requests by method, route, and status code.
  - `http_request_duration_seconds`: Histogram measuring HTTP latencies.
  - `fintech_transactions_total`: Counter tracking types of transaction events (inflow/outflow).
  - `active_sse_connections`: Gauge tracking active client dashboards.
- **Simulate Backend Errors Switch:** The frontend dashboard includes a DevOps switch. Enabling it forces the backend to return `500 Internal Server Errors` for 60% of all requests. This allows you to easily simulate a failing deployment and trigger an automated canary rollback in Kubernetes!

## Running the Application Locally

Prerequisites: Ensure you have **Docker** and **Docker Compose** installed.

1. Clone or navigate to the directory.
2. Start the composition:
   ```bash
   docker-compose up --build
   ```
3. Open the services in your browser:
   - **Frontend:** [http://localhost:8080](http://localhost:8080)
   - **Prometheus Console:** [http://localhost:9095](http://localhost:9095)
   - **Backend API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - **Raw Telemetry Metrics:** [http://localhost:5000/metrics](http://localhost:5000/metrics)

## Verification Checklist

- [ ] Connect to `http://localhost:8080` and verify the Live Connection dot is blinking green.
- [ ] Observe the transaction feed. It should automatically update with new inflow/outflow entries every 6 seconds.
- [ ] Create a new invoice and click the **Credit Card icon (Pay)**. The invoice status will update to `paid` and a new inflow transaction will instantly slide in.
- [ ] Query Prometheus at `http://localhost:9095` for the metric `http_requests_total` to see traffic.
- [ ] Flip the **DevOps Testing & Canary Rollback Controls** switch to active.
- [ ] Refresh the page or perform actions. Verify in the network tab or console that some requests fail, and check `http_requests_total{status_code="500"}` in Prometheus to see the error rate spike.
