# Banco local do ToyGo! Desktop

## Requisito primordial

O ToyGo! Desktop deve ser instalado com banco local provisionado junto ao executável. O cliente final não deve precisar instalar banco manualmente antes de usar o sistema.

Esse requisito existe porque o Desktop precisa operar 100% offline em shopping, mesmo sem internet ou com conexão instável.

## Estado atual

A Etapa 1 foi construída com dialeto MySQL/MariaDB:

- Driver Node: `mysql2`.
- Schema base: `infra/mysql/desktop/schema.sql`.
- Configuração local: `infra/mysql/desktop/my.ini`.
- Script inicial: `scripts/mysql/init-local-desktop.ps1`.
- Variáveis: `TOYGO_DESKTOP_MYSQL_*`.

Na prática, isso significa que MariaDB é o caminho mais próximo da base atual, desde que a compatibilidade de `JSON`, `CHECK`, `ENUM`, triggers e collation seja validada na versão escolhida.

## PostgreSQL 16.11 não é drop-in

PostgreSQL 16.11 não deve ser tratado como substituto direto de MySQL/MariaDB. Se PostgreSQL for a decisão final, o ToyGo! precisa de uma trilha própria:

- Pacote `@toygo/database-postgres` ou adapter equivalente.
- Schema SQL separado.
- Migrations separadas.
- Revisão de tipos `ENUM`, `JSON`, triggers, collation e auto-provisionamento.
- Configuração de serviço local no instalador do Windows.

## Decisão recomendada para o Desktop

Para avançar rápido com a arquitetura já aplicada, a recomendação técnica atual é manter o Desktop em banco compatível com MySQL, preferencialmente MariaDB embutido/provisionado pelo instalador se a distribuição for mais simples.

Se a exigência comercial for PostgreSQL 16.11, essa decisão deve ser tomada antes da implementação das próximas etapas operacionais para evitar retrabalho no ledger, nos relatórios e no instalador.

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