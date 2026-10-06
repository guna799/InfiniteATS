# InfiniteCareers — Full Ubuntu + Kubernetes Microservices Deployment

> **Target Environment**: Ubuntu Server (`3.142.91.246`)  
> **SSH Authentication**: `InfiniteATS.pem` (Local file, `chmod 400`)  
> **Target Namespace**: `dev`  
> **Container Runtime**: Docker / k3s Containerd  

---

## 📋 Master Deployment Specification

You are the senior DevOps/SRE engineer responsible for deploying the **InfiniteCareers** enterprise ATS platform.

### Objective
Deploy the existing InfiniteCareers application to the Ubuntu server:
* Server IP: `3.142.91.246`
* SSH User: `ubuntu`
* SSH Key: `./InfiniteATS.pem` (permissions `400`)
* Kubernetes Namespace: `dev`
* Deployment Architecture: Clean Modular Monolith Backend (Spring Boot 3 / Java 17) + Next.js 14 Frontend + PostgreSQL 16 + Redis 7 + OpenSearch

---

## 🏛️ Core Architectural Invariants (Do Not Split Artificially)

```text
                    Internet
                       │
                 Kubernetes Ingress
                       │
              ┌────────┴────────┐
              │                 │
          Frontend           Backend API
          Next.js           Spring Boot
                                │
              ┌─────────────────┼────────────────┐
              │                 │                │
          PostgreSQL          Redis          OpenSearch
          Source Truth       Runtime         Projection
                              State
                                │
                         Background Workers
                                │
                       Transactional Outbox
```

* **PostgreSQL** = Source of Truth (Row-Level Security & 55+ Relational Tables)
* **Redis** = Distributed Runtime State (Distributed Locks & WebSocket Pub/Sub)
* **Transactional Outbox** = Reliable Event Boundary (Guaranteed Delivery)
* **OpenSearch** = Rebuildable Search Projection (Decoupled Asynchronous Sync)
* **AI Gateway** = Controlled Intelligence Boundary (Assistive, Token-Capped & Audited)
* **Cryptographic Audit Chain** = Tamper-Evident Integrity Evidence (Monotonic & SHA-256)
* **OIDC / SAML / SCIM** = Enterprise Authentication & Lifecycle Management
* **RLS / RBAC / ABAC** = Multi-Tenant Authorization Boundary
* **PII Security Engine** = Data Protection Boundary (Statutory Masking)
* **OpenTelemetry / MDC** = Operational Visibility (`X-Correlation-ID`)

---

## 🚀 Execution Phases

### Phase 1: Local Discovery & Verification
* Inspect `frontend/`, `backend/`, `database/`, and `deployment/`.
* Verify Java 17 / Maven 3.9+ and Node.js 18+ / Next.js 14 stack.
* Verify Flyway migration scripts (`V1` to `V5`).

### Phase 2: Remote Server Preparation
* SSH to `ubuntu@3.142.91.246` using `./InfiniteATS.pem`.
* Inspect OS, CPU, RAM, Disk, and existing listening ports.
* Install Docker, Docker Compose, and lightweight production-grade Kubernetes (`k3s`).
* Verify `kubectl get nodes` reaches `Ready`.

### Phase 3: Kubernetes `dev` Namespace Setup
* Create namespace `dev`: `kubectl create namespace dev`.
* Set up ConfigMaps and Secrets for PostgreSQL, Redis, JWT, and SSO.

### Phase 4: Container Builds & Image Loading
* Multi-stage build for `infinitecareers/backend:dev` (Eclipse Temurin 17 JRE).
* Production standalone build for `infinitecareers/frontend:dev` (Next.js 14).
* Import/tag images into k3s containerd runtime: `k3s ctr images import` or local registry.

### Phase 5: Storage & Infrastructure Workloads
* Deploy PostgreSQL 16 with PVC (`5Gi`) + apply Flyway migrations (`V1` to `V5`).
* Deploy Redis 7 (`alpine`) with Cluster/Standalone mode.
* Deploy OpenSearch single-node (`discovery.type=single-node`).

### Phase 6: Application Deployment & Networking
* Deploy Spring Boot backend (`replicas: 2`, `readinessProbe`, `livenessProbe` on `/actuator/health`).
* Deploy Next.js frontend (`replicas: 2`).
* Deploy Kubernetes Ingress routing:
  * `/` $\to$ `frontend-service:3000`
  * `/api` $\to$ `backend-service:8080`
  * `/ws` $\to$ `backend-service:8080`

### Phase 7: Verification & Tenant Isolation Testing
* Verify all pods in `kubectl get pods -n dev` are `Running` and `Ready`.
* Verify backend $\leftrightarrow$ PostgreSQL connectivity and Flyway migration completion.
* Verify real-time STOMP WebSocket channel isolation.
* Verify OpenSearch search indexing state from Outbox events.
* Verify audit hash chain verification endpoint (`/api/v1/audit/verify-chain`).

---

## 🛠️ Operational Commands Reference

```bash
# View all dev resources
kubectl get all -n dev

# Stream backend logs
kubectl logs -f -l app=infinitecareers-backend -n dev

# Check database migrations
kubectl exec -it deployment/postgres -n dev -- psql -U postgres -d infinitecareers -c "SELECT version, description, success FROM flyway_schema_history;"

# Restart backend service
kubectl rollout restart deployment/infinitecareers-backend -n dev

# Complete teardown (if required)
kubectl delete namespace dev
```
