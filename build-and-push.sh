#!/bin/bash
# Builds all 3 images and pushes them to DockerHub.
# Usage: ./build-and-push.sh <dockerhub_username>
set -euo pipefail

DOCKERHUB_USER="${1:?Usage: ./build-and-push.sh <dockerhub_username>}"
BACKEND_URL="${2:-http://<MASTER_PUBLIC_IP>:30800}"   # REACT_APP_API_URL for the frontend build

echo ">> Logging into DockerHub"
docker login

echo ">> Building backend"
docker build -t "${DOCKERHUB_USER}/myapp-backend:latest" ./backend

echo ">> Building frontend (API URL baked in: ${BACKEND_URL})"
docker build -t "${DOCKERHUB_USER}/myapp-frontend:latest" \
  --build-arg REACT_APP_API_URL="${BACKEND_URL}" ./frontend

echo ">> Building database"
docker build -t "${DOCKERHUB_USER}/myapp-database:latest" ./database

echo ">> Pushing images"
docker push "${DOCKERHUB_USER}/myapp-backend:latest"
docker push "${DOCKERHUB_USER}/myapp-frontend:latest"
docker push "${DOCKERHUB_USER}/myapp-database:latest"

echo ""
echo "Done. Now update DOCKERHUB_USERNAME in k8s/*.yaml to '${DOCKERHUB_USER}' and run:"
echo "  kubectl apply -f k8s/"
