#!/usr/bin/env bash
set -euo pipefail

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "Warning: NPM_TOKEN is not set; npm publish may fail." >&2
fi

cat > /home/vscode/.npmrc <<EOF
registry=https://registry.npmjs.org/
EOF

if [ -n "${NPM_TOKEN:-}" ]; then
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> /home/vscode/.npmrc
fi

chmod 600 /home/vscode/.npmrc

npm install
