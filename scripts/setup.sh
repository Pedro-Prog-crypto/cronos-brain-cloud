#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Use o checkout existente: cada tarefa de nuvem já tem isolamento próprio.
# Não criar worktrees nem modificar o repositório Cronos Desktop.
npm ci
npm run check
npm run db:migrate
echo 'Base pronta. Siga README.md para provisionar um dispositivo local e iniciar.'
