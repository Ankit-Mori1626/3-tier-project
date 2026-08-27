#!/bin/bash
# Run this ON THE MASTER NODE after terraform apply + ssh in.
# Usage: ./master-init.sh <MASTER_PRIVATE_IP>
set -euo pipefail

MASTER_IP="${1:?Usage: ./master-init.sh <master_private_ip>}"

sudo kubeadm init \
  --apiserver-advertise-address="${MASTER_IP}" \
  --pod-network-cidr=10.244.0.0/16

# Configure kubectl for the ubuntu user
mkdir -p "$HOME/.kube"
sudo cp -i /etc/kubernetes/admin.conf "$HOME/.kube/config"
sudo chown "$(id -u):$(id -g)" "$HOME/.kube/config"

# Install Flannel CNI (matches the pod-network-cidr above)
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

echo ""
echo "================================================================"
echo "Master initialized. Run this on EACH worker node to join them:"
echo ""
kubeadm token create --print-join-command
echo "================================================================"
