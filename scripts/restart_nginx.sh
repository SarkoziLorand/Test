#!/usr/bin/env bash
set -euo pipefail

# Make sure nginx is installed (Amazon Linux 2023)
if ! command -v nginx >/dev/null 2>&1; then
  dnf install -y nginx
fi

# Enable and restart the service
systemctl enable --now nginx
systemctl restart nginx

# Optional quick validation
curl -fsS http://localhost/ >/dev/null
