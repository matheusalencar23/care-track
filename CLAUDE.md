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
- `app/verify-email` e `app/reset-password` — destinos dos links que a API envia por e-mail (`EMAIL_HOST` e `PASSWORD_RESET_HOST` no `.env` da API apontam para elas). A página (server component) lê o `?token=` de `searchParams` e passa como prop; o client component tira o token da URL com `history.replaceState` e o envia à API. Os tokens são de uso único: chame a API uma vez só (ref de guarda contra o Strict Mode). A API responde 422 para token inválido/expirado/usado (`isInvalidTokenError` em `shared/ApiError.ts`). O `next.config.ts` aplica `Referrer-Policy: no-referrer` nessas rotas. `app/forgot-password` pede o link de redefinição.
- `app/(authenticated)/` — route group das páginas para usuários logados (ex.: `dashboard`). Seu `layout.tsx` é um client component que só renderiza a página depois que `useCurrentUser` confirma o usuário: mostra carregamento, uma tela de erro com "Tentar novamente" (falha de rede/500) ou redireciona para `/login?expired=true` em 401. As páginas de login, cadastro e esqueci a senha são envolvidas por `app/ui/components/guest-only.tsx`, que manda quem já está logado para `/dashboard`. Não há `proxy.ts`; a proteção é toda no cliente, e o backend continua sendo a barreira real.
- Componentes de UI compartilhados ficam em `app/ui/`.

Alias de importação: `@/*` aponta para a raiz do repositório (ex.: `@/lib/api`, `@/hooks/auth/useLogin`).

## Regras do domínio (LGPD e registro de enfermagem)

O app trata dados sensíveis de saúde. O planejamento e o resumo legal estão em `ROADMAP.md`; em qualquer funcionalidade nova:

- Nunca guardar dados de pacientes em `localStorage`/`sessionStorage`/IndexedDB, URLs (use IDs opacos; nada de nome/CPF em rota ou query string) ou logs/analytics.
- Registros do histórico do paciente são **imutáveis** (COFEN): sem editar/excluir; correções via retificação vinculada.
- "Excluir paciente" é **arquivar**: o prontuário é mantido pelo prazo legal (Lei 13.787/2018, 20 anos).
- Autoria dos registros (nome + COREN, data/hora) vem da API, nunca de campos editáveis.
- Anexos só por URLs autenticadas/assinadas de curta duração; fotos e vídeos exigem autorização de uso de imagem registrada.
- Coletar apenas os dados necessários (minimização); a autorização real é sempre da API.
