# Fronteiras de módulos ToyGo!

## Regra principal

O core do ToyGo! não conhece fiscal, hardware, booking, LGPD, analytics, backup nem licenciamento. Ele só modela regras transacionais puras.

## Camadas

### `packages/domain`

Contém apenas invariantes centrais:

- Estoque: `InventoryEngine`, `StockMovement`, `StockBalance`, conversão e normalização de preço.
- Financeiro: `FinanceLedgerEntry` e validação de lançamento append-only.
- Tipos compartilhados mínimos, como `ToygoId` e `PaymentMethod`.

O domínio não chama APIs externas, não abre conexão com banco, não gera PIX, não fala com TEF, não assina waiver e não executa backup.

### `packages/application`

Orquestra casos de uso entre domínios. Exemplo atual: `InventoryFinancePolicy` observa uma movimentação de estoque e decide se ela deve gerar lançamento financeiro.

Essa camada pode chamar domínio, mas o domínio não chama a aplicação.

### `packages/integration-ports`

Define portas para módulos futuros sem implementação concreta:

- Fiscal: SEFAZ, NFC-e, SAT, TEF, contingência 900/901, editor de cupom, QR Code, chave de acesso, ESC/POS e fila de envio posterior.
- Hardware: RFID, NFC, QR Code e catracas.
- Booking: reservas e festas.
- LGPD: waiver e consentimento.
- Membership: planos recorrentes e consumo de benefícios.
- Analytics: publicação de eventos para o Central.
- Payments: PIX/Boleto de licença.

Adapters concretos devem ficar em `packages/adapters/*` ou dentro do app que os usa.

### `packages/backup`

Contrato e política de backup. Não faz parte do core transacional porque backup é operação de infraestrutura.

### `packages/licensing`

Motor de licença híbrida. A comunicação continua restrita a Machine ID, ativação, bloqueio e PIX/Boleto.

### `packages/database`

Infraestrutura MySQL. Deve persistir ledgers e read-models, mas não decidir regra de negócio.

## Schema modular

O schema base em `infra/mysql/desktop/schema.sql` cobre apenas operação essencial do Desktop. Tabelas futuras por módulo entram em `infra/mysql/modules/<modulo>/` para evitar que LGPD, booking, membership ou fiscal virem dependências obrigatórias do core.

## Servidor ToyGo! (evolução futura)

**Estado real hoje**: o ToyGo! é um único processo Desktop por unidade. Não existe, e não deve ser descrito como existindo, um backend de rede compartilhado por vários terminais — isso seria descrever uma arquitetura que ainda não foi construída.

**Para onde isso deve crescer**, quando uma unidade precisar de mais de um terminal (segunda catraca, segundo caixa, etc.): o mesmo padrão já validado em produção no MultiPlus+ — **um único backend local por unidade** (equivalente ao "Servidor PDV" do MultiPlus+, `apps/pdv-server`), com todos os outros terminais conectando nele como clientes HTTP pela rede local, lendo e gravando através dessa única API. A vantagem prática: qualquer configuração (fiscal, retenção manual de contingência, etc.) salva uma vez nesse backend fica automaticamente visível a todo terminal da unidade, sem precisar de descoberta de máquinas na rede (mDNS/broadcast) nem de um protocolo de envio de configuração entre processos independentes — infraestrutura que o próprio MultiPlus+ deliberadamente não construiu, porque o modelo de backend único já resolve o problema.

**Por que o esquema atual já permite essa evolução sem reescrever o core**: a regra principal deste documento — o core não conhece transporte, fiscal, hardware, nem nenhuma integração externa — é exatamente o que torna essa migração aditiva. `packages/domain` e `packages/application` não sabem se rodam dentro do mesmo processo do terminal ou atrás de uma chamada HTTP para um backend compartilhado; essa decisão pertence a `packages/integration-ports`/adapters e ao processo que orquestra a UI. Concretamente, para não travar essa evolução:

- Nenhuma regra de negócio deve presumir "estou no único terminal" — todo estado compartilhado (fiscal, filas, configuração) deve passar por uma porta em `packages/integration-ports`, mesmo que a implementação de hoje seja só uma chamada local em memória/SQLite.
- O adapter concreto de hoje (in-process) e um futuro adapter de rede (cliente HTTP para um backend compartilhado) devem poder satisfazer a mesma porta sem mudar `packages/domain`/`packages/application`.
- Identidade de terminal (equivalente ao `terminal_code` do MultiPlus+) deve ser um campo simples carregado pelo caso de uso, não uma tabela de registro de máquinas — não há necessidade de descoberta/registro de rede enquanto o backend for único por unidade.
