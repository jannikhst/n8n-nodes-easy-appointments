#!/bin/bash

# Stop any running n8n instance
pkill -f "n8n"
pnpm build
# Start n8n with custom extensions
export N8N_CUSTOM_EXTENSIONS=~/.n8n/custom
n8n start
