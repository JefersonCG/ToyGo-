# Etapa 1 - Fundação ToyGo!

## Avaliação da elaboração

A elaboração está tecnicamente forte porque separa o produto em dois domínios com responsabilidades claras:

- **ToyGo! Desktop**: operação local, caixa, entrada/saída de crianças, consumo, estoque, manutenção e BI embarcado.
- **Sistema Central ToyGo!**: licenças, clientes, financeiro do SaaS, emissão PIX/Boleto e analytics agregado futuro.

O ponto mais importante é manter o Desktop offline-first. Por isso, a comunicação com o Central fica deliberadamente pequena: Machine ID, ativação, bloqueio e cobrança. Isso evita que uma queda de internet pare a loja.

Outro requisito primordial é que o banco local acompanhe o instalador do Desktop. O cliente não deve depender de uma instalação manual prévia feita por técnico para operar o ToyGo!.

## Decisão arquitetural

O modelo GALINT foi adaptado assim:

- `InventoryEngine` recebe comandos operacionais e sempre grava `StockMovement`, sem chamar financeiro ou integrações externas diretamente.
- `StockMovement` é ledger imutável e fonte da verdade do estoque.
- `StockBalance` é read-model derivado para tela rápida e alertas.
- `FinanceLedgerEntry` registra o reflexo financeiro com origem rastreável, orquestrado pela camada `application`.
- `PriceNormalization` normaliza valores por unidade base.
- `UnitConversionEngine` impede divergência entre embalagem, unidade, dose, kit e consumo real.
- `BackupService` fica fora do core, no pacote `@toygo/backup`, porque backup é infraestrutura.

## Banco local empacotado

A fundação atual usa schema e driver compatíveis com MySQL/MariaDB. O instalador final deve instalar, inicializar ou reaproveitar uma instância local controlada pelo ToyGo! Desktop.

Se a decisão final for PostgreSQL 16.11, isso deixa de ser uma troca de binário e passa a exigir adapter próprio, migrations próprias e revisão dos tipos SQL. Essa decisão deve ser fechada antes da fase de empacotamento do executável.

## Separação de módulos

A correção arquitetural desta etapa separa o sistema em camadas explícitas:

- `packages/domain`: core puro de estoque, saldo, preço, conversão e ledger financeiro.
- `packages/application`: políticas de orquestração, como o reflexo financeiro de uma movimentação de estoque.
- `packages/integration-ports`: contratos para fiscal, hardware, booking, LGPD, membership, analytics e payments.
- `packages/backup`: backup e retenção, fora do core.
- `packages/licensing`: licenciamento híbrido, também fora do core.

Essa divisão evita que funcionalidades futuras entrem como dependência obrigatória do motor transacional.

## Gaps de mercado já previstos

A Etapa 1 já deixa espaço de schema e domínio para:

- Waivers digitais com consentimento LGPD.
- Controle de lotação por zona/ambiente.
- Membership e pacotes recorrentes.
- Booking online e festas.
- Integração futura RFID/NFC/catracas.
- Fiscal brasileiro: NFC-e, SAT e TEF.
- Multi-unidade/franquia.
- Analytics avançado no Central.

## Regra de avanço

As próximas etapas devem ser implementadas apenas após validação explícita da etapa atual.
