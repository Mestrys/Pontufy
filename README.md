# Pontufy — Monorepo

Este repositório reúne, em um único monorepo com npm workspaces, o código e o histórico que antes viviam em três repositórios separados.

## Estrutura

```
apps/
├── pontufy/    Aplicação principal (Next.js 16 + Prisma/PostgreSQL) — app.pontufy.com
└── landing/    Site institucional (Vite + React, estático) — pontufy.com

archive/
└── pontufy-app-legacy/   Experimento "v2" descontinuado (Next.js 15 + Supabase RPC), fora do build/deploy ativo
```

Veja o README de cada app para detalhes específicos: [`apps/pontufy/README.md`](apps/pontufy/README.md), [`apps/landing/README.md`](apps/landing/README.md), [`archive/pontufy-app-legacy/README.md`](archive/pontufy-app-legacy/README.md).

## Desenvolvimento

```bash
npm install          # instala as dependências de todos os workspaces (apps/*)

npm run dev:pontufy    # roda o app principal
npm run dev:landing    # roda a landing page

npm run build:pontufy
npm run build:landing
```

`archive/pontufy-app-legacy` não faz parte dos workspaces (`workspaces: ["apps/*"]` na raiz) e não é instalado nem buildado a partir daqui.

## Deploy

Cada app em `apps/` corresponde a um projeto Vercel próprio, configurado com "Root Directory" apontando para a subpasta correspondente (`apps/pontufy` e `apps/landing`).
