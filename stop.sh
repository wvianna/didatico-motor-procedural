#!/usr/bin/env bash
#
# Encerra o servidor iniciado por ./start.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT/.server.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "Nenhum servidor registrado (não há .server.pid)."
  exit 0
fi

PID="$(cat "$PID_FILE")"

if ! kill -0 "$PID" 2>/dev/null; then
  echo "O processo $PID não estava ativo."
  rm -f "$PID_FILE"
  exit 0
fi

echo "→ Encerrando servidor (PID $PID)…"
kill "$PID" 2>/dev/null || true

for _ in $(seq 1 30); do
  kill -0 "$PID" 2>/dev/null || break
  sleep 0.1
done

if kill -0 "$PID" 2>/dev/null; then
  echo "→ Não encerrou sozinho; enviando SIGKILL."
  kill -9 "$PID" 2>/dev/null || true
fi

rm -f "$PID_FILE"
echo "Servidor finalizado."
