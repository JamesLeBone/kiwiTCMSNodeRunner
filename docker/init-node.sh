#!/usr/bin/env bash
set -euo pipefail

cd /workspace

echo '[init-node] Checking Node dependencies...'
if [ ! -d node_modules ] || [ ! -f node_modules/.bin/next ]; then
    echo '[init-node] Installing npm packages'
    npm install
else
    echo '[init-node] Dependencies already installed'
fi

echo '[init-node] Launching shell'
exec "$@"
