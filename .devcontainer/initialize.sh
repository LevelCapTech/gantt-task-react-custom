#!/bin/bash
set -euo pipefail

if [ ! -f .env ]; then
  printf "# npm publish 用トークンを設定してください\nNPM_TOKEN=your-npm-token-here\n" > .env
fi
