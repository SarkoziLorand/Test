#!/usr/bin/env bash
set -euo pipefail

# Make sure our app files are readable
chown -R nginx:nginx /usr/share/nginx/html || true

# Start/restart nginx
systemctl restart nginx

