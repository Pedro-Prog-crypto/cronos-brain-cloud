#!/bin/sh
cd "$(dirname "$0")" || exit 1
node scripts/start-local.mjs
result=$?
if [ "$result" -ne 0 ]; then
  printf '\nO CRONOS não iniciou. Leia o erro acima.\n'
fi
printf '\nPressione Enter para fechar esta janela.\n'
read -r answer
exit "$result"
