# ToyGo!

Ecossistema híbrido para gestão de parquinhos indoor, inspirado no modelo GALINT de ledger imutável, estoque transacional e rastreabilidade financeira.

Para visão executiva do que já foi concluído, pendências, riscos e roadmap, consulte `README_EXECUTIVO.md`.

## Etapa 1 entregue

- Monorepo com Desktop, Sistema Central e pacotes compartilhados.
- Desktop offline-first em Electron + Vite + React + Tailwind CSS v3.
- MariaDB local preparado para instalação/provisionamento junto ao executável do Desktop.
- Core transacional separado de módulos periféricos: domínio, aplicação, portas de integração, backup, banco, licenciamento e UI.
- Motor de licenciamento híbrido com comunicação restrita a Machine ID, ativação, bloqueio e PIX/Boleto.
- Tela de login moderna com skins `dark`, `cyberpunk` e `light`, status da licença e indicador MariaDB.

## Etapa 2 entregue

- Painel operacional do Desktop com linhas horizontais dinâmicas.
- Cronômetros em tempo real com alerta visual de tempo próximo e tempo estourado.
- Adição de brinquedos/carrinhos na linha da criança.
- Venda cruzada de bomboniere passando pelo `InventoryEngine` e refletindo no ledger financeiro pela camada `application`.
- Schema MariaDB preparado para responsáveis, crianças, ativos de recreação, sessões e linhas de cobrança.

## Módulo fiscal obrigatório no roadmap

O ToyGo! passa a tratar o módulo fiscal brasileiro como entrega obrigatória de produto, não apenas como integração futura. A especificação executiva inclui Editor de Cupom & Etiquetas, configuração SEFAZ/NFC-e (certificado A1 ou A3), FCP por NCM, disclosure de tributos aproximados (Lei 12.741/2012), contingência automática para séries 900/901 com prazo legal de retransmissão e retenção manual do gerente (MOC 7.0), emissão offline, fila de envio posterior e impressão térmica ESC/POS. É o mesmo conjunto de correções já validado em produção no MultiPlus+, registrado aqui como requisito antes de existir código fiscal no ToyGo!.

Detalhes do escopo fiscal estão em `docs/architecture/FISCAL_MODULE.md` e no roadmap executivo em `README_EXECUTIVO.md`. A arquitetura para evoluir de backend único (hoje) para um backend compartilhado por unidade quando houver múltiplos terminais está em `docs/architecture/MODULE_BOUNDARIES.md`.

## Instalador e preflight do host (O_Batedor)

O instalador do ToyGo! Desktop precisa da mesma camada de preflight/baseline já validada em produção no MultiPlus+ (`O_Batedor`): discovery do ambiente, baseline controlado do host e handoff auditável para suporte, sem enfraquecer Defender, UAC, Firewall global ou Windows Update. Ainda não existe código do Batedor no ToyGo!; o requisito e a decisão pendente (script compartilhado com o MultiPlus+ vs. fork dedicado) estão em `docs/architecture/O_BATEDOR.md`.

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
  mysql/desktop/ Configuração MariaDB local essencial do executável, usando protocolo MySQL
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

Para preparar o MariaDB local do Desktop durante desenvolvimento:

```powershell
./scripts/mysql/init-local-desktop.ps1 -RootPassword "sua-senha-root"
```

## Banco local do Desktop

O instalador do ToyGo! Desktop deve provisionar o MariaDB local junto com o executável. Isso é requisito primordial para o modo 100% offline.

A decisão oficial do ToyGo! Desktop é **MariaDB local**. O projeto ainda usa o driver `mysql2` e variáveis legadas `TOYGO_DESKTOP_MYSQL_*` como compatibilidade de protocolo, mas as novas configurações devem usar `TOYGO_DESKTOP_MARIADB_*`.

Detalhes da decisão estão em `docs/architecture/DESKTOP_DATABASE_INSTALLER.md`.

## Regra arquitetural central

`StockMovement` e `FinanceLedgerEntry` são append-only. Toda alteração operacional relevante cria um novo lançamento e os saldos (`StockBalance`) são read-models derivados, nunca a fonte da verdade.

O core não conhece fiscal, hardware, booking, LGPD, analytics, backup nem licenciamento. Esses pontos entram por portas e adapters, documentados em `docs/architecture/MODULE_BOUNDARIES.md`.

## Central Multisistemas

O contrato local de conexão está em [`CENTRAL_MULTISISTEMAS.md`](CENTRAL_MULTISISTEMAS.md). A arquitetura, as fases, o roadmap e os contratos compartilhados pertencem ao repositório independente [Central MultiSistemas](https://github.com/JefersonCG/CENTRAL-MULTISISTEMA). O ToyGo! preserva o domínio de parques e a operação offline-first em um adaptador próprio.

## Licença proprietária

ToyGo! é um projeto privado e proprietário de Jeferson dos Santos Paula. O código-fonte, a arquitetura, os módulos e os artefatos deste repositório não são distribuídos como software open source e não concedem permissão pública de uso, cópia, modificação ou redistribuição.

A venda, o licenciamento, a implantação comercial e a distribuição do ToyGo! são direitos exclusivos de Jeferson dos Santos Paula. Qualquer acesso ao código não representa autorização para revenda, sublicenciamento, publicação, distribuição ou uso comercial por terceiros.
