#!/usr/bin/env bash
#
# Inicia o servidor web da simulação (build de produção) em segundo plano.
#
#   ./start.sh              → http://127.0.0.1:4173
#   PORT=8080 ./start.sh    → http://127.0.0.1:8080
#   HOST=0.0.0.0 ./start.sh → acessível na rede local
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-4173}"
PID_FILE="$ROOT/.server.pid"
LOG_FILE="$ROOT/.server.log"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Já existe um servidor em execução (PID $(cat "$PID_FILE"))."
  echo "Use ./stop.sh para finalizar antes de iniciar outro."
  exit 1
fi
rm -f "$PID_FILE"

if ! command -v node >/dev/null 2>&1; then
  echo "Erro: node não encontrado. Instale o Node.js 20 ou superior." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "→ Instalando dependências (npm install)…"
  npm install --no-audit --no-fund
fi

if [[ ! -f dist/index.html ]] || [[ -n "$(find src index.html -newer dist/index.html -print -quit 2>/dev/null)" ]]; then
  echo "→ Compilando (npm run build)…"
  npm run build
fi

echo "→ Iniciando servidor em http://$HOST:$PORT …"
nohup node node_modules/vite/bin/vite.js preview \
  --host "$HOST" --port "$PORT" --strictPort \
  >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" >"$PID_FILE"

sleep 1
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "Erro: o servidor encerrou logo após iniciar. Últimas linhas do log:" >&2
  tail -n 20 "$LOG_FILE" >&2 || true
  rm -f "$PID_FILE"
  exit 1
fi

echo "Pronto. PID $SERVER_PID — log em .server.log"
echo "Abra http://$HOST:$PORT"
