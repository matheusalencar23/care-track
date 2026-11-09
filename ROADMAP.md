# Roadmap — CareTrack

Planejamento das próximas etapas do frontend. O objetivo do produto: **o enfermeiro cadastra, busca, edita e arquiva seus pacientes e alimenta o histórico de cada um com textos, imagens, vídeos e outros arquivos.** Todas as operações passam pela API Node/Express.

> Os contratos com a API (sessão, erros, paginação e rotas) foram definidos em 04/11/2026 a partir do código da API (`care-track-api`, v1.4.2) e estão em [Acordos com a API](#acordos-com-a-api) e [Contratos da API](#contratos-da-api). As decisões de produto da API ficam no `docs/roadmap.md` dela e prevalecem sobre este arquivo.

---

## Requisitos legais e regulatórios

O CareTrack trata **dados pessoais sensíveis de saúde** e **registros de enfermagem**. Esses requisitos valem para todas as fases e devem ser revisitados a cada funcionalidade nova.

> Este resumo orienta decisões técnicas; não substitui a validação por um profissional jurídico ou pelo encarregado de dados (DPO) do projeto.

### LGPD (Lei 13.709/2018)

| Ponto | O que diz | Impacto no projeto |
|---|---|---|
| Dado sensível (art. 5º, II) | Dados de saúde, imagem e biometria são sensíveis. | Todo dado de paciente e todo anexo é tratado como sensível. |
| Base legal (art. 11, II, "f") | Tutela da saúde, em procedimento realizado por profissionais de saúde. | Dispensa consentimento para o prontuário em si, mas exige transparência e uso restrito à finalidade assistencial. |
| Minimização (art. 6º, III) | Coletar só o necessário. | Formulário de paciente enxuto; campos opcionais justificados; nada de "campos extras por precaução". |
| Segurança (art. 46) e incidentes (art. 48) | Medidas técnicas de proteção; comunicar incidentes à ANPD e aos titulares. | Ver [Segurança no frontend](#segurança-no-frontend). O fluxo de incidentes é do backend/organização, mas o frontend não pode ser o ponto de vazamento. |
| Direitos do titular (art. 18) | Acesso, correção, portabilidade, informação sobre compartilhamento. | Funcionalidade de exportar os dados de um paciente; correção pela edição com versões (ver COFEN). |
| Registro das operações (art. 37) | Manter registro das operações de tratamento. | A API registra quem acessou/alterou o quê; o frontend exibe esse histórico. |
| Crianças e adolescentes (art. 14) | Tratamento no melhor interesse; responsável legal. | Campo de responsável legal quando o paciente é menor. |
| Retenção (art. 16, I) | Dados podem ser mantidos para cumprir obrigação legal. | Justifica **arquivar** em vez de apagar prontuários (ver Lei 13.787). |
| Vedação de uso econômico (art. 11, §4º) | Proibido compartilhar dados de saúde para obter vantagem econômica. | Nada de analytics/rastreadores de terceiros com dados de pacientes. |

### Registro de enfermagem e prontuário

- **Resolução COFEN 429/2012** — registro das ações de enfermagem no prontuário, inclusive eletrônico. Cada registro deve identificar o profissional (**nome e número do COREN**), com data e hora.
- **Resolução COFEN 736/2024** — Processo de Enfermagem; orienta a estrutura dos registros (avaliação, diagnóstico, planejamento, implementação, evolução).
- **Código de Ética de Enfermagem (Resolução COFEN 564/2017)** — sigilo profissional; registros não podem ser rasurados ou apagados.
- **Lei 13.787/2018** — prontuário eletrônico e digitalização; guarda mínima de **20 anos** a partir do último registro.

**Consequências diretas no produto:**

1. **Nada do histórico é apagado.** Decisão da API: o registro pode ser **editado**, mas cada edição cria uma versão nova e as anteriores continuam consultáveis (motivo opcional). No lugar de excluir, o registro é **anulado** com motivo obrigatório (`wrong_patient`, `duplicate`, `other` + descrição). A anulação é definitiva, e o registro anulado sai da linha do tempo padrão, mas continua guardado.
2. **"Excluir paciente" significa arquivar.** O paciente sai das listas, mas o prontuário é mantido pelo prazo legal. A exclusão definitiva, se existir, é um processo administrativo do backend, não um botão comum.
3. **O cadastro do enfermeiro precisa do COREN** (número + UF) para identificar a autoria dos registros.

### Outros pontos

- **Direito de imagem (CF art. 5º, X; Código Civil art. 20)** — fotos e vídeos do paciente exigem autorização registrada (termo de uso de imagem), mesmo com finalidade clínica.
- **Nome social (Decreto 8.727/2016)** — boa prática exibir o nome social quando informado.
- **Acessibilidade (Lei 13.146/2015, art. 63)** — sites devem ser acessíveis; seguir WCAG nos componentes.
- **ANVISA (RDC 657/2022, software como dispositivo médico)** — enquanto o CareTrack for apenas registro e acompanhamento, sem sugerir diagnósticos ou condutas, tende a ficar fora do escopo. Funcionalidades de apoio à decisão clínica exigem reavaliação regulatória.
- **Assinatura digital (ICP-Brasil)** — exigida pela Lei 13.787 para documentos digitalizados e recomendada para validade jurídica plena do prontuário eletrônico. Avaliar em fase futura.

### Segurança no frontend

Regras para qualquer código novo:

- **Nada de dados de paciente em `localStorage`, `sessionStorage`, IndexedDB, URLs ou logs.** Rotas usam IDs opacos (UUID): `/pacientes/<uuid>`, nunca nome ou CPF. Termos de busca não vão para a query string.
- **Cache em memória apenas** (React Query), limpo no logout (já implementado). Avaliar `gcTime` curto para dados de pacientes.
- **Logout automático por inatividade**, com aviso antes de expirar.
- **Sem rastreadores ou analytics de terceiros.** Monitoramento de erros (ex.: Sentry) só com remoção de dados pessoais antes do envio.
- **Anexos nunca públicos**: acessados por URLs autenticadas ou assinadas de curta duração, sem cache no navegador.
- **Cabeçalhos de segurança** (implementados em 06/11/2026): `Content-Security-Policy` com nonce por requisição e `'strict-dynamic'` para scripts, `connect-src 'self'` e `frame-ancestors 'none'`, gerada no `proxy.ts`; `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (sem câmera, microfone e localização; rever se a Fase 3 usar a câmera pelo navegador), `Cross-Origin-Opener-Policy` e HSTS no `next.config.ts`. Estilos ficam com `'unsafe-inline'`. A Fase 3 precisa liberar na CSP o domínio do storage dos anexos para a visualização por URL assinada (`img-src`, `media-src` e, para a pré-visualização de PDF, `frame-src`). O upload passa pela API, então o `connect-src` continua `'self'`.
- **Dados mascarados por padrão** em listas (ex.: CPF `***.456.789-**`).
- A autorização real (cada enfermeiro só acessa seus pacientes) é **sempre** da API; o frontend apenas reflete.

---

## Fases

### Fase 0 — Fundação

Base para as funcionalidades de pacientes. Parte pode correr em paralelo com a definição dos contratos da API.

- [x] Definir com o backend: domínio do cookie de sessão (habilita ou não o `proxy.ts`), formato de erros, paginação e expiração da sessão. Ver [Acordos com a API](#acordos-com-a-api).
- [x] Proxy de mesma origem: rewrite de `/api/v1/*` para a API no `next.config.ts` (variável `API_URL` só do servidor, no lugar de `NEXT_PUBLIC_API_URL`) e `proxy.ts` que manda para o login quem acessa a área logada sem o cookie.
- [x] `ApiError` com `code` e `requestId`; tela de erro mostra o código da requisição para o suporte; `isInvalidTokenError` passa a usar o `code`.
- [ ] Acompanhar as [pendências na API](#pendências-na-api) que bloqueiam o front (sessão deslizante e rate limit antes da Fase 1).
- [x] Shell da área logada: navegação na barra superior, com "Pacientes" (página inicial após o login) e "Meu perfil" no menu do usuário. O `/dashboard` saiu e redireciona para `/pacientes`.
- [x] Kit de UI: `Modal`, `ConfirmDialog`, `Textarea`, `Select`, `DateInput`, campos com máscara (CPF, telefone), `Table`/lista, `Pagination`, `EmptyState`, `Skeleton`, `Badge`.
  - [x] Campos de formulário: `Field` comum (rótulo, dica e erro acessíveis), `Textarea`, `DateInput`, `MaskedInput` (com `react-imask`) com máscaras de CPF, telefone e Cartão SUS, que entrega só os dígitos, e validação de CPF igual à da API (`lib/masks.ts`).
  - [x] Listagem: `Table` (vira cartões no celular), `Pagination`, `EmptyState`, `Skeleton`, `Badge`.
  - [x] Diálogos: `Modal` (com `<dialog>` nativo) e `ConfirmDialog`; `Button` com variantes.
- [x] Logout automático por inatividade, no modelo de [sessão deslizante](#expiração-da-sessão).
- [x] Cabeçalhos de segurança: CSP com nonce por requisição no `proxy.ts` (todas as páginas passam a ser renderizadas por requisição) e os demais cabeçalhos no `next.config.ts`.
- [x] Testes: Vitest + Testing Library para componentes e hooks; Playwright para fluxos principais (login, logout, sessão expirada, aviso de inatividade e CSP), com a API simulada no navegador.
- [x] Recuperação de senha (`/forgot-password` e `/reset-password`, com o token do link do e-mail) e confirmação de e-mail (`/verify-email`, com reenvio do link).
- [x] Incluir **COREN + UF** no cadastro.
- [ ] Perfil do enfermeiro: nome, e-mail, **COREN + UF**. A página `/perfil` já mostra os dados (só leitura, via `GET /auth/me`); a edição depende de rota nova na API.
- [x] Páginas de Política de Privacidade (`/privacidade`) e Termos de Uso (`/termos`), com aceite obrigatório no cadastro. A API grava a versão aceita, com data e hora, numa tabela só de inclusão.
  - [ ] Preencher os marcadores de `lib/legal.ts` (responsável, CNPJ/CPF, endereço, encarregado, e-mails de privacidade e de suporte, provedor e local da hospedagem, mecanismo de transferência internacional do Resend, prazos e foro) e passar os textos pela revisão jurídica antes do primeiro paciente real.
  - [ ] Novo aceite de quem já tem conta quando os termos mudarem (depende da API: versão aceita no `/auth/me` e rota para registrar o aceite).
- [ ] Layout do formulário de cadastro (`/signup`): com nome, e-mail, COREN e UF, senha e aceite dos termos, o formulário ficou alto demais. Aproveitar a largura da tela em telas maiores (ex.: cartão mais largo com duas colunas, nome e e-mail lado a lado, COREN/UF ao lado da senha), mantendo uma coluna no celular e a ordem lógica de leitura e de tabulação.
- [ ] Links de Termos de Uso e Política de Privacidade na área logada: tirar do rodapé fixo e levar para um lugar mais adequado (ex.: menu do usuário no cabeçalho, junto de "Meu perfil", ou uma futura tela de informações de privacidade da Fase 4). Os documentos continuam acessíveis a partir de qualquer página logada; nas páginas públicas, os links continuam no rodapé.
- [ ] Barra de progresso de navegação no topo da tela, global, para todas as páginas (públicas e logadas, atuais e futuras): aparece quando uma navegação demora (ex.: mais de 150 ms, para não piscar em navegações rápidas) e some quando a página nova chega. Feita sem biblioteca, com o `useLinkStatus` do Next ou um `Link` próprio do projeto que todas as telas usem, para nenhuma página nova precisar de código extra. O `useLinkStatus` só cobre cliques em `<Link>`: as navegações por `router.push`/`replace` (ex.: depois de cadastrar, no redirecionamento por sessão expirada) também devem acionar a barra, com um hook de navegação do projeto no lugar do `useRouter` direto. Sem script inline nem de outro domínio (CSP). Acessível (`role="progressbar"` ou anúncio discreto) e sem animação para quem prefere movimento reduzido. Complementa os `loading.tsx` e o `placeholderData` da lista no detalhe, que ainda podem ser feitos.

### Fase 1 — Pacientes

- [x] Modelo `Patient` conforme a API: nome, data de nascimento e, opcionais, CPF, Cartão SUS (CNS) e telefone (só dígitos). Nome social, sexo e observações clínicas **não existem** na API; incluir só com decisão de minimização registrada lá. Em `model/patient.ts` (06/11/2026), conferido com o `patient.schema.ts` da API: `Patient` (resposta, opcionais vêm `null`) e `PatientData` (corpo do `POST` e do `PUT`).
  - Opcional vazio é **omitido** do corpo: a API não aceita `null` nem `""` (o `""` falha na validação do CPF/CNS/telefone) e grava `null` quando o campo falta. No `PUT`, omitir apaga o valor.
  - Regras da API para o Zod do formulário: nome obrigatório, sem espaços nas pontas, até 200 caracteres; nascimento `AAAA-MM-DD` entre 1900-01-01 e hoje; CPF com dígito verificador; CNS com 15 dígitos (sem dígito verificador); telefone com 10 ou 11 dígitos.
  - CPF e CNS são únicos por enfermeiro, mas a duplicidade volta como o `CONFLICT` genérico ("Este registro já existe."), sem dizer qual campo. Ver [Pendências na API](#pendências-na-api).
- [x] **Listagem** (`/pacientes`): busca no servidor com debounce (nome sem acento, ou CPF/CNS exatos), paginação por página, filtro ativos/arquivados, estado vazio, carregamento e erro; dados sensíveis mascarados. Implementada em 06/11/2026: busca, filtro e página ficam só no estado do componente (nunca na URL), o CPF aparece como `***.456.789-**` e a lista não mostra Cartão SUS nem telefone; cache das listas com `gcTime` de 1 min.
- [x] **Cadastro** (`/pacientes/novo`): formulário com Zod, máscaras e as mesmas validações da API (CPF com dígito verificador, CNS com 15 dígitos, telefone com DDD, nascimento entre 1900 e hoje). Implementado em 06/11/2026: o `PatientForm` (`pacientes/components/patient-form.tsx`) fica pronto para a edição; os erros por campo do 422 vão para o campo (`applyFieldErrors`, `lib/form-errors.ts`) e o CPF/CNS duplicado aparece no toast. Depois de cadastrar, abre o detalhe do paciente.
- [x] **Detalhe** (`/pacientes/<id>`): dados cadastrais + histórico (Fase 2). Implementado em 06/11/2026: CPF e Cartão SUS mascarados, com botão para mostrar (`SensitiveValue`); aviso de paciente arquivado; "Paciente não encontrado" para 404 e ID inválido (422 em `params`); o título da aba continua "CareTrack", sem o nome do paciente. O histórico entra na Fase 2. O cadastro passa a abrir o detalhe.
- [x] **Edição** (`/pacientes/<id>/editar`) dos dados cadastrais (`PUT`, corpo completo). Paciente arquivado não é editável (409). Implementada em 06/11/2026 com o mesmo `PatientForm` do cadastro, aberta pelo botão "Editar" do detalhe (escondido para arquivados). Apagar um opcional o remove do corpo e a API grava `null`; salvar sem mudanças só volta ao detalhe, sem requisição. Arquivado mostra aviso no lugar do formulário; o 409 `PATIENT_ARCHIVED` durante a edição recarrega o paciente e mostra o mesmo aviso.
- [x] **Arquivar/reativar** com `ConfirmDialog` explicando que o prontuário é mantido; filtro "arquivados" na listagem. Implementado em 09/11/2026: botões "Arquivar"/"Reativar" no detalhe (`patient-actions.tsx`), que continua aberto e passa a mostrar o estado novo; a confirmação diz que nada é apagado e cita o prazo legal. Em erro, a confirmação fica aberta para tentar de novo; o 409 de "já está no estado pedido" (`PATIENT_ALREADY_ARCHIVED`/`PATIENT_NOT_ARCHIVED`, ex.: alterado em outra aba) fecha a confirmação e recarrega o paciente.
- [x] **Consentimento de uso de imagem**: registrar (forma escrita/verbal, quem consentiu, responsável legal se menor), listar e revogar. Implementado em 09/11/2026 como a seção "Autorização de uso de imagem" do detalhe do paciente (`consent-section.tsx`). A regra de menor segue a da API: vale a idade **na data da coleta**, com o mesmo corte (`isMinorAt`). Se a data da coleta não for alterada, ela é omitida e vale o horário do servidor, para um relógio errado no computador não gravar uma data errada. Paciente arquivado não recebe autorização nova, mas a ativa pode ser revogada. A revogação é definitiva e as revogadas continuam listadas. O comprovante do termo fica para a Fase 4. Quando o paciente completa 18 anos, a autorização dada pelo responsável legal aparece como "Renovação necessária" (`consentNeedsRenewal`, `lib/consents.ts`), com as opções de renovar ou revogar. Como a API recusa uma nova enquanto há uma ativa, renovar revoga a anterior e registra a nova, em duas requisições: se a segunda falhar, o paciente fica sem autorização ativa, o lado seguro, e o formulário continua aberto para tentar de novo.
- [x] Camada de dados seguindo o padrão do projeto: `model/patient.ts`, `services/patient.service.ts`, `hooks/patients/*`, chaves em `lib/query-keys.ts`. Os consentimentos seguem a mesma divisão (`model/consent.ts`, `services/consent.service.ts`, `hooks/consents/*`).

### Fase 2 — Histórico do paciente (registros de texto)

- [x] Linha do tempo no detalhe do paciente, do mais recente para o mais antigo, com rolagem infinita (`useInfiniteQuery` sobre o cursor). Implementada em 09/11/2026 na seção "Histórico" (`records-section.tsx`): a página seguinte carrega ao chegar perto do fim da lista, e o botão "Carregar registros anteriores" continua disponível. O texto aparece puro, com as quebras de linha. Registro com anexos mostra só a quantidade até a Fase 3.
- [x] Novo registro: só o texto (até 20 mil caracteres). Sem tipo (decisão da API: reavaliar com o uso) e sem data/hora informada; o horário é o do servidor. Implementado em 09/11/2026 (`new-record-form.tsx`): texto acima do limite é recusado sem ser cortado, e o texto fica no campo quando o envio falha. Se o paciente for arquivado durante a escrita, o texto continua visível, somente leitura, até o paciente ser reativado ou o usuário sair da página.
- [x] Autoria automática: nome + COREN do enfermeiro e data/hora de criação fornecidos pela API, nunca editáveis no frontend.
- [ ] **Edição com versões**: envia a `version` que está sendo editada e motivo opcional; em 409 de versão desatualizada, recarregar o registro sem perder o texto digitado. Marcar "editado" e listar as versões anteriores.
- [x] **Anulação** com `ConfirmDialog`: motivo da lista + descrição obrigatória em "outro"; deixar claro que é definitiva. Aba ou filtro "anulados". Implementada em 09/11/2026 (`void-record-dialog.tsx`): botão "Anular" em cada registro ativo (escondido para paciente arquivado), diálogo com o começo do texto do registro para conferir, foco inicial em "Cancelar" e descrição opcional nos outros motivos. Depois de anular, o foco vai para o título da lista. O 409 de registro já anulado (`RECORD_ALREADY_VOIDED`, ex.: em outra aba), o 404 e o `PATIENT_ARCHIVED` fecham o diálogo e recarregam a lista. O filtro "Ativos/Anulados" fica acima da lista. Os anulados mostram o texto, a data da anulação, o motivo e a descrição. Salvar um registro novo volta para os ativos.
- [ ] Rascunho do registro só em memória (sem `localStorage`), com aviso ao sair da página com texto não salvo.
- [ ] Filtros por período: não suportado pela API hoje.

### Fase 3 — Anexos (imagens, vídeos e arquivos)

- [ ] Upload em registros do histórico: seleção múltipla e arrastar-e-soltar, barra de progresso, cancelar e tentar de novo. Fluxo decidido na API em 09/11/2026: cada arquivo vai para `POST /patients/:id/attachments` (multipart, campo `file`), que devolve o anexo ainda sem registro; o `POST` do registro recebe os `attachmentIds` e faz a ligação na mesma transação. O registro pode ter só arquivos, sem texto. Anexo enviado e não usado fica sem registro, e a limpeza é um job do operador.
- [ ] Validação no cliente antes do envio, alinhada com a API: JPEG, PNG, WebP, PDF, MP4, MOV e WebM (HEIC fica de fora por enquanto), até 200 MiB por arquivo (`ATTACHMENT_MAX_SIZE_BYTES`). A API detecta o tipo pelo conteúdo e ignora o declarado; tratar `ATTACHMENT_TYPE_NOT_ALLOWED`, `ATTACHMENT_CONTENT_INVALID` e `ATTACHMENT_TOO_LARGE` pelo `code`.
- [ ] Uploads longos: o arquivo atravessa o proxy do Next, com timeout padrão de 30 s (`experimental.proxyTimeout`), enquanto a API aceita até 30 min por requisição. Ajustar esse valor e os limites dos intermediários antes de liberar vídeos, e testar com um arquivo de 200 MiB. O `matcher` do `proxy.ts` não pode passar a incluir `/api`, porque o Next guarda em memória o corpo das requisições que passam por ele, até 10 MB (`proxyClientMaxBodySize`). Não há upload direto nem em partes.
- [ ] Compressão de imagens no cliente: opcional, só se o tamanho dos envios for um problema no uso real. A **remoção de metadados EXIF** (GPS) é feita pela API antes de gravar, sem reencodar a imagem, então o front não precisa fazê-la. Metadados de vídeos e PDFs ainda são gravados como vieram (pendente na API).
- [ ] Visualização: galeria de imagens, player de vídeo, pré-visualização de PDF e download para outros formatos, por `GET .../attachments/:attachmentId/download`, que devolve o anexo com `downloadUrl` e `downloadUrlExpiresAt`. A URL vale 5 min e cada pedido é auditado: buscá-la só quando o usuário abrir o anexo (sem pré-carregar a galeria), não guardá-la e pedir outra quando vencer.
- [ ] Exigir a autorização de uso de imagem antes de enviar fotos e vídeos: o registro existe desde a Fase 1, e a seção do paciente mostra se ela está ativa, ausente ou com renovação necessária. O bloqueio real é da API e **ainda não existe** (ver [Pendências na API](#pendências-na-api)): o front avisa e impede o envio, mas a API aceita.
- [ ] Anexos não são editados nem apagados: são anulados junto com o registro; para trocar um arquivo, anula-se o registro e anexa-se de novo.

### Fase 4 — Direitos do titular e auditoria

- [ ] Exportar os dados de um paciente (cadastro + histórico + anexos) para atender pedidos de acesso e portabilidade.
- [ ] Visualizar o histórico de auditoria do paciente: quem acessou ou alterou e quando.
- [ ] Comprovação do consentimento de imagem (anexo do termo ou assinatura; forma em definição na API) e bloqueio de novos anexos de imagem quando revogado.
- [ ] Tela de informações de privacidade com o contato do encarregado (DPO).

### Fase 5 — Qualidade e operação

- [ ] CI com lint, typecheck, testes e build a cada push.
- [ ] Monitoramento de erros com remoção de dados pessoais.
- [ ] Auditoria de acessibilidade (teclado, leitores de tela, contraste).
- [ ] Revisão de segurança (dependências, `npm audit`, CSP).

### Futuro (a avaliar)

- Equipes e instituições: vários profissionais acompanhando o mesmo paciente (acompanhamento multidisciplinar), com permissões.
- Registros estruturados: sinais vitais, medicações, curativos, escalas, com gráficos de evolução.
- Agenda de visitas e atendimentos.
- Autenticação em dois fatores.
- Assinatura digital ICP-Brasil nos registros.
- Uso offline: só com criptografia local e política clara, porque guardar dados de saúde no dispositivo aumenta o risco.

---

## Acordos com a API

Definidos em 04/11/2026. Cada item diz o que a API faz **hoje** e o que foi acordado; o que ainda falta implementar na API está em [Pendências na API](#pendências-na-api).

### Cookie de sessão e `proxy.ts`

**Antes:** o login gravava o cookie `token` (JWT) com `HttpOnly`, `SameSite=Strict`, `Secure` em produção e sem `Domain`, então ele pertencia só ao host da API, e o front chamava a API direto pelo `NEXT_PUBLIC_API_URL`, com CORS e credenciais.

**Problema:** não há garantia de que front e API fiquem no mesmo domínio registrável. Em domínios diferentes, a chamada é *cross-site*: o `SameSite=Strict` impede o envio do cookie, e a alternativa (`SameSite=None`) depende de cookies de terceiros, que o Safari já bloqueia e outros navegadores restringem.

**Implementado em 04/11/2026:** o navegador conversa só com a origem do front. O `next.config.ts` faz *rewrite* de `/api/v1/*` para a API, cujo endereço fica numa variável só do servidor (`API_URL`).

- O cookie passa a ser do domínio do front, como cookie primário, e funciona em qualquer domínio da API. O `SameSite=Strict` continua, o que também protege contra CSRF.
- O `proxy.ts` passa a ser possível: ele só verifica **se o cookie existe** para redirecionar ao login antes de renderizar. A validação continua sendo da API, e o guard no cliente (`app/(authenticated)/layout.tsx`) é mantido para o 401 de sessão expirada.
- O CORS da API deixa de ser usado pelo navegador; os headers da resposta (`x-request-id`, `RateLimit`, `X-Session-Expires-At`) ficam legíveis sem `exposedHeaders`.
- Os uploads da Fase 3 **passam** pelo proxy (decisão da API em 09/11/2026: todo arquivo passa por ela). O download não: vai direto ao storage, por URL assinada de curta duração gerada e auditada pela API.

**Requisitos de deploy (verificar antes do primeiro paciente real):**

- **IP real do cliente.** A auditoria (LGPD, art. 37) e o rate limit usam o IP. O proxy do Next 16.2 só adiciona `x-forwarded-host`, não `X-Forwarded-For`. Por isso, o Next deve ficar atrás de um proxy reverso ou plataforma que defina o `X-Forwarded-For`, e a `TRUST_PROXY` da API deve ser ajustada a esses intermediários (padrão `1`). Antes do primeiro paciente real, conferir com uma requisição real que o IP gravado na auditoria é o do navegador. Sem isso, todas as requisições aparecem com o IP do servidor do Next.
- O servidor do Next não registra corpo nem query string das requisições repassadas (dados de pacientes e termos de busca).
- O proxy tem timeout padrão de 30 s (`experimental.proxyTimeout`). Isso precisa ser revisto para o upload de anexos (Fase 3), já que a API aceita até 30 min por requisição, e para a exportação (Fase 4), se ela for síncrona e lenta.

### Expiração da sessão

**Antes:** o JWT valia 1 h fixa, sem renovação, e a sessão caía no meio do uso. Implementado na API em 04/11/2026.

**Acordado:** sessão **deslizante**, que expira após **30 min sem atividade** ou **12 h após o login** (um plantão), o que vier primeiro.

- **API:** cada requisição autenticada renova o cookie com um JWT de validade curta, até o limite de 12 h contado a partir do horário do login guardado no token. Toda resposta autenticada traz o header `X-Session-Expires-At` (ISO 8601), e o `GET /auth/me` traz também `sessionExpiresAt`.
- **Front (implementado em 04/11/2026):** guarda a expiração só em memória, corrigida pelo header `Date` da mesma resposta (o relógio do computador pode estar errado), e sincroniza as abas por `BroadcastChannel`: a atividade numa aba vale para todas, e o "Sair" numa aba encerra as outras e limpa o cache delas. O logout espera qualquer renovação em andamento, para que ela não recrie o cookie depois do signout. A interação do usuário (teclado, clique) conta como atividade e renova a sessão em silêncio, com no máximo um `GET /auth/me` a cada 5 min, para que digitar um registro longo não derrube a sessão. Sem interação, 2 min antes de expirar aparece um aviso com "Continuar conectado" e "Sair". Perto do limite de 12 h, o aviso não oferece renovação e orienta a salvar o rascunho. Não há *polling* em segundo plano que mantenha a sessão viva sem o usuário.

### Formato de erros

Implementado na API em 04/11/2026:

| Status | Corpo |
|---|---|
| 4xx (`HttpException`) | `{ code, message, timestamp }` |
| 422 (validação) | `{ code: "VALIDATION_FAILED", message, errors: { location, path, message }[], timestamp }` |
| 409 (chave única) | `{ code: "CONFLICT", message, timestamp }` |
| 429 (rate limit) | `{ code: "TOO_MANY_REQUESTS", message }` + headers `RateLimit`/`RateLimit-Policy` (draft-8) |
| 500 | `{ code: "INTERNAL_SERVER_ERROR", message }` |

- **`code`** é um identificador estável (a chave da mensagem na API, ex.: `PATIENT_ARCHIVED`, `RECORD_VERSION_OUTDATED`, `INVALID_LINK_TOKEN`). O front decide o que fazer **pelo `code`**, nunca comparando a `message`. A lista completa está no schema `Error` do OpenAPI.
- **`message`** vem em português e é o texto exibido ao usuário; pode mudar sem aviso.
- Toda resposta traz `x-request-id`.

**Acordado para o front:** o `ApiError` passa a carregar `code` e `requestId` (header `x-request-id`). O `requestId` aparece nas telas de erro para o suporte. Exemplos de uso do `code`:
- `isInvalidTokenError` passa a checar `INVALID_LINK_TOKEN`, e não só o status 422.
- Na edição de registro, `RECORD_VERSION_OUTDATED` recarrega o registro sem perder o texto digitado, e `PATIENT_ARCHIVED` bloqueia a ação.

**Erros por campo (422):** cada item do `errors` tem `location` (`body`, `query` ou `params`), `path` (o campo, separado por pontos, como `representativeName` ou `items.0.name`; vazio quando o erro é do objeto inteiro) e `message`. Os formulários continuam validando com Zod as mesmas regras da API. Quando a API ainda assim recusar, os itens com `location: "body"` vão para o campo correspondente com o `setError` do react-hook-form, e o que não corresponder a nenhum campo aparece no toast. Os 422 de regra de negócio (link inválido, conteúdo igual ao atual etc.) vêm com `errors: []` e são tratados pelo `code`.

### Paginação

Os dois formatos ficam como estão:

- **Pacientes, por página:** `GET /patients?search=&status=active|archived&page=1&limit=20` (`limit` de 1 a 100) → `{ items, page, limit, total, totalPages }`, ordenado por nome. A busca procura no nome (sem diferenciar acentos) ou, se só tiver dígitos, também no CPF/CNS exato. O termo vai na query da requisição à API, **nunca** na URL do navegador. A API não registra a query string nos logs, e o proxy reverso de produção também não pode registrar.
- **Registros, por cursor:** `GET /patients/:id/records?status=active|voided&cursor=&limit=20` → `{ items, nextCursor }` (`nextCursor` é `null` na última página). O cursor evita repetir ou pular itens quando chegam registros novos durante a rolagem. No front, isso vira `useInfiniteQuery`.
- **Versões e consentimentos** vêm como lista completa, sem paginação.

### Rate limit

**Antes:** `/users`, `/auth` e `/patients` dividiam um limite geral de 100 requisições por hora por IP. Isso era incompatível com o uso: abrir a lista, alguns pacientes e a linha do tempo consome dezenas de requisições, e numa instituição todos os profissionais saem pelo mesmo IP (NAT).

**Implementado na API em 04/11/2026:** as rotas autenticadas (`/patients/**`, `/auth/me`, `/auth/signout`) têm limite de **300 requisições por minuto por usuário** e não consomem o limite por IP. Os limites por IP ficam só nas rotas públicas: geral de 100/h, login e redefinição de senha com 10/15 min, e-mails com 5/15 min. No front, o 429 não é repetido automaticamente (o `retry` já ignora 4xx) e exibe a mensagem da API.

### Pendências na API

Mudanças acordadas que dependem do `care-track-api`:

- [x] Sessão deslizante (30 min / 12 h), `X-Session-Expires-At` em toda resposta autenticada e `sessionExpiresAt` no `/auth/me` e no signin. O header também é exposto no CORS, para funcionar enquanto o front chama a API de outra origem.
- [x] Rate limit por usuário nas rotas autenticadas (300/min).
- [x] `code` estável em todas as respostas de erro (4xx, 429 e 500).
- [x] `errors` do 422 como `{ location, path, message }`.
- [x] `trust proxy` configurável pela variável `TRUST_PROXY` da API (número de intermediários, padrão `1`, ou lista de IPs/sub-redes confiáveis). O valor de produção e a verificação do IP na auditoria ficam para o deploy (ver requisitos de deploy acima).
- [x] `Cache-Control: no-store` em todas as respostas da API e ETag desligado, para o navegador não gravar dados de pacientes no cache em disco.
- [x] Corpo da requisição ilegível responde 4xx em vez de 500: JSON malformado vira 400 com `code: "INVALID_REQUEST_BODY"`, e corpo acima do limite (100 KB) vira 413 com `REQUEST_BODY_TOO_LARGE`.
- [ ] Código próprio para CPF ou Cartão SUS já cadastrado (ex.: `PATIENT_CPF_ALREADY_EXISTS`, `PATIENT_CNS_ALREADY_EXISTS`), no lugar do `CONFLICT` genérico da chave única, para o formulário apontar o campo. Até lá, o front mostra a mensagem genérica no toast.
- [ ] Recusar `collectedAt` anterior ao nascimento do paciente no registro do consentimento. Hoje a API aceita, e o front também (usa as mesmas validações).
- [ ] **Exigir autorização ativa no upload de fotos e vídeos** (`POST /attachments` hoje não consulta o consentimento, e o `hasActiveConsent` não é usado por nenhuma rota). A autorização vencida pela maioridade continua `active` na API e também precisa ser recusada. Fazer antes do primeiro paciente real. Avaliar também a renovação em uma só operação, no lugar de revogar e registrar separadamente. Registrado no `docs/roadmap.md` da API em 09/11/2026, junto dos outros itens desta lista.
- [ ] Rotas ainda inexistentes que o front vai precisar: edição do perfil, relatório de acessos e exportação (Fase 4).

---

## Contratos da API

Rotas reais da API (prefixo `/api/v1`), conferidas em 04/11/2026. A referência completa, com corpos e respostas, é o OpenAPI da API em `/api/v1/docs` (ligado fora de produção). Todas as rotas de `/patients` exigem sessão e são auditadas.

### Autenticação e conta

| Método | Rota | Uso |
|---|---|---|
| `POST` | `/auth/signin` | Login (grava o cookie) |
| `POST` | `/auth/signout` | Logout (204, apaga o cookie) |
| `GET` | `/auth/me` | Usuário logado: `{ name, email, coren, corenState }` |
| `POST` | `/users/signup` | Cadastro (nome, e-mail, senha, COREN, UF e `acceptedTermsVersion`, a versão dos termos aceita) |
| `GET` | `/users/validate?token=` | Confirmar e-mail (link do e-mail abre `/verify-email` no front) |
| `POST` | `/users/resend` | Reenviar e-mail de confirmação (sempre 200) |
| `POST` | `/auth/forgot-password` | Pedir link de redefinição de senha (sempre 200) |
| `POST` | `/auth/reset-password` | Redefinir senha com o token (derruba as sessões abertas) |

### Pacientes

Resposta de paciente: `{ id, name, birthDate, cpf, cns, phone, archivedAt, createdAt, updatedAt }` (opcionais vêm `null`).

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/patients?search=&status=&page=&limit=` | Listar/buscar → `{ items, page, limit, total, totalPages }` |
| `POST` | `/patients` | Cadastrar `{ name, birthDate, cpf?, cns?, phone? }` → 201 |
| `GET` | `/patients/:id` | Detalhe |
| `PUT` | `/patients/:id` | Editar (corpo completo, como no cadastro). 409 se arquivado |
| `POST` | `/patients/:id/archive` · `/unarchive` | Arquivar/reativar. 409 se já estiver no estado pedido |

### Consentimentos

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/patients/:id/consents` | Listar |
| `POST` | `/patients/:id/consents` | Registrar `{ type: "image_capture", method: "written"\|"verbal", grantor: "patient"\|"legal_representative", representativeName?, collectedAt? }`. Paciente menor exige responsável legal; 409 se já houver um ativo do mesmo tipo |
| `POST` | `/patients/:id/consents/:consentId/revoke` | Revogar `{ reason? }` |

### Registros do histórico

Resposta de registro: `{ id, patientId, content, version, author: { id, name, coren, corenState }, createdAt, editedAt, voidedAt, voidReason, voidReasonDetails, attachments }` (`content` pode ser nulo em registro só com arquivos; `attachments` são os anexos do registro).

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/patients/:id/records?status=&cursor=&limit=` | Linha do tempo → `{ items, nextCursor }` |
| `POST` | `/patients/:id/records` | Criar `{ content?, attachmentIds? }` (ao menos um dos dois; até 20 anexos). 409 se paciente arquivado |
| `PUT` | `/patients/:id/records/:recordId` | Editar `{ content, version, reason? }`. 409 se a versão estiver desatualizada; 422 se o conteúdo não mudou |
| `GET` | `/patients/:id/records/:recordId/versions` | Versões, da mais nova para a mais antiga |
| `POST` | `/patients/:id/records/:recordId/void` | Anular `{ reason: "wrong_patient"\|"duplicate"\|"other", details? }` (definitivo) |

### Anexos

Resposta de anexo: `{ id, patientId, recordId, fileName, contentType, size, sha256, createdAt }`.

| Método | Rota | Uso |
|---|---|---|
| `POST` | `/patients/:id/attachments` | Enviar um arquivo (multipart, campo `file`). O anexo nasce sem registro (`recordId` nulo) |
| `GET` | `/patients/:id/attachments/:attachmentId/download` | Obter o anexo com `downloadUrl` e `downloadUrlExpiresAt`; a URL vale 5 min |

### Ainda não existem

| Uso | Fase |
|---|---|
| Editar o perfil (nome, COREN/UF) | 0 |
| Relatório de acessos do paciente (a partir da auditoria) | 4 |
| Exportação dos dados do paciente | 4 |

---

## Decisões em aberto

Já respondidas pela API (detalhes no `docs/roadmap.md` dela):

- **Dono do paciente:** a enfermeira que o cadastrou. Ela é a controladora dos dados dos pacientes, e o CareTrack é o operador.
- **Compartilhamento entre profissionais:** fica para depois.
- **Anexos:** armazenamento compatível com S3, bucket privado. Na fase de testes, Oracle Cloud em São Paulo; o provedor será revisto antes do primeiro paciente real. Todo arquivo passa pela API, e o download é por URL assinada de curta duração.
- **Menores de idade:** sim. O consentimento de imagem de menor exige o responsável legal.
- **Exclusão definitiva:** não existe no app. Só como procedimento administrativo do operador (ordem judicial ou da ANPD), registrado na auditoria.
- **Autorização de imagem e maioridade** (decidido em 09/11/2026, pelo responsável do produto): a autorização dada pelo responsável legal enquanto o paciente era menor deixa de valer quando ele completa 18 anos e precisa ser renovada. A autorização dada por responsável legal de quem já era adulto na coleta não é afetada. O front já reflete a regra; falta a API (ver [Pendências na API](#pendências-na-api)). Incluir na revisão jurídica.
- **Menor emancipado** (decidido em 09/11/2026, pelo responsável do produto): continua sendo registrado com o responsável legal, como qualquer menor de 18 anos. A API e o front já funcionam assim.

Ainda em aberto:

- Domínios de produção do front e da API, e a topologia de deploy (define o `trust proxy` e a origem do `X-Forwarded-For`).
- Formato do conteúdo do registro quando houver anexos (proposta da API: Markdown com `attachment:<id>`).
