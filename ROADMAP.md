# Roadmap — CareTrack

Planejamento das próximas etapas do frontend. O objetivo do produto: **o enfermeiro cadastra, busca, edita e arquiva seus pacientes e alimenta o histórico de cada um com textos, imagens, vídeos e outros arquivos.** Todas as operações passam pela API Node/Express.

> Os endpoints listados aqui são **propostas** para orientar o frontend. Quando os contratos reais da API estiverem definidos, eles substituem a seção [Contratos da API](#contratos-da-api) e as fases são ajustadas.

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
| Direitos do titular (art. 18) | Acesso, correção, portabilidade, informação sobre compartilhamento. | Funcionalidade de exportar os dados de um paciente; correção via retificação (ver COFEN). |
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

1. **Registros do histórico são imutáveis.** Depois de salvos, não são editados nem excluídos; erros são corrigidos com um novo registro de **retificação** vinculado ao original.
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
- **Cabeçalhos de segurança** no `next.config.ts`: `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy: no-referrer`, `Permissions-Policy`.
- **Dados mascarados por padrão** em listas (ex.: CPF `***.456.789-**`).
- A autorização real (cada enfermeiro só acessa seus pacientes) é **sempre** da API; o frontend apenas reflete.

---

## Fases

### Fase 0 — Fundação

Base para as funcionalidades de pacientes. Parte pode correr em paralelo com a definição dos contratos da API.

- [ ] Definir com o backend: domínio do cookie de sessão (habilita ou não o `proxy.ts`), formato de erros, paginação e expiração da sessão.
- [ ] Shell da área logada: navegação (menu lateral ou superior) com "Pacientes" e "Meu perfil".
- [ ] Kit de UI: `Modal`, `ConfirmDialog`, `Textarea`, `Select`, `DateInput`, campos com máscara (CPF, telefone), `Table`/lista, `Pagination`, `EmptyState`, `Skeleton`, `Badge`.
- [ ] Logout automático por inatividade.
- [ ] Cabeçalhos de segurança no `next.config.ts`.
- [ ] Testes: Vitest + Testing Library para componentes e hooks; Playwright para fluxos principais.
- [x] Recuperação de senha (`/forgot-password` e `/reset-password`, com o token do link do e-mail) e confirmação de e-mail (`/verify-email`, com reenvio do link).
- [x] Incluir **COREN + UF** no cadastro.
- [ ] Perfil do enfermeiro: nome, e-mail, **COREN + UF**.
- [ ] Páginas de Política de Privacidade e Termos de Uso, com aceite no cadastro.

### Fase 1 — Pacientes

- [ ] Modelo `Patient` mínimo: nome, nome social, data de nascimento, sexo, contato, responsável legal (se menor), identificador opcional (CPF ou CNS) e observações clínicas relevantes (alergias, condições). Validar cada campo contra o princípio da minimização.
- [ ] **Listagem** (`/pacientes`): busca no servidor com debounce, paginação, estado vazio, carregamento e erro; dados sensíveis mascarados.
- [ ] **Cadastro** (`/pacientes/novo`): formulário com Zod, máscaras e validações (CPF, datas).
- [ ] **Detalhe** (`/pacientes/<id>`): dados cadastrais + histórico (Fase 2).
- [ ] **Edição** (`/pacientes/<id>/editar`) dos dados cadastrais. Alterações cadastrais também ficam no histórico de auditoria.
- [ ] **Arquivar/reativar** com `ConfirmDialog` explicando que o prontuário é mantido; filtro "arquivados" na listagem.
- [ ] Camada de dados seguindo o padrão do projeto: `model/patient.ts`, `services/patient.service.ts`, `hooks/patients/*`, chaves em `lib/query-keys.ts`.

### Fase 2 — Histórico do paciente (registros de texto)

- [ ] Linha do tempo no detalhe do paciente, do mais recente para o mais antigo, com paginação ou rolagem infinita.
- [ ] Novo registro: tipo (evolução, anotação, procedimento...), data/hora do atendimento e texto.
- [ ] Autoria automática: nome + COREN do enfermeiro e data/hora de criação fornecidos pela API, nunca editáveis no frontend.
- [ ] **Registros imutáveis**: sem editar/excluir; ação "Retificar" cria um registro novo vinculado e marca o original como retificado (ambos visíveis).
- [ ] Rascunho do registro só em memória (sem `localStorage`), com aviso ao sair da página com texto não salvo.
- [ ] Filtros por tipo e período.

### Fase 3 — Anexos (imagens, vídeos e arquivos)

- [ ] Upload em registros do histórico: seleção múltipla e arrastar-e-soltar, barra de progresso, cancelar e tentar de novo.
- [ ] Lista de tipos permitidos e limite de tamanho alinhados com a API; validação no cliente antes do envio.
- [ ] Upload de vídeos grandes: avaliar upload direto para o storage via URL assinada e upload em partes.
- [ ] Compressão de imagens no cliente e **remoção de metadados EXIF** (GPS) antes do envio, com validação também na API.
- [ ] Visualização: galeria de imagens, player de vídeo, pré-visualização de PDF e download para outros formatos.
- [ ] Registro de autorização de uso de imagem do paciente antes de permitir fotos e vídeos.
- [ ] Anexos seguem a regra de imutabilidade: não são apagados, apenas marcados como retificados ou invalidados com justificativa.

### Fase 4 — Direitos do titular e auditoria

- [ ] Exportar os dados de um paciente (cadastro + histórico + anexos) para atender pedidos de acesso e portabilidade.
- [ ] Visualizar o histórico de auditoria do paciente: quem acessou ou alterou e quando.
- [ ] Registrar o termo de consentimento/autorização de imagem e permitir revogação (bloqueia novos anexos de imagem).
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

## Contratos da API

> **Proposta** para orientar o frontend. Substituir pelos contratos reais quando estiverem prontos.

### Já existentes

| Método | Rota | Uso |
|---|---|---|
| `POST` | `/auth/signin` | Login |
| `POST` | `/auth/signout` | Logout |
| `GET` | `/auth/me` | Usuário logado |
| `POST` | `/users/signup` | Cadastro (nome, e-mail, senha, COREN e UF) |
| `GET` | `/users/validate?token=` | Confirmar e-mail (link do e-mail abre `/verify-email` no front) |
| `POST` | `/users/resend` | Reenviar e-mail de confirmação (sempre 200) |
| `POST` | `/auth/forgot-password` | Pedir link de redefinição de senha (sempre 200) |
| `POST` | `/auth/reset-password` | Redefinir senha com o token (link do e-mail abre `/reset-password` no front) |

### Propostos

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/patients?search=&page=&status=` | Listar/buscar (busca idealmente via `POST /patients/search` para não expor termos em logs de URL) |
| `POST` | `/patients` | Cadastrar |
| `GET` | `/patients/:id` | Detalhe |
| `PATCH` | `/patients/:id` | Editar dados cadastrais |
| `POST` | `/patients/:id/archive` · `/unarchive` | Arquivar/reativar |
| `GET` | `/patients/:id/records?page=&type=` | Histórico |
| `POST` | `/patients/:id/records` | Novo registro |
| `POST` | `/patients/:id/records/:recordId/rectify` | Retificar registro |
| `POST` | `/patients/:id/records/:recordId/attachments` | Iniciar upload (retorna URL assinada) |
| `GET` | `/attachments/:id` | URL temporária para visualizar/baixar |
| `GET` | `/patients/:id/audit` | Auditoria |
| `GET` | `/patients/:id/export` | Exportação (direitos do titular) |

---

## Decisões em aberto

- O app atende **enfermeiros autônomos**, **instituições** ou ambos? Isso define se o paciente pertence ao profissional ou à organização (e quem é o controlador dos dados na LGPD).
- Pacientes podem ser **compartilhados** entre profissionais?
- Onde ficam os anexos (S3, GCS, outro) e qual o limite de tamanho por arquivo?
- Os pacientes incluem **menores de idade**?
- Haverá **exclusão definitiva** após o prazo legal? Qual processo?
