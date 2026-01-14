#!/usr/bin/env bash
set -euo pipefail

token="${NPM_TOKEN:-}"
if [ -z "${token}" ] || [ "${token}" = "your-npm-token-here" ]; then
  echo "Warning: NPM_TOKEN is not set. The dev container will still start successfully, but npm publish will require either setting NPM_TOKEN in .env or running 'npm login' inside the container." >&2
  token=""
fi

cat > /home/vscode/.npmrc <<EOF
registry=https://registry.npmjs.org/
EOF

if [ -n "${token}" ]; then
  echo "//registry.npmjs.org/:_authToken=${token}" >> /home/vscode/.npmrc
else
  echo "# NPM_TOKEN is not set; npm publish will require authentication." >> /home/vscode/.npmrc
fi

chmod 600 /home/vscode/.npmrc

if [ -f package.json ]; then
  if ! npm install; then
    status=$?
    echo "Warning: npm install failed during post-create setup (exit code ${status}). The dev container will still start; run 'npm install' manually after fixing the issue. Check the npm output above for details." >&2
  fi
else
  echo "Warning: package.json not found in the workspace; skipped npm install." >&2
fi
