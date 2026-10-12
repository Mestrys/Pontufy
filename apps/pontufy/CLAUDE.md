@AGENTS.md

# Pontufy — Instruções para Agentes de IA

## O que é este projeto

Pontufy é uma plataforma B2B SaaS de gamificação corporativa. Empresas (tenants) contratam o serviço para transformar treinamentos internos em experiências engajadoras com pontos, recompensas reais e cursos gerados por IA. Há três perfis de usuário: `admin_rh` (gestor RH da empresa), `employee` (colaborador), `guest` (acesso restrito). `super_admin` é interno da Pontufy com email `@pontufy.com`.

---

## Stack e Versões Críticas

| Camada | Tecnologia | Versão/Nota crítica |
|---|---|---|
| Framework | Next.js | **16.2.9** — `middleware.ts` é DEPRECATED, usar `src/proxy.ts` |
| Auth | NextAuth v5 beta | Importar de `next-auth/react` no cliente, `@/auth` no servidor |
| ORM | Prisma + PostgreSQL | Supabase em produção; SQLite **apenas** local |
| AI | Vercel AI SDK | **v6** — `maxOutputTokens` (não `maxTokens`), `toTextStreamResponse` (não `toDataStreamResponse`) |
| Estado | Zustand | `src/store/useStore.ts` para pontos/busca, `useUserStore.ts` para sessão |
| Estilo | Tailwind CSS v4 | Tokens MD3 `md-*` em `src/app/globals.css` (`@theme`); ver "Tema Visual" |
| Email | Resend | Via `src/lib/email.ts`; sem `RESEND_API_KEY` imprime no console (dev) |
| Cache/Queue | Upstash Redis + QStash | Inicialização lazy obrigatória (Vercel Edge não suporta top-level await) |
| Pagamentos | Stripe | `src/app/api/integrations/` |

---

## Arquitetura e Convenções

### Isolamento Multi-Tenant (CRÍTICO)

**Nunca usar `prisma` diretamente para dados de tenant.** Sempre usar `getTenantDb(tenantId)`:

```typescript
// ✅ Correto — dados do tenant
const db = getTenantDb(session.user.tenantId);
const courses = await db.course.findMany();

// ✅ Correto — operações globais (auth, registro)
const user = await prisma.user.findUnique({ where: { email } });

// ❌ Errado — vaza dados entre tenants
const courses = await prisma.course.findMany();
```

Modelos com isolamento automático via `getTenantDb`: `User`, `Course`, `PointsLedger`, `AuditLog`, `Invitation`.
Modelos globais (sem filtro): `Tenant`, `LessonCompletion`.
`Reward`: leitura expõe global + próprio tenant; escrita restrita ao próprio tenant.
`Lesson`: não tem `tenantId` — escopo via relação com `Course`. Usar `findFirst` (nunca `findUnique`) para queries tenant-sensitivas de Lesson.

### Sessão e Auth

```typescript
// Server Component / Server Action
import { auth } from '@/auth';
const session = await auth();
if (!session) redirect('/login');
const { tenantId, role, id } = session.user;

// Client Component
import { useSession } from 'next-auth/react';
const { data: session } = useSession();
```

Roles: `admin_rh` | `employee` | `guest` | `super_admin`

### Middleware (proxy.ts)

O arquivo `src/proxy.ts` é o middleware do Next.js 16. Exporta `proxy` (named) e `config`. **Não criar `src/middleware.ts`** — causa conflito fatal.

Regras de rota:
- `/api/auth/*` → bypass total
- `/superadmin/login` → redireciona super_admin autenticado para `/superadmin`
- `/superadmin/*` → retorna 403 (não redirect) para não vazar existência da rota
- `/login`, `/register`, `/forgot-password`, `/reset-password` → redireciona usuário logado para `/dashboard`
- Sem autenticação → redirect para `/login`
- `/admin/*` → exige `role === 'admin_rh'`

### Geração de Cursos por IA

`src/actions/course-generator.ts` usa Vercel AI SDK com fallback em cadeia: **Gemini → OpenAI → Anthropic**. O provider ativo é determinado pelas env vars presentes em runtime.

Schema obrigatório por aula: `title`, `content` (mínimo 200 chars, Markdown completo), `pointsAwarded`.
Schema do quiz: `question`, `options` (array 3-5), `correctIndex` (0-based).

Ao adicionar novo provider ao fallback, inserir **antes** do Anthropic na cadeia (mais barato por token para volume).

### Caminhos de Arquivo Relevantes

```
src/
├── proxy.ts                    # Middleware Next.js 16 (autenticação/rotas)
├── auth.ts                     # NextAuth config completa (server-only)
├── auth.config.ts              # Auth config compartilhada (edge-safe)
├── backend/
│   ├── db.ts                   # prisma singleton + getTenantDb()
│   ├── session.ts              # Helpers de sessão server-side
│   └── types.ts                # Tipos compartilhados do backend
├── actions/
│   ├── course-generator.ts     # Geração de cursos com IA (multi-provider)
│   ├── lessons.ts              # Server actions de lições
│   └── rewards.ts              # Server actions de recompensas
├── lib/
│   ├── email.ts                # sendWelcomeEmail / sendPasswordResetEmail
│   ├── local-courses.ts        # Cache localStorage de cursos gerados (7 dias TTL)
│   └── i18n.ts                 # Traduções pt-BR / en / es
├── store/
│   ├── useStore.ts             # Zustand: pontos, busca
│   └── useUserStore.ts         # Zustand: dados do usuário logado
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Navbar com logout, links por role
│   │   └── AppShell.tsx        # Wrapper que omite navbar em rotas de auth
│   ├── player/
│   │   └── LessonContent.tsx   # Renderer Markdown para conteúdo de aulas
│   └── admin/
│       └── AIWizard.tsx        # Wizard de geração de cursos por IA
└── app/
    ├── login/page.tsx
    ├── register/page.tsx        # Requer ?token= de convite
    ├── (auth)/
    │   ├── forgot-password/     # Recuperação de senha
    │   └── reset-password/      # Redefinição (requer ?token=)
    ├── dashboard/
    ├── cursos/
    ├── player/[id]/             # Player de aulas (dark theme Udemy-style)
    ├── loja/                    # Vitrine de recompensas
    ├── wallet/                  # Histórico de pontos
    ├── admin/                   # Painel RH (role: admin_rh)
    └── superadmin/              # Console interno Pontufy
```

---

## Variáveis de Ambiente

### Obrigatórias em Produção

| Variável | Uso |
|---|---|
| `AUTH_SECRET` | JWT signing — gerar com `openssl rand -base64 32` |
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `DIRECT_URL` | Supabase Direct URL (para migrations Prisma) |

### Opcionais / Features

| Variável | Uso |
|---|---|
| `GEMINI_API_KEY` | Provider primário de IA (gemini-2.0-flash) |
| `OPENAI_API_KEY` | Provider secundário de IA |
| `ANTHROPIC_API_KEY` | Provider terciário de IA (claude-haiku-4-5) |
| `GOOGLE_COURSE_MODEL` | Override do modelo Gemini |
| `OPENAI_COURSE_MODEL` | Override do modelo OpenAI |
| `ANTHROPIC_COURSE_MODEL` | Override do modelo Anthropic |
| `RESEND_API_KEY` | Envio de email (sem esta var, emails são logados no console) |
| `EMAIL_FROM` | Remetente dos emails (`Pontufy <noreply@pontufy.com>`) |
| `NEXTAUTH_URL` | URL canônica da aplicação (necessário para reset de senha) |
| `UPSTASH_REDIS_REST_URL` | Cache Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Cache Redis |
| `QSTASH_URL` / `QSTASH_TOKEN` | Filas de background |
| `STRIPE_SECRET_KEY` | Pagamentos |

> **Vercel**: Configurar env vars para **Production + Preview + Development**. Configurar apenas em Production faz fallbacks falharem silenciosamente em Preview.

---

## Regras de Desenvolvimento

### O que NÃO fazer

- **Não usar `prisma` diretamente** para dados de tenant (vaza entre tenants)
- **Não criar `src/middleware.ts`** (conflita com `src/proxy.ts` no Next.js 16)
- **Não usar `maxTokens`** no AI SDK v6 (é `maxOutputTokens`)
- **Não usar `toDataStreamResponse()`** no AI SDK v6 (é `toTextStreamResponse()`)
- **Não inicializar clientes Upstash no top-level** (Vercel Edge — usar lazy init)
- **Não assumir filesystem persistente no Vercel** (SQLite não funciona; usar PostgreSQL)
- **Não hardcodar `tenantId`** — sempre ler da sessão autenticada
- **Não usar `findUnique` em Lesson** para queries que precisam de isolamento de tenant (usar `findFirst`)

### Padrão de Server Action

```typescript
'use server';
import { auth } from '@/auth';
import { getTenantDb } from '@/backend/db';

export async function minhaAction(dados: unknown) {
  const session = await auth();
  if (!session) throw new Error('Não autorizado');

  const db = getTenantDb(session.user.tenantId);
  // ...operações seguras...
}
```

### Padrão de API Route

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTenantDb } from '@/backend/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getTenantDb(session.user.tenantId);
  const data = await db.course.findMany();
  return NextResponse.json(data);
}
```

### Tema Visual (Dark)

Use sempre os tokens `md-*` de `src/app/globals.css`. Os contrastes abaixo foram medidos sobre `md-surface` (#141414). `npm run check:theme` roda no build e reprova as classes proibidas.

**Superfícies**

```
Fundo da página:     bg-md-surface-dim (#0a0a0a)
Card / painel:       bg-md-surface (#141414)
Campo / elevado:     bg-md-surface-container (#1f1f1f)
Divisor de card:     border-md-outline (#2a2a2a)
Borda de campo:      automática em input/select/textarea (#636363, 3,07:1)
```

**Texto**

```
Principal:           text-md-on-surface / text-white
Secundário:          text-md-on-surface-variant (#a3a3a3, 7,30:1)
Metadados/legenda:   text-md-on-surface-muted (#949494, 6,07:1)
Link / destaque:     text-md-primary-text (#d99bb8, 8,19:1)
Sobre preenchimento: text-md-on-primary, text-md-on-tertiary, text-md-on-highlight...
```

**Mapa semântico de cor** (uma cor, um significado)

```
Ação primária:       bg-md-primary text-md-on-primary hover:bg-md-primary-container
Pontos / sucesso:    text-md-tertiary · bg-md-tertiary/10 · border-md-tertiary/20
Alerta / aviso:      text-md-highlight · bg-md-highlight/10
Erro:                text-md-error · bg-md-error/10 · border-md-error/30
Chip tonal:          bg-md-tertiary-container text-md-on-tertiary-container
```

**Regras**

- `md-primary` (#5c4152) e `md-primary-container` (#b4585d) são **só preenchimento**: como texto ficam entre 2:1 e 3,9:1. Para texto e ícone na cor da marca, use `text-md-primary-text`.
- Em fundo translúcido (`bg-md-X/10`), o texto é `text-md-X`, nunca `text-md-on-X`. `on-X` só funciona sobre o preenchimento sólido; sobre o tinte chega a 1,02:1.
- Não use opacidade em texto (`text-.../60`, `opacity-50` em bloco de texto). Escolha o papel de texto mais fraco que ainda passa: `md-on-surface-muted`.
- Piso tipográfico de **12px** (`text-xs`, `text-label-sm`). Nada de `text-[9px]`, `text-[10px]` ou `text-[11px]`.
- Foco: o `:focus-visible` global desenha `outline` de 2px em `md-focus` (#f7d0a9). Não use `focus:outline-none`, exceto em campo com `focus:border-md-focus`.
- **White-label**: a cor do cliente sobrescreve `md-primary`, `md-primary-container`, `md-on-primary(-container)`, `md-primary-text` e `md-secondary` no `<html>` (`DynamicThemeProvider` → `deriveBrandTheme` em `lib/branding.ts`, que ajusta a cor até 4,5:1). Por isso, nada de hex fixo da paleta em componente: sobre `bg-md-primary` o texto é `text-md-on-primary` (pode ser escuro), nunca `text-white`. Em fundo tingido da marca (`bg-md-primary/15`), use `text-md-on-surface`, não `muted`. Logo e nome da empresa vêm de `useBrand()` / `<BrandMark />`.

**Proibido** (reprovado pelo `check:theme`)

```
alert() / confirm() / prompt()               → inline, useToast ou AlertDialog
text-gray-500/600/700, placeholder-gray-*   → text-md-on-surface-muted
emerald-*                                    → mapa semântico acima
text-md-primary, text-md-primary-container   → text-md-primary-text
text-md-on-surface-variant/NN                → text-md-on-surface-muted
text-[<12px]                                 → text-xs
```

### Diálogos, avisos e carregamento

- **Todo overlay modal usa `components/ui/Dialog`** (`variant` `center`, `right` ou `left`). Ele já entrega `role="dialog"`, `aria-modal`, foco inicial, foco preso, Escape, pilha de diálogos, trava de rolagem e foco devolvido a quem abriu. Não monte `fixed inset-0` próprio.
- Para fechar com condição (envio em andamento, respostas não salvas), use `dismissible={false}` ou trate o pedido em `onClose` e abra um `AlertDialog` de confirmação.
- Painel que só é modal em parte do tempo (gaveta do RH no celular) usa o hook `useModalBehavior`. Menu suspenso não é modal: use `useDismissableMenu`, que fecha com Escape, clique ou foco fora.
- **Nada de `alert()`, `confirm()` ou `prompt()`** (o `check:theme` reprova). Use:
  - erro de uma ação → texto inline perto do controle, com `role="alert"` (dentro de um diálogo, sempre inline: um toast fica fora do `aria-modal`);
  - confirmação de algo que aconteceu ou erro sem lugar fixo → `useToast()` (`tone: 'error'` para erro);
  - confirmação antes de uma ação destrutiva → `AlertDialog` com `destructive`.
- Mensagem de erro de API passa por `friendlyApiError()` (`src/lib/api-errors.ts`): nunca mostre o texto cru da rota ("lessonId inválido.").
- Carregamento de tela usa `Skeleton` dentro de `LoadingRegion` (anuncia "Carregando…"); spinner só dentro de botão. Tela vazia usa `EmptyState` com o próximo passo quando existir.
- Alvo de toque mínimo de **44px** (`h-11`/`size-11`; `Button` e `.md-btn` já têm). Para ícones pequenos, mantenha o desenho e aumente só a área clicável.

### Senha e Segurança

- Mínimo 8 caracteres (validado client-side **e** server-side)
- Hash: Node.js `scrypt` com salt aleatório — formato `"salt:hash"` (64 bytes hex)
- Verificação com `timingSafeEqual` para evitar timing attacks
- Cookies de sessão: `httpOnly: true`, `sameSite: lax`, `secure: true` em produção
- Session `maxAge`: 7 dias
- Convites de registro expiram em prazo definido pelo HR admin

---

## Seeds de Desenvolvimento

Usuários disponíveis localmente (senha: `123456`):

| Email | Role | Tenant |
|---|---|---|
| `admin@empresaalpha.com` | `admin_rh` | Empresa Alpha |
| `admin@alpha.com` | `admin_rh` | Empresa Alpha |
| `joao@empresaalpha.com` | `employee` | Empresa Alpha |
| `user@alpha.com` | `employee` | Empresa Alpha |
| `guest@alpha.com` | `guest` | Empresa Alpha |

Para super_admin, o usuário deve ter email `@pontufy.com` e role `super_admin` no banco.

Executar seed: `npx prisma db seed`

---

## QA e Testes

Playwright configurado em `playwright.config.ts` (Chromium em `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`).

Executar: `npx playwright test`

Testes existentes em `tests/auth-qa.spec.ts` cobrem 17 cenários de auth. Ao adicionar features, adicionar testes correspondentes em `tests/`.

Endpoint de diagnóstico de IA: `GET /api/admin/ai-status` — retorna status de cada provider configurado.

---

## Sugestões para Acelerar o Desenvolvimento

### Prioridade Alta (próximos sprints)

1. **Certificados de conclusão** — rota `src/app/api/certificates/` existe mas a UI de emissão não está conectada. Usar `jspdf` (já instalado) para gerar PDF com nome do usuário, curso e data.

2. **Webhook de postback** — `src/backend/postbackHandler.ts` e `src/app/api/postback/` existem. Integrar com parceiros de recompensa para confirmar resgates automaticamente.

3. **Analytics de RH** — `src/app/api/admin/analytics/` existe. Construir dashboard de métricas (taxa de conclusão, pontos distribuídos, cursos mais populares) usando `recharts` (já instalado).

4. **Notificações in-app** — `src/app/api/notifications/` existe. Implementar centro de notificações no Navbar usando Upstash Redis para publicar eventos (nova recompensa, curso atribuído, pontos ganhos).

### Prioridade Média

5. **Onboarding de novos tenants** — hoje o tenant é criado manualmente no superadmin. Criar fluxo de self-service com trial de 14 dias.

6. **Modo offline/PWA** — `local-courses.ts` já faz cache de cursos gerados. Expandir para Service Worker que mantém progresso de aulas offline.

7. **Relatórios de payroll** — `src/app/api/rewards/payroll/` existe. Conectar UI para HR admin exportar relatório mensal de resgates para integração com folha de pagamento.

8. **Rate limiting no login** — adicionar contador de tentativas falhadas por IP/email usando Upstash Redis (5 tentativas → bloqueio de 15 min).

### Qualidade de Código

9. **Testes de integração de API** — criar `tests/api/` com testes de Playwright API para rotas críticas (`/api/lessons/complete`, `/api/rewards/redeem`, `/api/auth/register`).

10. **Error boundaries** — `src/app/error.tsx` e `global-error.tsx` existem mas podem incluir envio automático de erros para Sentry/Datadog.

11. **Logs estruturados** — `src/backend/logger.ts` existe. Garantir que todos os Server Actions e API routes usem o logger (não `console.log`) para facilitar debugging em produção no Vercel.

---

## Problemas Conhecidos e Soluções

| Problema | Causa | Solução |
|---|---|---|
| Curso gerado sem conteúdo | Schema de IA com `contentSummary` de 2-4 frases | Corrigido: schema exige `content` mínimo 200 chars em Markdown |
| Player mostrando descrição do curso em todas as aulas | Bug em `player/[id]/page.tsx` linha ~194 | Corrigido: renderiza `lesson.contentUrl` via `LessonContent` |
| Middleware não aplicado | `src/middleware.ts` não existia (Next.js 16 usa `src/proxy.ts`) | O `proxy.ts` já está correto; nunca criar `middleware.ts` |
| SQLite perdendo dados no Vercel | Filesystem efêmero em serverless | Migrado para PostgreSQL (Supabase) |
| Clientes Upstash falhando em Edge | Inicialização no top-level | Corrigido: lazy initialization em todos os clientes |
| AI SDK v6 quebrando build | APIs renomeadas | `maxOutputTokens`, `toTextStreamResponse` |
| Variáveis de IA não detectadas em runtime | Configuradas apenas em Production no Vercel | Configurar para todos os environments |
