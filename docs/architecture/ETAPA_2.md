# Etapa 2 - Painel operacional

## Entrega

A Etapa 2 implementa a primeira superfície operacional real do ToyGo! Desktop:

- Linhas horizontais dinâmicas por criança/sessão.
- Cronômetro em tempo real por linha.
- Alerta visual para tempo próximo do limite e tempo estourado.
- Adição de brinquedos/carrinhos como complementos da sessão.
- Venda cruzada de produtos da bomboniere usando `InventoryEngine`.
- Reflexo financeiro de venda cruzada pela camada `application`, sem acoplar financeiro ao core de estoque.

## Fronteira técnica

O painel usa dados locais de demonstração enquanto o adapter MariaDB definitivo não é conectado à tela. Mesmo assim, a venda cruzada já passa pelo mesmo contrato que será usado em produção:

1. `CrossSellInventoryService.register` recebe a venda da linha operacional.
2. `InventoryEngine.registerConsumption` gera `StockMovement` de saída com source `cross_sell`.
3. `InventoryFinancePolicy.recordFinancialEffect` gera o reflexo em `FinanceLedgerEntry`.
4. A UI mostra o ID do movimento gerado para rastreabilidade.

## Schema MariaDB

O schema base passa a incluir:

- `guardians`: responsáveis.
- `children`: crianças vinculadas a responsáveis.
- `play_assets`: estadia geral, carrinhos e brinquedos.
- `play_sessions`: sessões operacionais ativas/fechadas/canceladas.
- `play_session_lines`: linhas de tempo, ativos adicionais e produtos vinculadas à sessão.

## Fora do escopo desta etapa

O fechamento de conta, PIX, fiscal em contingência e comprovante ficam para a Etapa 3. A Etapa 2 apenas projeta os totais em tempo real e registra venda cruzada no ledger.