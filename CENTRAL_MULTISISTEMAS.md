# CENTRAL MULTISISTEMAS MULTIPLUS+ + TOYGO!

Documento compartilhado entre os repositórios MultiPlus+ e ToyGo! para alinhar a futura Central administrativa multisistemas.

> Uma Central comum pode administrar os dois produtos. Isso não significa transformar os produtos em um único domínio. A plataforma, a identidade e a governança podem ser compartilhadas; a operação local e as regras de negócio permanecem específicas.

## 1. Decisão arquitetural

A direção oficial é:

```text
Uma Central administrativa
├── Plataforma comum
│   ├── identidade, sessão e RBAC
│   ├── organizações, empresas e unidades
│   ├── licenças, planos e módulos
│   ├── cobranças e provedores
│   ├── instalações e dispositivos
│   ├── releases e atualizações
│   ├── auditoria, telemetria e suporte
│   └── backups e notificações
├── Adaptador MultiPlus+
│   ├── PDV, estoque e fiscal
│   ├── caixa e financeiro
│   └── filiais e multilojas
└── Adaptador ToyGo!
    ├── parques e unidades
    ├── crianças e responsáveis
    ├── entrada, saída e lotação
    ├── waivers e LGPD
    ├── reservas, festas e memberships
    └── RFID, NFC e catracas
```

O ToyGo! deve ganhar a mesma dinâmica administrativa do MultiPlus+: dashboard, contexto, filtros, estados de carregamento, auditoria, licenciamento, instalações, releases, Watchdog e suporte. Porém, seus módulos devem continuar falando a linguagem do parque, não a linguagem do varejo.

## 2. O que o ToyGo! mantém

O ToyGo! continua sendo um sistema híbrido e offline-first para parquinhos indoor. Seu núcleo permanece protegido pelas fronteiras documentadas em [`docs/architecture/MODULE_BOUNDARIES.md`](docs/architecture/MODULE_BOUNDARIES.md).

### Domínio próprio

- Criança, visitante e responsável.
- Termo de responsabilidade e waiver.
- Consentimento LGPD.
- Sessão de entrada e saída.
- Lotação geral e por zona.
- Reservas, festas e grupos.
- Memberships e benefícios.
- Consumo e produtos do parque.
- RFID, NFC, QR Code e catracas.

### Regras que não devem ser importadas do MultiPlus+

- O ToyGo! não deve usar PDV, fiscal ou estoque de varejo como modelo de entrada.
- A Central não deve receber o banco MySQL local completo.
- A experiência do visitante não deve depender da disponibilidade da nuvem.
- Dados de menores não devem aparecer em dashboards sem necessidade operacional e autorização.
- O core não deve conhecer APIs externas, backup, licenciamento ou hardware; essas capacidades continuam entrando por portas e adapters.

O ledger de estoque e o ledger financeiro do ToyGo! continuam append-only. `StockBalance` é read-model derivado, e `FinanceLedgerEntry` é o reflexo financeiro rastreável, conforme [`docs/architecture/ETAPA_1.md`](docs/architecture/ETAPA_1.md).

## 3. O que o ToyGo! compartilha

A Central comum deve oferecer ao ToyGo! os mesmos serviços administrativos que já estão mais maduros no MultiPlus+:

- Login, access token, refresh e revogação de sessão.
- Organização, cliente PF/PJ e unidades.
- Usuários, perfis, permissões e escopos.
- Licença por produto, unidade ou instalação.
- Planos, trial, entitlements e módulos.
- Cobrança recorrente e provedores.
- Registro de Desktop, terminal e dispositivos.
- Releases por produto, canal e versão mínima.
- Watchdog, heartbeat e eventos técnicos.
- Auditoria de mutações e acessos sensíveis.
- Backup, manifest, hash e restauração assistida.
- Notificações e suporte.

A licença do ToyGo! deve ser distinta da licença do MultiPlus+, ainda que ambas pertençam à mesma organização:

```text
Organização ABC
├── ToyGo! Professional
│   ├── units
│   ├── waivers
│   ├── reservations
│   └── memberships
└── MultiPlus+ Premium
    ├── pdv
    ├── estoque
    └── fiscal
```

## 4. Modelo de organização

```text
Conta administrativa
└── Organização
    ├── ToyGo!
    │   ├── unidade Parque Centro
    │   ├── unidade Parque Norte
    │   └── instalações e dispositivos
    └── MultiPlus+
        ├── empresa e filiais
        └── instalações e Servidores PDV
```

Para evitar confusão, a Central deve distinguir:

| Conceito | ToyGo! | MultiPlus+ |
|---|---|---|
| Local físico | Unidade do parque | Filial/loja |
| Operação principal | Visita, acesso e experiência | Venda, caixa e estoque |
| Pessoa atendida | Criança/visitante e responsável | Cliente/consumidor |
| Controle de acesso | Catraca, zona e waiver | Usuário, operador e licença |
| Capacidade | Lotação por parque/zona | Capacidade técnica da instalação |
| Dados locais | MySQL e cache offline | MariaDB/SQLite e cache local |

## 5. Contratos da Central Multisistemas

### `ProductRegistry`

Deve registrar:

- `product_code`: `toygo` ou `multiplus`.
- Nome e descrição.
- Versão do contrato.
- Módulos disponíveis.
- Papéis de instalação.
- Capacidades de telemetria.
- Canais de release.
- Adaptadores de sincronização.
- Política de suporte e retenção.

### `ModuleRegistry`

Cada módulo declara:

- Código e produto.
- Plano mínimo.
- Dependências.
- Versão mínima.
- Permissões.
- Slot de menu.
- Estado: ativo, beta, reservado, desativado ou deprecated.
- Estratégia de cobrança.

Módulos ToyGo! previstos:

```text
units
visitors
responsibles
waivers
capacity
zones
bookings
parties
memberships
consumption
access_control
rfid
analytics
```

Os módulos `visitors`, `responsibles` e `waivers` exigem política de dados pessoais e de menores mais restritiva que módulos administrativos comuns.

### Envelope de evento

O envelope é comum; o evento é específico:

```json
{
  "event_id": "uuid",
  "product_code": "toygo",
  "event_type": "toygo.capacity.warning",
  "organization_id": "uuid",
  "unit_id": "uuid",
  "installation_id": "uuid",
  "occurred_at": "2026-09-02T12:00:00Z",
  "source_version": "0.1.0",
  "severity": "warning",
  "payload": {},
  "idempotency_key": "...",
  "signature": "..."
}
```

O MultiPlus+ poderá emitir `multiplus.pdv.offline` ou `multiplus.fiscal.contingency`; o ToyGo! poderá emitir `toygo.capacity.warning`, `toygo.waiver.pending` ou `toygo.access.device.offline`. O roteamento é comum, mas a interpretação fica no adaptador do produto.

### Comandos remotos

Comandos administrativos devem ser versionados, idempotentes, limitados por produto e instalação, expiráveis por lease, auditáveis e confirmados por ACK.

Exemplos ToyGo! possíveis:

- Atualizar política de dispositivo.
- Solicitar sincronização de unidade.
- Publicar configuração de capacidade.
- Atualizar versão do Desktop.
- Alterar uma política temporária de manutenção.

A Central não deve abrir um shell remoto. O Desktop ToyGo! consulta comandos por saída HTTPS, aplica localmente e devolve `APPLIED` ou `FAILED`.

## 6. Interface comum

A Central deve possuir um shell administrativo semelhante ao já existente no MultiPlus+, mas com navegação dinâmica:

```text
Visão geral
Clientes e organizações
Licenças
Cobranças
Instalações
Auditoria
Watchdog
Releases
Backups
Suporte

Produto: ToyGo!
  Unidades
  Visitantes
  Waivers
  Lotação
  Reservas
  Festas
  Memberships
  Dispositivos

Produto: MultiPlus+
  PDVs
  Estoque
  Fiscal
  Financeiro
  Fornecedores
```

O seletor deve ser explícito:

```text
[Todos os produtos] [ToyGo!] [MultiPlus+]
```

- **Todos os produtos:** saúde administrativa, licenças, cobranças e alertas agregados.
- **ToyGo!:** unidades, lotação, reservas, visitantes, dispositivos e módulos licenciados.
- **MultiPlus+:** lojas, PDVs, estoque, fiscal e módulos de varejo.

O produto selecionado deve aparecer no contexto visual, participar dos filtros e ser gravado na trilha de auditoria da navegação quando necessário.

## 7. Operação diária do ToyGo!

### Abertura

1. Entrar com usuário autorizado.
2. Selecionar a organização e o produto ToyGo!.
3. Conferir unidades sem heartbeat.
4. Conferir lotação e zonas com alerta, se o perfil permitir.
5. Conferir dispositivos de acesso, RFID, NFC e catracas.
6. Conferir reservas, festas e memberships pendentes.
7. Conferir licenças, cobranças e releases.
8. Priorizar eventos críticos do Watchdog.

### Atendimento de uma unidade

1. Selecionar a unidade correta.
2. Confirmar instalação e dispositivo afetado.
3. Consultar o último heartbeat e a versão local.
4. Verificar se o evento é de rede, banco, dispositivo, lotação ou consentimento.
5. Preservar a privacidade do visitante.
6. Encaminhar a execução ao Desktop ou responsável local.
7. Registrar a ação, o operador e o resultado.

### Cadastro e primeiro vínculo

O onboarding comum deve registrar:

- Organização ou cliente.
- Produto `toygo`.
- Unidade do parque.
- Papel da instalação.
- Hardware ID.
- Nome da máquina.
- Plano e módulos iniciais.

O fluxo não deve pedir ao ToyGo! campos fiscais do MultiPlus+ sem necessidade. Quando houver empresa PJ, o dado legal é comum; o restante continua no domínio do produto.

### Fechamento

1. Revisar alertas críticos.
2. Conferir falhas de sincronização e ACKs.
3. Registrar pendências por unidade e instalação.
4. Conferir releases publicadas.
5. Confirmar que ações sobre waivers ou dados pessoais têm auditoria.
6. Não apagar eventos para limpar o painel.

## 8. Dados, LGPD e menores

A Central compartilhada precisa de um tratamento especial para o ToyGo!:

- Minimizar dados de crianças e responsáveis.
- Separar dados cadastrais, consentimento e telemetria.
- Definir finalidade e retenção por tipo de dado.
- Restringir acesso por organização, unidade, papel e finalidade.
- Evitar nomes de crianças em logs técnicos.
- Não transportar waiver completo quando somente o status for necessário.
- Registrar acesso a documentos e consentimentos sensíveis.
- Permitir revogação e correção conforme a política aplicável.
- Criptografar dados sensíveis em trânsito e repouso.
- Não colocar segredos ou dados pessoais no bundle do navegador.

A Central pode informar `waiver_required`, `waiver_valid` ou `waiver_expired` sem disponibilizar o documento inteiro para qualquer operador.

## 9. Arquitetura técnica atual e alinhamento

### ToyGo! hoje

- Central Web em Next.js 14, React 18 e TypeScript.
- Desktop em Electron, Vite, React e Tailwind CSS v3.
- MySQL 8+ local.
- `packages/domain` para invariantes puras.
- `packages/application` para orquestração.
- `packages/integration-ports` para fiscal, hardware, booking, LGPD, membership, analytics e payments.
- `packages/backup` fora do core.
- `packages/licensing` para ativação e bloqueio híbrido.
- `packages/ui-skins` para tokens visuais.

### MultiPlus+ hoje

- Central Web em React 19, TypeScript, Vite, Tailwind e Lucide.
- Central API em FastAPI, SQLAlchemy 2, Alembic e PostgreSQL.
- Clientes locais com operação local-first.
- `ModuleRegistry`, RBAC, licenças, instalações, releases, providers e Watchdog em evolução mais avançada.

### Estratégia de alinhamento

1. Compartilhar contratos de plataforma antes de compartilhar componentes.
2. Criar `ProductRegistry` e `ModuleRegistry` multisistemas.
3. Padronizar estados de UI: carregando, vazio, erro, sucesso e sem permissão.
4. Padronizar auditoria, telemetria, IDs e idempotência.
5. Migrar a Central ToyGo! por fatias, sem reescrever o Desktop.
6. Avaliar a convergência para React 19 depois que os contratos estiverem estáveis.
7. Manter bancos locais e domínios separados.

Não é necessário converter Next.js para Vite na primeira etapa. A prioridade é o contrato e o contexto de produto; a convergência visual e de runtime pode acontecer depois.

## 10. Fases de execução

### Fase 0 — alinhamento

- Manter este documento nas duas raízes.
- Mapear entidades e endpoints atuais.
- Definir `product_code`.
- Definir ownership e fronteiras.
- Identificar duplicações de autenticação, billing e instalação.

### Fase 1 — plataforma central

- Criar produtos `toygo` e `multiplus`.
- Associar módulos, licenças, releases e instalações ao produto.
- Criar seed idempotente.
- Testar isolamento de dados.

### Fase 2 — identidade e permissões

- Unificar sessão e autenticação administrativa.
- Criar organização e unidades.
- Implementar RBAC por produto.
- Implementar seletor de contexto.
- Auditar troca de produto e unidade.

### Fase 3 — shell comum

- Dashboard geral.
- Navegação dinâmica.
- Listas e filtros comuns.
- Feedback de erro e permissões.
- Migração inicial de telas administrativas de baixo risco.

### Fase 4 — serviços comuns

- Licenciamento.
- Cobrança.
- Provedores.
- Instalações.
- Releases.
- Auditoria.
- Watchdog.
- Backups.
- Suporte.

### Fase 5 — módulos ToyGo!

- Unidades e zonas.
- Visitantes e responsáveis.
- Waivers e LGPD.
- Lotação.
- Reservas e festas.
- Memberships.
- Dispositivos e controle de acesso.
- Analytics específico do parque.

### Fase 6 — integração MultiPlus+

- PDV, estoque e fiscal como adaptador próprio.
- Filiais e multilojas.
- Backups e releases locais.
- NotifyPlus e suporte.
- Validação de isolamento entre produtos.

## 11. Critérios de aceitação

- Uma organização consegue possuir ToyGo! e MultiPlus+ sem duplicar sua identidade.
- Um usuário ToyGo! não recebe fiscal, estoque ou caixa por herança.
- Um usuário MultiPlus+ não recebe dados de menores por herança.
- Licenças e cobranças são identificadas por produto.
- Releases podem ser publicadas por produto e canal.
- Instalações podem ser filtradas por produto e unidade/filial.
- Eventos têm envelope comum, origem e idempotência.
- Comandos têm lease, ACK e auditoria.
- O ToyGo! continua operando offline.
- O MultiPlus+ continua operando venda, caixa e fiscal localmente.
- Waivers e dados de menores têm acesso mínimo necessário.
- Backups, assinatura e rollback protegem atualizações.
- Testes cobrem isolamento, escopo, sincronização e regressão.

## 12. Riscos

| Risco | Proteção |
|---|---|
| ToyGo! perder identidade | Adaptador e domínio próprios |
| Permissões atravessarem produtos | Escopo obrigatório por produto |
| Central virar banco operacional | Eventos resumidos e ownership local |
| Vazamento de dados de menores | Minimização, RBAC e retenção |
| Migração quebrar instalações | Compatibilidade e rollout gradual |
| Comando duplicado | Idempotência, lease e ACK |
| Release danificar operação | Backup, assinatura e rollback |
| Stacks divergentes atrasarem | Contratos compartilhados antes da UI |

## 13. Documentos relacionados

- [`README.md`](README.md): identidade e fundação do ToyGo!.
- [`docs/architecture/ETAPA_1.md`](docs/architecture/ETAPA_1.md): decisões da fundação.
- [`docs/architecture/MODULE_BOUNDARIES.md`](docs/architecture/MODULE_BOUNDARIES.md): fronteiras de módulos.
- [`apps/central-web/package.json`](apps/central-web/package.json): Central Web ToyGo! atual.
- [`packages/domain`](packages/domain): core transacional.
- [`packages/application`](packages/application): orquestração.
- [`packages/integration-ports`](packages/integration-ports): portas externas.
- [`packages/licensing`](packages/licensing): licenciamento híbrido.
- [`../MultiPlus+/CENTRAL_MULTISISTEMAS.md`](../MultiPlus+/CENTRAL_MULTISISTEMAS.md): espelho da documentação no MultiPlus+.
- [`../MultiPlus+/CENTRAL_MULTIPLUS_WEB.md`](../MultiPlus+/CENTRAL_MULTIPLUS_WEB.md): manual da Central MultiPlus+ atual.
- [`../MultiPlus+/docs/roadmap/PHASES.md`](../MultiPlus+/docs/roadmap/PHASES.md): roadmap e entregas da Central MultiPlus+.

Este arquivo deve ser atualizado junto com o documento equivalente do MultiPlus+ sempre que mudar um contrato compartilhado, uma fronteira, um produto, uma licença, um módulo ou uma responsabilidade da Central.

---

**Síntese:** a Central é compartilhada; a operação continua especializada. O ToyGo! pode ganhar a mesma maturidade administrativa do MultiPlus+ sem deixar de ser ToyGo!.
