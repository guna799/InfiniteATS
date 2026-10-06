#!/usr/bin/env bash
# Deploys InfiniteCareers to the k3s `dev` namespace. Run on the server from the repo root
# after building/importing infinitecareers/{backend,frontend}:dev into k3s containerd.
set -euo pipefail
cd "$(dirname "$0")/../k8s/dev"

kubectl apply -f 00-namespace-config.yaml

if ! kubectl -n dev get secret infinitecareers-secrets >/dev/null 2>&1; then
  kubectl -n dev create secret generic infinitecareers-secrets \
    --from-literal=POSTGRES_PASSWORD="$(openssl rand -hex 24)" \
    --from-literal=REDIS_PASSWORD="$(openssl rand -hex 24)" \
    --from-literal=APP_JWT_SECRET="$(openssl rand -hex 32)" \
    --from-literal=AUTH_SECRET="$(openssl rand -hex 32)"
fi
# Secrets added after the first deploy
if ! kubectl -n dev get secret infinitecareers-secrets -o jsonpath='{.data.AUTH_SECRET}' | grep -q .; then
  kubectl -n dev patch secret infinitecareers-secrets --type merge \
    -p "{\"stringData\":{\"AUTH_SECRET\":\"$(openssl rand -hex 32)\"}}"
fi

kubectl apply -f 10-postgres.yaml -f 11-redis.yaml -f 12-opensearch.yaml
kubectl -n dev rollout status deployment/postgres --timeout=300s
kubectl -n dev rollout status deployment/redis --timeout=300s

kubectl apply -f 20-backend.yaml -f 21-frontend.yaml -f 30-ingress.yaml
kubectl -n dev rollout status deployment/infinitecareers-frontend --timeout=300s
kubectl -n dev rollout status deployment/infinitecareers-backend --timeout=600s
kubectl -n dev rollout status deployment/opensearch --timeout=300s
kubectl -n dev get pods -o wide
