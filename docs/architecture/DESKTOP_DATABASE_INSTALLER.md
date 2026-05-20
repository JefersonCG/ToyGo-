# Banco local do ToyGo! Desktop

## Requisito primordial

O ToyGo! Desktop deve ser instalado com MariaDB local provisionado junto ao executável. O cliente final não deve precisar instalar banco manualmente antes de usar o sistema.

Esse requisito existe porque o Desktop precisa operar 100% offline em shopping, mesmo sem internet ou com conexão instável.

## Estado atual

A decisão oficial para o Desktop é MariaDB local. A Etapa 1 foi construída com dialeto compatível com MariaDB e protocolo MySQL:

- Driver Node: `mysql2`, mantido por compatibilidade de protocolo com MariaDB.
- Schema base: `infra/mysql/desktop/schema.sql`.
- Configuração local: `infra/mysql/desktop/my.ini`.
- Script inicial: `scripts/mysql/init-local-desktop.ps1`.
- Variáveis preferenciais: `TOYGO_DESKTOP_MARIADB_*`.
- Variáveis legadas aceitas: `TOYGO_DESKTOP_MYSQL_*`.

Antes do instalador final, a compatibilidade de `JSON`, `CHECK`, `ENUM`, triggers e collation deve ser validada na versão MariaDB escolhida.

## PostgreSQL 16.11 descartado para o Desktop

PostgreSQL 16.11 não deve ser tratado como substituto direto de MariaDB e fica descartado para o banco local do ToyGo! Desktop nesta arquitetura. Se um dia PostgreSQL for reconsiderado, o ToyGo! precisaria de uma trilha própria:

- Pacote `@toygo/database-postgres` ou adapter equivalente.
- Schema SQL separado.
- Migrations separadas.
- Revisão de tipos `ENUM`, `JSON`, triggers, collation e auto-provisionamento.
- Configuração de serviço local no instalador do Windows.

## Decisão do Desktop

O Desktop deve usar MariaDB local embutido/provisionado pelo instalador. As próximas etapas operacionais devem assumir MariaDB como banco local oficial para evitar retrabalho no ledger, nos relatórios e no empacotamento.

## Responsabilidades do instalador

O instalador do Desktop deve:

- Instalar ou provisionar o banco local aprovado.
- Inicializar o schema do ToyGo!.
- Criar usuário técnico do aplicativo com permissões mínimas.
- Registrar porta, credenciais e health check local.
- Garantir start automático do serviço local.
- Executar backup antes de upgrades.
- Bloquear downgrade destrutivo de schema.
- Permitir operação offline mesmo se a verificação de licença estiver indisponível dentro do período de tolerância.