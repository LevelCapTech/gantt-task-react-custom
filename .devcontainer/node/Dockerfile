# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:latest

USER root

RUN apt-get update \
  && apt-get install -y git curl bash build-essential \
  && rm -rf /var/lib/apt/lists/*

# Install additional package managers
RUN npm install -g yarn pnpm

# Prepare workspace
WORKDIR /workspace

USER vscode

ENV NPM_CONFIG_REGISTRY=https://registry.npmjs.org/

# Display versions
RUN node -v && npm -v && yarn -v && pnpm -v
