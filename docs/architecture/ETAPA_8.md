# Etapa 8 - Instalador Windows e MariaDB local

Esta etapa inicia a entrega do ToyGo! como produto instalavel para Windows.
Ela vem depois da Etapa 7, que ja possui adapter real contra a Central e
controle administrativo no portal.

## Entregas concluídas nesta etapa

- `@toygo/installer` possui um provisionador Windows de MariaDB.
- O provisionador faz health check com `mariadb-admin`.
- Se o servico nao responder, ele solicita o start por `sc.exe` e aguarda a
  recuperacao do health check.
- O bootstrap cria banco e usuario tecnico, aplica o schema e passa senhas por
  `MYSQL_PWD`, nunca por argumentos de processo.
- O fluxo e injetavel por `InstallerCommandRunner`, permitindo teste sem
  alterar o host de desenvolvimento.
- O Desktop possui configuracao inicial de empacotamento NSIS em
  `apps/desktop/electron-builder.yml`.
- O payload oficial MariaDB Community Server 11.8.8 e adquirido por script,
  validado por SHA-256 e incluido no instalador sem ser versionado no Git.
- O O_Batedor dedicado e empacotado em `resources/installer` e produz
  diagnostico JSON, log TXT e handoff.
- O guard de upgrade cria backup `before_update` e bloqueia downgrade
  destrutivo antes de qualquer mutacao.
- O bootstrap inicial pode ser executado pelo Desktop empacotado com
  `--toygo-provision`; `scripts/windows/provision-toygo.ps1` passa os segredos
  somente por ambiente de processo e aguarda o resultado.
- O build NSIS gera `ToyGo-Setup-0.1.0.exe` com MariaDB e O_Batedor.

## O que ainda nao esta concluido

- Executar o teste de instalacao em uma maquina Windows limpa.
- Assinar o instalador com Authenticode e publicar o checksum do artefato de
  release.
- Automatizar o wizard visual de primeira configuracao; o fluxo atual ja tem
  o CLI de provisionamento e o contrato Electron/IPC.

O binario nao e baixado silenciosamente pelo aplicativo: o script de build usa
o manifesto oficial em `infra/mariadb-embedded/11.8/artifact.json`, valida o
SHA-256 e somente entao o inclui no NSIS. O ZIP e o diretorio extraido ficam
fora do Git por tamanho; a reproducao depende do script versionado.

## Validacao do incremento

- `npm run test --workspace @toygo/installer`
- `npm run typecheck --workspace @toygo/installer`
- `npm run build --workspace @toygo/desktop`
- `npm run typecheck --workspace @toygo/desktop`

O comando `npm run dist:win --workspace @toygo/desktop` gera o instalador NSIS
e prepara o MariaDB automaticamente quando o payload verificado ainda nao
existe localmente. A homologacao em maquina limpa e a assinatura Authenticode
continuam fora deste checkout.
