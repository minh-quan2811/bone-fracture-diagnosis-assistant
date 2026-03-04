#!/bin/bash
# deploy.sh — called by GitHub Actions on every deployment
# Usage: bash deploy.sh <ECR_IMAGE> <AWS_REGION> <AWS_ACCOUNT_ID> <ECR_REPOSITORY>

set -e

ECR_IMAGE=$1
AWS_REGION=$2
AWS_ACCOUNT_ID=$3
ECR_REPOSITORY=$4

APP_DIR=/home/ubuntu/app

echo "==> Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin \
  "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "==> Pulling image: $ECR_IMAGE"
docker pull "$ECR_IMAGE"

echo "==> Stopping old containers..."
cd "$APP_DIR"
ECR_IMAGE="$ECR_IMAGE" docker compose -f docker-compose.prod.yml down --remove-orphans

echo "==> Starting new containers..."
ECR_IMAGE="$ECR_IMAGE" docker compose -f docker-compose.prod.yml up -d

echo "==> Running health check..."
for i in $(seq 1 12); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "Health check passed on attempt $i"
    exit 0
  fi
  echo "Attempt $i: HTTP $STATUS — retrying in 5s..."
  sleep 5
done

echo "Health check failed after 60 seconds"
exit 1