#!/usr/bin/env bash
set -euo pipefail
if ! command -v nginx >/dev/null 2>&1; then dnf install -y nginx; fi
systemctl enable --now nginx
systemctl restart nginx
curl -fsS http://localhost/ >/dev/null
