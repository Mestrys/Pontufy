# Código arquivado

Este diretório preserva o histórico do repositório `pontufy-app`, um experimento paralelo ("v2") que reimplementava o mesmo produto do app principal (`apps/pontufy`) com um backend diferente: Supabase RPC e Auth.js, sem Prisma, sem persistência real de cursos ou pontos.

Não é mantido e não faz parte do build ou deploy ativos do monorepo: fica fora da pasta `apps/`, então não é incluído nos workspaces raiz (`workspaces: ["apps/*"]`) nem instalado por `npm install` na raiz.

O app real e mantido é `apps/pontufy`.
