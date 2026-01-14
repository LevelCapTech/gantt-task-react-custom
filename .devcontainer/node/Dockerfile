# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:latest

USER root

RUN apt-get update \
  && apt-get install -y git curl bash build-essential \
  && rm -rf /var/lib/apt/lists/*

# Install additional package managers (pinned for reproducibility)
RUN npm install -g yarn@1.22.19 pnpm@8.15.0

# Prepare workspace
WORKDIR /workspace

USER vscode
