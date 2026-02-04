#!/bin/bash

# Setup Script for Docker Deployment on Ubuntu VM

# Exit on error
set -e

APP_DIR="/home/ubuntu/EmployeeManagementSystem"

echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "Installing Docker..."
# Add Docker's official GPG key:
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
fi

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "Starting Docker Service..."
sudo systemctl start docker
sudo systemctl enable docker

# Check if Nginx is running and stop it/ensure it proxies effectively
# In our architecture, Nginx (Host) -> Localhost:8000 (Docker Container)
# So we make sure Nginx IS running and configured, but we DON'T need the systemd service for python anymore.

echo "Stopping local Systemd backend service (if active)..."
sudo systemctl stop ems-backend || true
sudo systemctl disable ems-backend || true

echo "Configuring Nginx (if not already done)..."
# We reuse the same Nginx config because it points to localhost:8000
# And Docker will expose port 8000 on localhost.
sudo cp "$APP_DIR/deployment/nginx.conf" /etc/nginx/sites-available/ems
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default || true
fi
if [ ! -f /etc/nginx/sites-enabled/ems ]; then
    sudo ln -s /etc/nginx/sites-available/ems /etc/nginx/sites-enabled/
fi
sudo systemctl restart nginx

echo "Building and Starting Docker Containers..."
cd "$APP_DIR"
# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "ERROR: backend/.env file not found! Please create it with your DB credentials."
    exit 1
fi

sudo docker compose -f docker-compose.prod.yml up -d --build

echo "Docker Deployment Complete!"
sudo docker ps
