#!/usr/bin/env bash
# Sobe o motor de IA local (Ollama em Docker) e baixa o modelo.
# Uso: ./setup-ai.sh [modelo]   (default: llama3)
set -euo pipefail

MODEL="${1:-${OLLAMA_MODEL:-llama3}}"
CONTAINER="pontufy-ollama"
cd "$(dirname "$0")"

echo "==> Verificando o Docker..."
if ! docker info >/dev/null 2>&1; then
  echo "ERRO: o Docker não está rodando. Abra o Docker Desktop e tente de novo." >&2
  exit 1
fi

echo "==> Subindo o container do Ollama..."
docker compose up -d

echo "==> Aguardando o Ollama responder em http://localhost:11434 ..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
    break
  fi
  [ "$i" -eq 30 ] && { echo "ERRO: Ollama não respondeu em 30s." >&2; exit 1; }
  sleep 1
done

# 'pull' em vez de 'run': run abre um REPL interativo e trava em script
echo "==> Baixando o modelo '$MODEL' (pode demorar na primeira vez)..."
docker exec "$CONTAINER" ollama pull "$MODEL"

echo "==> Pronto! Teste rápido:"
curl -sf http://localhost:11434/api/generate \
  -d "{\"model\":\"$MODEL\",\"prompt\":\"Responda apenas: ok\",\"stream\":false}" \
  | grep -o '"response":"[^"]*"' || true

echo
echo "Ollama ativo em http://localhost:11434 com o modelo '$MODEL'."
echo "O app usa esse motor quando AI_PROVIDER=ollama (ver .env.local)."
