#!/usr/bin/env bash
set -euo pipefail

token="${NPM_TOKEN:-}"
if [ -z "${token}" ] || [ "${token}" = "your-npm-token-here" ]; then
  echo "Warning: NPM_TOKEN is not set. The dev container will still start successfully, but npm publish will require either setting NPM_TOKEN in .env or running 'npm login' inside the container." >&2
  token=""
fi

npmrc_path="/home/vscode/.npmrc"

if [ -f "${npmrc_path}" ]; then
  cp "${npmrc_path}" "${npmrc_path}.bak-$(date +%s)"
  {
    echo ""
    echo "# Added by devcontainer post-create.sh"
    echo "registry=https://registry.npmjs.org/"
  } >> "${npmrc_path}"
else
  cat > "${npmrc_path}" <<EOF
registry=https://registry.npmjs.org/
EOF
fi

if [ -n "${token}" ]; then
  echo "//registry.npmjs.org/:_authToken=${token}" >> "${npmrc_path}"
else
  echo "# NPM_TOKEN is not set; npm publish will require authentication." >> "${npmrc_path}"
fi

chmod 600 "${npmrc_path}"

if [ -f package.json ]; then
  set +e
  npm install
  status=$?
  set -e
  if [ "${status}" -ne 0 ]; then
    echo "Warning: npm install failed during post-create setup (exit code ${status}). The dev container will still start; run 'npm install' manually after fixing the issue. Check the npm output above for details." >&2
  fi
else
  echo "Warning: package.json not found in the workspace; skipped npm install." >&2
fi
