#!/usr/bin/env bash
set -euo pipefail

# Give nginx a moment, then check content
for i in {1..5}; do
  if curl -fsS http://localhost/ | grep -q "Hello World"; then
    echo "Validation succeeded"
    exit 0
  fi
  sleep 1
done

echo "Validation failed: 'Hello World' not found"
exit 1
