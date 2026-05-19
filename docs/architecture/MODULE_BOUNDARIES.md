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

- Fiscal: NFC-e, SAT e TEF.
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
