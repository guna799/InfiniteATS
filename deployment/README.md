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

### 5. Dev environment CI/CD (GitHub Actions → k3s `dev`)

Every push to `main` runs `.github/workflows/ci-cd.yml`:

1. **backend** – `mvn verify` (Java 17) and **frontend** – Prisma seed, `tsc`, `next build` (Node 22). PRs to `main` stop here.
2. **images** – builds both Dockerfiles and pushes `ghcr.io/<owner>/infiniteats-{backend,frontend}:<commit-sha>` (and `:dev`).
3. **deploy-dev** – SSHes to the server as the `deploy` user, uploads `deployment/`, and runs
   `deployment/scripts/deploy-k8s-dev.sh`, which applies `k8s/dev/` with the new image tags, waits for the
   rollout, and **rolls back automatically** if it fails. A smoke test then checks the public URL.

Deploys never run concurrently, and `workflow_dispatch` re-deploys `main` on demand.

**One-time setup**

1. On the server (once): `sudo deployment/scripts/bootstrap-ci-deployer.sh "<deploy public key>"`.
   It creates the `deploy` user (no sudo) whose kubeconfig can only act inside the `dev` namespace, and
   makes the k3s admin kubeconfig root-only.
2. In GitHub → Settings → Environments → `dev`:
   - Variable `DEV_HOST` = server IP, optional `DEV_SSH_USER` (default `deploy`)
   - Secret `DEV_SSH_PRIVATE_KEY` = the deploy private key
   - Secret `DEV_SSH_KNOWN_HOSTS` = the server's `ssh-keyscan` lines (pins the host key)
   - Optional secret `GHCR_PULL_TOKEN` = PAT with `read:packages`, only if the GHCR packages stay private
3. After the first image push, make the two GHCR packages public (or set `GHCR_PULL_TOKEN`).
4. The security group must allow SSH (22) from GitHub-hosted runners.

Manual deploy of locally imported images (no CI): `deployment/scripts/deploy-k8s-dev.sh`.
