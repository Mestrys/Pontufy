# Pontufy App

Aplicação real do Pontufy (`app.pontufy.com`) — plataforma B2B de aprendizado gamificado: trilhas geradas por IA, pontos por aula concluída e marketplace de recompensas de parceiros.

> A landing page pública (`pontufy.com`) vive no projeto irmão [`../pontufy`](../pontufy) e aponta para cá através da variável `VITE_APP_URL`.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** — dark mode estrito (`#0a0a0a` / `#141414`, bordas `#2a2a2a`, acentos emerald/mint)
- **Zustand 5** — estado global (saldo de pontos, progresso, resgates) com persistência em `localStorage`
- **Rotas serverless** — `POST /api/lessons/complete` e `POST /api/rewards/redeem`

## Rodando localmente

```bash
npm install
npm run dev     # http://localhost:3001
npm run build   # build de produção
npm run lint    # typecheck (tsc --noEmit)
```

## Estrutura

| Rota | Descrição |
|---|---|
| `/dashboard` | Hero imersivo (curso obrigatório) + carrosséis: Trilhas da IA, Continue de onde parou, Clube de Benefícios |
| `/courses` | Catálogo de cursos: em andamento, disponíveis e concluídos |
| `/courses/[courseId]` | Player 70/30 (conteúdo / currículo) com CTA "Concluir Aula e Ganhar X Pontos" |
| `/tracks` | Trilhas corporativas (agrupamentos de cursos com progresso agregado) |
| `/rewards` | Hub: evolução de pontos, marketplace, histórico e diplomas (mock) |
| `/login` | Autenticação — destino do botão de login da landing |

**Tema**: light/dark via `next-themes` (estratégia `class`), toggle no header. Dark é o padrão e preserva a paleta original; os tokens por tema vivem em [globals.css](src/app/globals.css) (`surface-*`, `edge`, `mint`, escala `ink-*`).

## Autenticação e RBAC

Auth real com **Auth.js v5 (JWT)** + **Supabase Postgres** (projeto `pontufy-production`):

- **Roles**: `MASTER_ADMIN` (só via seed, nunca pela UI) · `MANAGER` (gera cursos no Studio) · `EMPLOYEE` (aprende e resgata).
- **Registro por convite** (`/register`): exige código de acesso; o role vem do código (`invite_codes`), validado e consumido atomicamente no Postgres.
- **Middleware** ([src/middleware.ts](src/middleware.ts)): rotas privadas exigem sessão; `/superadmin` é exclusivo do MASTER_ADMIN; `/studio` é vetado a EMPLOYEE; `mustChangePassword` força `/force-reset-password` sem bypass.
- **Modelo de segurança do banco**: tabelas com RLS deny-all; toda a lógica (bcrypt via pgcrypto, convites, admin) vive em funções `SECURITY DEFINER` que exigem o `APP_SERVER_SECRET` — a chave anon sozinha não lê nem escreve nada.
- Config em `.env.local` (ver [.env.example](.env.example)).

## Motor de IA (geração de cursos)

`POST /api/generate-course` (protegida, veta EMPLOYEE) faz a geração real com streaming NDJSON. Provedor plugável via `AI_PROVIDER`:

- **Dev — Ollama local (custo zero, sem API key)**: `./setup-ai.sh` sobe o container ([docker-compose.yml](docker-compose.yml)) e baixa o `llama3` (~4,7 GB; use `./setup-ai.sh llama3.2:3b` para um modelo leve e mais rápido em CPU).
- **Produção/Vercel — Groq**: `AI_PROVIDER=groq` + `GROQ_API_KEY` (free tier em console.groq.com). A Vercel não roda Ollama (serverless, sem Docker).
- Se o motor estiver fora do ar, o Studio cai automaticamente no gerador determinístico (`/api/courses/generate`) — nunca quebra.
- O total de pontos é sempre recalculado e normalizado no servidor (a IA sugere a proporção; o teto da faixa é garantido).

## Próximos passos (backend real)

1. **Migrar cursos/pontos para o banco**: catálogo, progresso por usuário e ledger de pontos hoje são seed em memória ([src/lib/data.ts](src/lib/data.ts)) + Zustand no cliente.
2. **Saldo no servidor**: `/api/rewards/redeem` ainda recebe o saldo do cliente; deve ler do ledger.
3. **Postback de parceiros**: disparo auditável no resgate.
4. **Extração real de conteúdo das fontes**: PDFs/URLs/YouTube hoje entram no prompt só como referência; falta parsear o conteúdo.
