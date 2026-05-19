# ToyGo!

Ecossistema híbrido para gestão de parquinhos indoor, inspirado no modelo GALINT de ledger imutável, estoque transacional e rastreabilidade financeira.

## Etapa 1 entregue

- Monorepo com Desktop, Sistema Central e pacotes compartilhados.
- Desktop offline-first em Electron + Vite + React + Tailwind CSS v3.
- MySQL 8.0+ local preparado para instalação junto ao executável.
- Engines centrais: `InventoryEngine`, `UnitConversionEngine`, `PriceNormalization`, `BalanceProvider`, `FinanceLedgerService` e `BackupService`.
- Motor de licenciamento híbrido com comunicação restrita a Machine ID, ativação, bloqueio e PIX/Boleto.
- Tela de login moderna com skins `dark`, `cyberpunk` e `light`, status da licença e indicador MySQL.

## Estrutura

```text
apps/
  desktop/       Aplicativo offline-first do cliente
  central-web/   Sistema central para dono/gerente/desenvolvedor
packages/
  domain/        Motores transacionais e contratos do ledger
  database/      MySQL, migrations e conexão local
  licensing/     Ativação, cache local e verificação de bloqueio
  ui-skins/      Tokens visuais compartilhados
infra/
  mysql/desktop/ Configuração MySQL local do executável
scripts/
  mysql/         Automação de preparação do banco local
docs/
  architecture/  Decisões arquiteturais por etapa
```

## Comandos iniciais

```powershell
npm install
npm run typecheck
npm run dev:desktop
```

Para preparar o MySQL local do Desktop:

```powershell
./scripts/mysql/init-local-desktop.ps1 -RootPassword "sua-senha-root"
```

## Regra arquitetural central

`StockMovement` e `FinanceLedgerEntry` são append-only. Toda alteração operacional relevante cria um novo lançamento e os saldos (`StockBalance`) são read-models derivados, nunca a fonte da verdade.
