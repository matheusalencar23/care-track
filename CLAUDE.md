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
   - em caso de **401**, redireciona para `/login?expired=true` (exceto se já estiver em `/login` ou se a requisição usar `{ skipAuthRedirect: true }`, como `getCurrentUser`);
   - converte todo erro do axios em `ApiError` (`shared/ApiError.ts`), usando `response.data.message` do backend, com uma mensagem genérica em português como fallback.
2. **`services/*.service.ts`** — funções assíncronas simples que encapsulam as chamadas ao `api` e retornam `response.data`. Os tipos de resposta ficam em `model/`.
3. **`hooks/<domínio>/use*.ts`** — hooks de cliente consumidos pelos componentes. Leituras usam `useQuery` do TanStack Query com chaves de `lib/query-keys.ts` (centralize novas chaves lá). Escritas usam `useMutation` com `onError: notifyError` (`lib/notify-error.ts`, toast com a mensagem do `ApiError` ou uma genérica), navegam com `useRouter` e expõem `{ <ação>: mutation.mutate, isPending }` — use `mutate` (não `mutateAsync`) para não gerar promises rejeitadas sem tratamento.
4. **Componentes** — formulários usam `react-hook-form` + `zodResolver`, com o schema Zod (v4) definido no próprio arquivo do componente.

### Rotas (`app/`)

- `app/layout.tsx` — layout raiz: fundo em gradiente global, fonte Inter e tudo envolvido em `Providers` (`app/providers.tsx`: `QueryClientProvider` + `ToastContainer`). O `QueryClient` não repete consultas que falham com 4xx; só erros de rede/5xx são tentados até 3 vezes.
- `app/page.tsx` — landing page pública; `app/login` e `app/signup` — páginas públicas de autenticação que usam `app/ui/components/external-layout.tsx`. Componentes específicos de uma página ficam numa pasta `components/` ao lado dela.
- `app/(authenticated)/` — route group das páginas para usuários logados (ex.: `dashboard`). Seu `layout.tsx` é um client component que só renderiza a página depois que `useCurrentUser` confirma o usuário: mostra carregamento, uma tela de erro com "Tentar novamente" (falha de rede/500) ou redireciona para `/login?expired=true` em 401. As páginas de login e cadastro são envolvidas por `app/ui/components/guest-only.tsx`, que manda quem já está logado para `/dashboard`. Não há `proxy.ts`; a proteção é toda no cliente, e o backend continua sendo a barreira real.
- Componentes de UI compartilhados ficam em `app/ui/`.

Alias de importação: `@/*` aponta para a raiz do repositório (ex.: `@/lib/api`, `@/hooks/auth/useLogin`).
