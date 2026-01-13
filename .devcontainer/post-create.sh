#!/bin/bash
set -euo pipefail

token="${NPM_TOKEN:-}"
if [ -z "${token}" ] || [ "${token}" = "your-npm-token-here" ]; then
  echo "Warning: NPM_TOKEN is not set; set it in .env before running npm publish or run npm login inside the container." >&2
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

if ! npm install; then
  status=$?
  echo "Error: npm install failed during post-create setup (exit code ${status}). Check the npm output above for details." >&2
  exit "${status}"
fi
