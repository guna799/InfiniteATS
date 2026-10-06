# InfiniteCareers - Deployment & Infrastructure Architecture

Production deployment blueprints, container definitions, Kubernetes manifests, and CI/CD pipelines for **InfiniteCareers** ATS & Employee Onboarding SaaS Platform.

## Deployment Options

### 1. Local Full-Stack Docker Compose
Spins up PostgreSQL 16 (with auto-seeded schema & Indian workforce data), Redis 7, Spring Boot 3 Backend, and Next.js 14 Frontend.

```bash
docker compose -f deployment/docker/docker-compose.yml up --build
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080/api/v1`
- **Swagger Docs**: `http://localhost:8080/swagger-ui.html`
- **PostgreSQL**: `localhost:5432`

---

### 2. Production Docker Stack (with Nginx Gateway & Resource Limits)

```bash
# Deploy with one command
./deployment/scripts/deploy.sh

# Or directly with Docker Compose
docker compose -f deployment/docker/docker-compose.prod.yml up -d
```

---

### 3. Kubernetes Production Cluster Deployment

```bash
# 1. Apply Namespace
kubectl apply -f deployment/k8s/01-namespace.yaml

# 2. Apply ConfigMap and Secrets
kubectl apply -f deployment/k8s/02-config-secrets.yaml

# 3. Deploy Backend & Frontend Pods with Services
kubectl apply -f deployment/k8s/03-deployments.yaml

# 4. Configure Ingress & Horizontal Pod Autoscalers (HPA)
kubectl apply -f deployment/k8s/04-ingress-hpa.yaml
```

---

### 4. Database Backups

```bash
./deployment/scripts/backup-db.sh
```
