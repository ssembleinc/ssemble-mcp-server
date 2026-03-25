#!/bin/bash
#
# Ssemble MCP Server — Manual deployment script
# Usage: ./deploy/deploy.sh [machine_ip ...]
# Example: ./deploy/deploy.sh 10.0.0.12
# Default: deploys to both API servers (10.0.0.12, 10.0.0.13)
#
# First-time setup on a server:
#   1. SSH to the server: ssh ssemble@10.0.0.12
#   2. Clone: git clone https://gitlab.com/vlogr/ssemble-mcp-server.git /home/ssemble/ssemble-mcp-server
#   3. cd /home/ssemble/ssemble-mcp-server && npm install --production
#   4. pm2 start process.json && pm2 save

set -e

MACHINES="${@:-10.0.0.12 10.0.0.13}"

echo "Deploying MCP Server to: $MACHINES"

for machine in $MACHINES; do
  echo ""
  echo "--- Deploying to $machine ---"

  ssh ssemble@$machine '
    source /home/ssemble/.bashrc &&
    cd /home/ssemble/ssemble-mcp-server &&
    git stash &&
    git checkout main &&
    git reset --hard HEAD &&
    git pull origin main &&
    export PATH=$PATH:/home/ssemble/.nvm/versions/node/v18.20.8/bin &&
    npm install --production &&
    pm2 stop ssemble-mcp-http || true &&
    pm2 delete ssemble-mcp-http || true &&
    pm2 start process.json &&
    pm2 save
  '

  echo "✅ $machine deployed"
done

echo ""
echo "Done! Verify with: curl http://10.0.0.12:3100/health"
