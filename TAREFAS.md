# Tarefas — revisão de código (2026-11-01)

Lista de correções e melhorias levantadas na revisão. Marque `[x]` ao concluir cada uma.

## 🔴 Correções importantes

- [x] **1. Limpar o cache do React Query no logout**
  - `hooks/auth/useLogout.ts`: chamar `queryClient.clear()` antes de redirecionar.
  - Hoje, após logout, voltar para `/dashboard` mostra os dados do usuário anterior (cache com `staleTime` de 5 min em `useCurrentUser`). Crítico quando houver dados de pacientes (LGPD).

- [x] **2. Eliminar promises rejeitadas sem tratamento**
  - `useSignup` e `useLogout` fazem `throw err` depois do toast; `useLogin` expõe `mutateAsync`.
  - Os chamadores (`onSubmit` nos forms, `logout` em `app/(authenticated)/layout.tsx`) fazem `await` sem `catch` → erro não tratado / overlay do Next em dev.
  - Não relançar o erro e/ou usar `mutate` em vez de `mutateAsync`.

- [x] **3. Corrigir o modal "Esqueceu sua senha?"**
  - `app/login/page.tsx`: o `ReactModal` mostra "TESTE" e não tem `onRequestClose` nem botão de fechar (usuário fica preso).
  - O link `<a href="#">` em `loginForm.tsx` não faz `preventDefault`.
  - Esconder o link até o fluxo existir, ou adicionar o fechamento.

- [x] **4. Evitar envio duplo no login**
  - `app/login/components/loginForm.tsx`: botão não fica desabilitado durante `isPending`.
  - Usar o componente `Button` (`app/ui/button.tsx`) e fazê-lo aceitar `type`, `onClick` e demais props de `<button>`.

- [x] **5. Proteger as rotas autenticadas** (proteção no cliente; `proxy.ts` pendente)
  - [x] `app/(authenticated)/layout.tsx` renderiza `children` antes de confirmar o usuário; se a API cair (rede/500), a página abre vazia.
  - [x] Mínimo: estados de carregamento/erro no layout e só renderizar quando `user` existir.
  - [x] Redirecionar usuário logado que acessa `/login` e `/signup` para `/dashboard`.
  - [ ] Avaliar `proxy.ts` (middleware do Next 16) — só funciona se o cookie de sessão estiver visível no domínio do frontend. Decidir junto com o backend.

## 🟡 Melhorias

- [x] **6. Refazer a estrutura de layout base**
  - `body` com `overflow-hidden` + fundos decorativos `absolute` + `main` do dashboard com `absolute h-screen w-screen overflow-auto` (conteúdo fica sob o cabeçalho).
  - Usar `fixed inset-0 -z-10` nos fundos, remover `overflow-hidden` do `body` e deixar o fluxo normal da página. Fazer antes das telas com listas.

- [x] **7. Criar componente `Input` e corrigir acessibilidade dos formulários**
  - Extrair o markup repetido dos inputs (login e cadastro) para `app/ui/input.tsx` (no React 19 `ref` é prop, funciona com `register`).
  - Associar `<label htmlFor>` ao `id` do input.
  - E-mail com `type="email"`; adicionar `autoComplete` (`email`, `current-password`, `new-password`, `name`).
  - Label de senha no cadastro sem `mb-2 block`.
  - Mensagens de erro em `text-red-600` têm pouco contraste no fundo azul → usar `text-danger-400`.

- [x] **8. Centralizar o tratamento de erros**
  - Criar helper (ex.: `notifyError(err)`) para o padrão `instanceof ApiError ? toast(err.message) : mensagem genérica`, repetido 3 vezes.
  - No interceptor (`lib/api.ts`), diferenciar erro de rede (sem `response`) — ex.: "Não foi possível conectar ao servidor".

- [ ] **9. Padronizar os hooks de mutação**
  - Migrar `useSignup` e `useLogout` para `useMutation`, como `useLogin` (ganha `isPending`, ex.: botão "Sair" desabilitado).

- [ ] **10. Ajustar interceptor e configuração do React Query**
  - Remover `localStorage.clear()` do interceptor (app não usa localStorage; apaga dados de outros scripts do domínio).
  - Configurar `retry` no `QueryClient` (`app/providers.tsx`) para não repetir erros 4xx.

- [ ] **11. Validar `NEXT_PUBLIC_API_URL`**
  - `settings.ts`: lançar erro claro se a variável não estiver definida (hoje o axios usa URL relativa silenciosamente).

## 🟢 Detalhes

- [ ] Trocar `priority` por `preload` no `<Image>` de `app/(authenticated)/layout.tsx` (`priority` foi depreciado no Next 16).
- [ ] Remover `animate-in fade-in zoom-in-95` do dropdown ou instalar `tw-animate-css`.
- [ ] Renomear `SingUp` → `SignUp` (`app/signup/page.tsx`) e `RootLayout` → `AuthenticatedLayout` (`app/(authenticated)/layout.tsx`).
- [ ] Remover o TODO desatualizado "Implementar o fluxo de criação de conta" (`app/login/page.tsx`).
- [ ] `<html lang="pt">` → `lang="pt-BR"` (`app/layout.tsx`).
- [ ] Remover a devDependency `@types/react-toastify` (a v11 já traz tipos).
- [ ] `globals.css`: tokens `--background`, `--surface`, `--border`, `--foreground` etc. não geram utilitários do Tailwind (só `--color-*`). Renomear para `--color-*` ou remover.
- [ ] Deixar `app/login/page.tsx` como Server Component, isolando o modal num client component.
- [x] Dashboard: trocar `<header>Carregando...</header>` por um elemento adequado.
