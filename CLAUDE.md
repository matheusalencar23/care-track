# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

O CareTrack é uma aplicação web de acompanhamento de pacientes (informações clínicas, registros de evolução, acompanhamento multidisciplinar). Este repositório contém **apenas o frontend**: Next.js 16 (App Router), React 19, TypeScript e Tailwind CSS v4. Todos os dados vêm de um backend REST separado em `NEXT_PUBLIC_API_URL` (definido em `.env.local` e lido via `settings.ts`).

Textos da interface, mensagens de toast e erros de validação são em **português do Brasil**; mantenha novos textos voltados ao usuário em português.

## Comandos

```bash
npm run dev     # servidor de desenvolvimento em http://localhost:3000
npm run build   # build de produção (também faz a checagem de tipos)
npm run lint    # ESLint (eslint-config-next)
```

Não há framework de testes configurado.

## Arquitetura

Os dados fluem em camadas; siga a mesma divisão ao adicionar funcionalidades:

1. **`lib/api.ts`** — instância única e compartilhada do axios (`withCredentials: true`; a autenticação é baseada em cookies, nenhum token é manipulado no cliente). Um interceptor de resposta:
   - em caso de **401**, limpa o `localStorage` e redireciona para `/login?expired=true` (exceto se já estiver em `/login`);
   - converte todo erro do axios em `ApiError` (`shared/ApiError.ts`), usando `response.data.message` do backend, com uma mensagem genérica em português como fallback.
2. **`services/*.service.ts`** — funções assíncronas simples que encapsulam as chamadas ao `api` e retornam `response.data`. Os tipos de resposta ficam em `model/`.
3. **`hooks/<domínio>/use*.ts`** — hooks de cliente consumidos pelos componentes. Leituras usam `useQuery` do TanStack Query com chaves de `lib/query-keys.ts` (centralize novas chaves lá). Mutações exibem erros via `react-toastify` (`err instanceof ApiError ? err.message : mensagem genérica`) e navegam com `useRouter`. Observação: `useLogin` usa `useMutation` e invalida `queryKeys.auth.me`; já `useSignup`/`useLogout` são funções assíncronas comuns com try/catch.
4. **Componentes** — formulários usam `react-hook-form` + `zodResolver`, com o schema Zod (v4) definido no próprio arquivo do componente.

### Rotas (`app/`)

- `app/layout.tsx` — layout raiz: fundo em gradiente global, fonte Inter e tudo envolvido em `Providers` (`app/providers.tsx`: `QueryClientProvider` + `ToastContainer`).
- `app/page.tsx` — landing page pública; `app/login` e `app/signup` — páginas públicas de autenticação que usam `app/ui/components/external-layout.tsx`. Componentes específicos de uma página ficam numa pasta `components/` ao lado dela.
- `app/(authenticated)/` — route group das páginas para usuários logados (ex.: `dashboard`). Seu `layout.tsx` é um client component que renderiza o cabeçalho com o menu do usuário (via `useCurrentUser`) e o logout. Não há middleware/proxy protegendo rotas; o controle de acesso depende de o backend retornar 401 e de o interceptor do axios redirecionar.
- Componentes de UI compartilhados ficam em `app/ui/`.

Alias de importação: `@/*` aponta para a raiz do repositório (ex.: `@/lib/api`, `@/hooks/auth/useLogin`).
