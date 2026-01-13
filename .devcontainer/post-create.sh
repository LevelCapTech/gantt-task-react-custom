#!/usr/bin/env bash
set -euo pipefail

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "Warning: NPM_TOKEN is not set; npm publish may fail." >&2
fi

cat > /home/vscode/.npmrc <<EOF
//registry.npmjs.org/:_authToken=${NPM_TOKEN:-}
registry=https://registry.npmjs.org/
EOF

chmod 600 /home/vscode/.npmrc

npm install
