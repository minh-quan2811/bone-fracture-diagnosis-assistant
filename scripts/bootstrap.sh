#!/bin/bash
# bootstrap.sh — run ONCE on a fresh EC2 instance to prepare it for deployments
# After cloning the repo, run: bash scripts/bootstrap.sh

set -e

APP_DIR=/home/ubuntu/app

echo "==> Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release unzip

echo "==> Installing Docker from official repo..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

echo "==> Installing AWS CLI v2..."
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws

echo "==> AWS CLI version: $(aws --version)"

echo "==> Creating app directory..."
mkdir -p "$APP_DIR"

echo "==> Copying deploy files into place..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/docker-compose.prod.yml" "$APP_DIR/docker-compose.prod.yml"
cp "$SCRIPT_DIR/deploy.sh" "$APP_DIR/deploy.sh"
chmod +x "$APP_DIR/deploy.sh"

echo ""
echo "==> Bootstrap complete."
echo ""
echo "Next steps:"
echo "  1. Run: newgrp docker  (or log out and back in to apply docker group)"
echo "  2. Run: aws configure  (enter your IAM credentials)"
echo "  3. Create /home/ubuntu/app/.env with your production environment variables"
echo "  4. Push a commit to main to trigger the first deployment"