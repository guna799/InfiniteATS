#!/usr/bin/env bash
# Deploys InfiniteCareers to the k3s `dev` namespace. Run on the server.
#
# CI passes the images to deploy:
#   BACKEND_IMAGE=ghcr.io/<owner>/infiniteats-backend:<sha> FRONTEND_IMAGE=ghcr.io/<owner>/infiniteats-frontend:<sha> ./deploy-k8s-dev.sh
# Without them it deploys the locally imported infinitecareers/{backend,frontend}:dev images.
# Optional: GHCR_PULL_TOKEN (+ GHCR_PULL_USER) to pull from private GHCR packages.
#
# Needs only namespace-scoped rights in `dev` (see bootstrap-ci-deployer.sh); the namespace must exist.
set -euo pipefail

NS=dev
K8S_DIR="$(cd "$(dirname "$0")/../k8s" && pwd)"
BACKEND_IMAGE="${BACKEND_IMAGE:-infinitecareers/backend:dev}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-infinitecareers/frontend:dev}"
APP_DEPLOYMENTS=(infinitecareers-backend infinitecareers-frontend)

# --- Secrets (generated here so no credentials live in git) ---------------------------
if ! kubectl -n "$NS" get secret infinitecareers-secrets >/dev/null 2>&1; then
  kubectl -n "$NS" create secret generic infinitecareers-secrets \
    --from-literal=POSTGRES_PASSWORD="$(openssl rand -hex 24)" \
    --from-literal=REDIS_PASSWORD="$(openssl rand -hex 24)" \
    --from-literal=APP_JWT_SECRET="$(openssl rand -hex 32)" \
    --from-literal=AUTH_SECRET="$(openssl rand -hex 32)"
fi
# Secrets added after the first deploy
if ! kubectl -n "$NS" get secret infinitecareers-secrets -o jsonpath='{.data.AUTH_SECRET}' | grep -q .; then
  kubectl -n "$NS" patch secret infinitecareers-secrets --type merge \
    -p "{\"stringData\":{\"AUTH_SECRET\":\"$(openssl rand -hex 32)\"}}"
fi

if [[ -n "${GHCR_PULL_TOKEN:-}" ]]; then
  kubectl -n "$NS" create secret docker-registry ghcr-pull \
    --docker-server=ghcr.io \
    --docker-username="${GHCR_PULL_USER:-github}" \
    --docker-password="$GHCR_PULL_TOKEN" \
    --dry-run=client -o yaml | kubectl apply -f -
fi

# --- Apply manifests with pinned images via a throwaway kustomize overlay ---------------
OVERLAY="$(mktemp -d "$K8S_DIR/.deploy-XXXXXX")"
trap 'rm -rf "$OVERLAY"' EXIT
cat > "$OVERLAY/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../dev
images:
- name: infinitecareers/backend
  newName: ${BACKEND_IMAGE%:*}
  newTag: ${BACKEND_IMAGE##*:}
- name: infinitecareers/frontend
  newName: ${FRONTEND_IMAGE%:*}
  newTag: ${FRONTEND_IMAGE##*:}
EOF

echo "Deploying backend=$BACKEND_IMAGE frontend=$FRONTEND_IMAGE"
kubectl apply -k "$OVERLAY"

# --- Wait for rollout; roll the app back if it doesn't become healthy ------------------
failed=0
for d in "${APP_DEPLOYMENTS[@]}"; do
  if ! kubectl -n "$NS" rollout status "deployment/$d" --timeout=600s; then
    echo "::error::Rollout of $d failed"
    kubectl -n "$NS" describe "deployment/$d" | tail -20 || true
    kubectl -n "$NS" logs "deployment/$d" --all-containers --tail=50 || true
    failed=1
  fi
done

if [[ $failed -ne 0 ]]; then
  echo "Rolling back application deployments"
  for d in "${APP_DEPLOYMENTS[@]}"; do
    kubectl -n "$NS" rollout undo "deployment/$d" || true
  done
  for d in "${APP_DEPLOYMENTS[@]}"; do
    kubectl -n "$NS" rollout status "deployment/$d" --timeout=600s || true
  done
  exit 1
fi

kubectl -n "$NS" get pods -o wide
