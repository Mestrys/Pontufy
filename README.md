# Pontufy — Landing Page

Landing page de **demonstração** do Pontufy — plataforma B2B SaaS de gamificação corporativa que transforma treinamentos em pontos e recompensas reais (Amazon, Magalu, Shopee), aumentando o engajamento dos colaboradores.

> **Escopo:** este projeto é apenas a vitrine/demonstração do produto. Os simuladores (cursos, resgates, console de segurança) rodam 100% no navegador, sem backend. O sistema real (com login, banco de dados e API) é uma aplicação separada — veja [Integração com o sistema](#integração-com-o-sistema-pontufy).

## Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite 6](https://vite.dev) (build)
- [Tailwind CSS 4](https://tailwindcss.com) (estilos)
- [lucide-react](https://lucide.dev) (ícones) e [motion](https://motion.dev) (animações)
- i18n manual em PT-BR, EN-US e ES-LA ([src/translations.ts](src/translations.ts))

## Rodando localmente

Pré-requisito: Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build de produção

```bash
npm run build      # gera dist/
npm run preview    # serve o build localmente
```

## Integração com o sistema Pontufy

O botão **"Entrar na Plataforma"** (header e rodapé) leva ao sistema de login da aplicação real. O destino é configurado pela variável de ambiente `VITE_APP_URL` (ver [.env.example](.env.example)); o padrão é `https://app.pontufy.com`, e o link final é `{VITE_APP_URL}/login`.

Arquitetura planejada:

- `pontufy.com` — esta landing page (estática, Vercel)
- `app.pontufy.com` — o sistema Pontufy (aplicação com autenticação, multi-tenant, API)

Para apontar o botão para outro ambiente (staging, localhost), basta definir `VITE_APP_URL` no build — nenhuma alteração de código é necessária. A configuração fica centralizada em [src/config.ts](src/config.ts).

## Deploy (Vercel)

O projeto é um SPA estático — a Vercel detecta o Vite automaticamente (build `npm run build`, output `dist/`). Basta importar o repositório em [vercel.com/new](https://vercel.com/new) ou rodar `npx vercel --prod`.

Variável de ambiente opcional: `VITE_APP_URL` (URL do sistema, usada pelo botão de login).

## Estrutura

- `src/App.tsx` — composição da página e estado global (idioma, pontos, logs)
- `src/components/` — seções da landing (Hero, simuladores, console de segurança, FAQ etc.)
- `src/translations.ts` — textos nos 3 idiomas
- `vercel-nextjs-export/` — export alternativo em Next.js (não usado no deploy)
