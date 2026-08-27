#!/bin/bash
# Run this ON EACH WORKER NODE.
# Paste the full join command printed by master-init.sh, e.g.:
#   ./worker-join.sh "kubeadm join 10.0.1.10:6443 --token abcd.xxxx --discovery-token-ca-cert-hash sha256:xxxx"
set -euo pipefail

JOIN_CMD="${1:?Usage: ./worker-join.sh \"<full kubeadm join command from master>\"}"

sudo $JOIN_CMD

echo "Worker joined the cluster. Verify from the master with: kubectl get nodes"
