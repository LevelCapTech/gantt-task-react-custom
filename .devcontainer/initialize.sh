#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  if [ -f .env.sample ]; then
    cp .env.sample .env
  else
    printf "# npm publish 用トークンを設定してください\n# 詳細は .env.sample を参照してください\nNPM_TOKEN=your-npm-token-here\n" > .env
  fi
fi
