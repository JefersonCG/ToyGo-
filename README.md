# ToyGo!

Ecossistema híbrido para gestão de parquinhos indoor, inspirado no modelo GALINT de ledger imutável, estoque transacional e rastreabilidade financeira.

## Etapa 1 entregue

- Monorepo com Desktop, Sistema Central e pacotes compartilhados.
- Desktop offline-first em Electron + Vite + React + Tailwind CSS v3.
- MySQL 8.0+ local preparado para instalação junto ao executável.
- Core transacional separado de módulos periféricos: domínio, aplicação, portas de integração, backup, banco, licenciamento e UI.
- Motor de licenciamento híbrido com comunicação restrita a Machine ID, ativação, bloqueio e PIX/Boleto.
- Tela de login moderna com skins `dark`, `cyberpunk` e `light`, status da licença e indicador MySQL.

## Estrutura

```text
apps/
  desktop/       Aplicativo offline-first do cliente
  central-web/   Sistema central para dono/gerente/desenvolvedor
packages/
  domain/        Core puro: estoque, ledger financeiro e invariantes transacionais
  application/   Orquestração entre domínios sem misturar regra no core
  integration-ports/ Portas para fiscal, hardware, booking, LGPD, membership, analytics e payments
  backup/        Contratos e políticas de backup fora do core
  database/      MySQL, migrations e conexão local
  licensing/     Ativação, cache local e verificação de bloqueio
  ui-skins/      Tokens visuais compartilhados
infra/
  mysql/desktop/ Configuração MySQL local essencial do executável
  mysql/modules/ Schemas modulares opcionais por capacidade futura
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

O core não conhece fiscal, hardware, booking, LGPD, analytics, backup nem licenciamento. Esses pontos entram por portas e adapters, documentados em `docs/architecture/MODULE_BOUNDARIES.md`.
