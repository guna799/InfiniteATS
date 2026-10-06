#!/usr/bin/env bash
# One-time server setup for GitHub Actions deploys. Run on the k3s server as a sudo-capable user:
#
#   sudo ./bootstrap-ci-deployer.sh "ssh-ed25519 AAAA... github-actions-deploy"
#
# Creates:
#   - namespace `dev` (the deployer cannot create cluster-scoped objects itself)
#   - ServiceAccount dev/github-deployer bound to the built-in `admin` role in `dev` only
#   - Linux user `deploy` (no sudo) whose kubeconfig uses that ServiceAccount
#   - the GitHub Actions public key in ~deploy/.ssh/authorized_keys, restricted (no pty/forwarding)
# Safe to re-run; replaces the deploy key with the one given.
set -euo pipefail

PUBKEY="${1:?usage: $0 '<ssh public key for GitHub Actions>'}"
NS=dev
SA=github-deployer
DEPLOY_USER=deploy
KUBECTL="k3s kubectl"

[[ $EUID -eq 0 ]] || { echo "Run with sudo" >&2; exit 1; }
[[ "$PUBKEY" == ssh-* ]] || { echo "Argument must be an SSH public key" >&2; exit 1; }

# k3s was installed with --write-kubeconfig-mode 644, which lets every local user (including `deploy`)
# read the cluster-admin kubeconfig. Make it root-only now and on future k3s restarts.
UNIT=/etc/systemd/system/k3s.service
sed -i -E "s/(--write-kubeconfig-mode)(=| +)644/\1\2600/" "$UNIT"              # --flag 644 / --flag=644
sed -i -E "/'--write-kubeconfig-mode'/{n;s/'644'/'600'/}" "$UNIT"           # installer's one-arg-per-line form
systemctl daemon-reload
chmod 600 /etc/rancher/k3s/k3s.yaml
# Copies of the admin kubeconfig made for other users
for f in /root/.kube/config /home/*/.kube/config; do
  [[ -f "$f" && "$f" != "/home/$DEPLOY_USER/.kube/config" ]] && chmod 600 "$f"
done
if grep -A1 -- "write-kubeconfig-mode" "$UNIT" | grep -q "644"; then
  echo "WARNING: could not rewrite --write-kubeconfig-mode in $UNIT; fix it by hand" >&2
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
$KUBECTL apply -f "$SCRIPT_DIR/../k8s/dev/00-namespace.yaml"

$KUBECTL apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: $SA
  namespace: $NS
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: $SA-admin
  namespace: $NS
subjects:
- kind: ServiceAccount
  name: $SA
  namespace: $NS
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: admin
---
apiVersion: v1
kind: Secret
metadata:
  name: $SA-token
  namespace: $NS
  annotations:
    kubernetes.io/service-account.name: $SA
type: kubernetes.io/service-account-token
EOF

for _ in $(seq 1 30); do
  TOKEN="$($KUBECTL -n $NS get secret $SA-token -o jsonpath='{.data.token}' 2>/dev/null | base64 -d || true)"
  [[ -n "$TOKEN" ]] && break
  sleep 1
done
[[ -n "${TOKEN:-}" ]] || { echo "ServiceAccount token was not issued" >&2; exit 1; }
CA_DATA="$($KUBECTL config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')"

id "$DEPLOY_USER" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$DEPLOY_USER"
HOME_DIR="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$HOME_DIR/.kube" "$HOME_DIR/.ssh"
umask 077
cat > "$HOME_DIR/.kube/config" <<EOF
apiVersion: v1
kind: Config
clusters:
- name: k3s
  cluster:
    server: https://127.0.0.1:6443
    certificate-authority-data: $CA_DATA
users:
- name: $SA
  user:
    token: $TOKEN
contexts:
- name: dev
  context:
    cluster: k3s
    namespace: $NS
    user: $SA
current-context: dev
EOF
echo "restrict $PUBKEY" > "$HOME_DIR/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "$HOME_DIR/.kube/config" "$HOME_DIR/.ssh/authorized_keys"

# Deploy checkouts land here
install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$HOME_DIR/infinitecareers"

echo "Verifying deployer permissions:"
sudo -u "$DEPLOY_USER" env KUBECONFIG="$HOME_DIR/.kube/config" kubectl auth can-i patch deployments -n $NS
sudo -u "$DEPLOY_USER" env KUBECONFIG="$HOME_DIR/.kube/config" kubectl auth can-i create namespaces || true
echo "Done. Host key line for the DEV_SSH_KNOWN_HOSTS secret:"
ssh-keyscan -t ed25519 127.0.0.1 2>/dev/null | sed "s/^127.0.0.1/$(curl -s --max-time 3 http://checkip.amazonaws.com || echo '<public-ip>')/"
