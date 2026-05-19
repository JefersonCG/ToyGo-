# Etapa 1 - Fundação ToyGo!

## Avaliação da elaboração

A elaboração está tecnicamente forte porque separa o produto em dois domínios com responsabilidades claras:

- **ToyGo! Desktop**: operação local, caixa, entrada/saída de crianças, consumo, estoque, manutenção e BI embarcado.
- **Sistema Central ToyGo!**: licenças, clientes, financeiro do SaaS, emissão PIX/Boleto e analytics agregado futuro.

O ponto mais importante é manter o Desktop offline-first. Por isso, a comunicação com o Central fica deliberadamente pequena: Machine ID, ativação, bloqueio e cobrança. Isso evita que uma queda de internet pare a loja.

## Decisão arquitetural

O modelo GALINT foi adaptado assim:

- `InventoryEngine` recebe comandos operacionais e sempre grava `StockMovement`.
- `StockMovement` é ledger imutável e fonte da verdade do estoque.
- `StockBalance` é read-model derivado para tela rápida e alertas.
- `FinanceLedgerEntry` registra o reflexo financeiro com origem rastreável.
- `PriceNormalization` normaliza valores por unidade base.
- `UnitConversionEngine` impede divergência entre embalagem, unidade, dose, kit e consumo real.
- `BackupService` prepara dumps locais, manifestos e restauração auditável.

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
