#!/usr/bin/env bash
set -euo pipefail

# Install nginx if missing (Amazon Linux 2 / RHEL-family)
if ! command -v nginx >/dev/null 2>&1; then
  yum update -y
  yum install -y nginx
  systemctl enable nginx
fi

mkdir -p /usr/share/nginx/html
