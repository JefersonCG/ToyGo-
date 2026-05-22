# ToyGo! - README executivo

Data de referência: 22 de maio de 2026

## 1. Resumo executivo

O ToyGo! já saiu da fase de ideia e entrou em fase de produto estruturado. O projeto possui uma fundação técnica real, versionada, enviada ao GitHub e organizada como monorepo TypeScript com separação clara entre Desktop, Central Web e pacotes internos.

O foco estratégico definido até aqui é construir um ecossistema privado e proprietário para gestão de parquinhos indoor, com operação local offline-first, banco MariaDB instalado junto ao Desktop, ledger imutável para estoque e financeiro, licenciamento privado e módulo fiscal brasileiro obrigatório com NFC-e, SEFAZ, contingência, editor de cupom e impressão térmica.

O projeto ainda não está pronto para uso em produção por cliente final. Ele está em estágio de fundação técnica e primeira superfície operacional. A base arquitetural está bem posicionada, mas ainda faltam persistência real da operação no MariaDB, fechamento de conta, caixa, fiscal completo, instalador, autenticação completa, integrações reais e hardening de produção.

## 2. Estado geral atual

Status atual: Etapa 1 e Etapa 2 entregues.

Estado enviado ao remoto até o último fechamento documentado:

- Branch: `master`.
- Remoto: `origin/master` em `https://github.com/JefersonCG/ToyGo-.git`.
- Marcos relevantes:
  - Etapa 1 entregue: fundação do monorepo, Desktop, Central Web, licenciamento e MariaDB local.
  - Etapa 2 entregue: painel operacional com cronômetros, venda cruzada e schema de sessões.
  - README executivo criado e enviado ao remoto.
  - Módulo fiscal obrigatório incorporado ao roadmap de desenvolvimento.

Validação técnica realizada antes do envio:

- `npm run typecheck` passando em todos os workspaces.
- `git diff --check` passando.
- Repositório enviado ao remoto após validação.

## 3. Decisões executivas já fechadas

### 3.1 Produto privado e proprietário

O ToyGo! é um produto privado e proprietário de Jeferson dos Santos Paula. O repositório possui licença proprietária, sem concessão pública de uso, cópia, redistribuição, sublicenciamento, revenda ou publicação por terceiros.

Impacto executivo: o projeto deve ser tratado como ativo comercial fechado, com controle de distribuição, ativação, licença e implantação.

### 3.2 Desktop offline-first

O ToyGo! Desktop foi definido como o centro da operação diária do cliente. A loja deve operar mesmo sem internet, incluindo entrada, permanência, consumo, estoque e caixa local.

Impacto executivo: a operação do cliente não pode depender do Sistema Central para funcionar durante o expediente.

### 3.3 Sistema Central com comunicação restrita

O Central Web deve cuidar de clientes, licenças, bloqueios, cobrança SaaS, PIX/Boleto e visão administrativa futura. A comunicação com o Desktop deve ser reduzida e controlada.

Comunicação prevista:

- Machine ID.
- Ativação.
- Bloqueio.
- Status de licença.
- PIX/Boleto do licenciamento.
- Analytics agregado futuro, quando implementado.

Impacto executivo: o Central é administrativo e comercial, não deve virar dependência operacional de tempo real da loja.

### 3.4 MariaDB local como banco oficial do Desktop

Foi decidido que o Desktop usará MariaDB local provisionado junto com o instalador. PostgreSQL foi descartado para o Desktop nesta arquitetura.

Impacto executivo: o empacotamento final precisa instalar, configurar, iniciar e manter o MariaDB local automaticamente, sem exigir instalação manual por parte do cliente.

### 3.5 Core transacional separado de módulos periféricos

O core do ToyGo! não conhece fiscal, hardware, booking, LGPD, analytics, backup ou licenciamento. Esses pontos entram por portas, adapters e pacotes separados.

Impacto executivo: a arquitetura evita que módulos futuros contaminem a regra central de estoque, financeiro e operação.

### 3.6 Módulo fiscal brasileiro obrigatório

O módulo fiscal deixou de ser apenas uma possibilidade futura e passa a ser requisito obrigatório do roadmap. O ToyGo! deve oferecer uma experiência fiscal profissional para estabelecimentos brasileiros, incluindo operação em contingência para comerciantes ainda em regularização cadastral.

Escopo obrigatório registrado:

- Editor de Cupom & Etiquetas em `Configurações -> Editor de Cupom & Etiquetas`.
- Preview em tempo real de cupom térmico 58mm e 80mm.
- Configuração SEFAZ/NFC-e em `Configurações -> Fiscal -> SEFAZ / NFC-e`.
- Upload de certificado A1 `.pfx`, senha, CSC, série, ambiente e status de credenciamento.
- Suporte especial para séries 900 e 901 em contingência.
- Geração de NFC-e offline quando em contingência.
- Impressão com aviso claro de `EMITIDO EM CONTINGÊNCIA`.
- Armazenamento das notas para envio posterior em lote.
- Fluxo de impressão no PDV com cupom não fiscal e NFC-e.
- Suporte a impressoras térmicas via ESC/POS raw print.

Impacto executivo: o ToyGo! precisa tratar fiscal como diferencial e obrigação de produto para o mercado brasileiro, com usabilidade forte para pequenos comerciantes.

### 3.7 Stack fiscal solicitada e impacto técnico

A diretriz visual solicitada para o módulo fiscal é Tauri 2.0, Svelte 5, Tailwind CSS v3.4+, shadcn/ui, dark mode predominante e ícones Lucide.

O Desktop atual está implementado em Electron, Vite, React e Tailwind CSS. Portanto, antes de codificar o módulo fiscal, existe uma decisão técnica obrigatória:

- Migrar o Desktop para Tauri/Svelte.
- Criar o módulo fiscal como superfície separada em Tauri/Svelte integrada ao core ToyGo!.
- Ou manter Electron/React e adaptar a diretriz visual, assumindo divergência da stack solicitada.

Recomendação atual: registrar a stack fiscal como requisito de produto, mas decidir a estratégia técnica no início da etapa fiscal para evitar retrabalho.

### 3.8 SQLite não adotado como banco operacional secundário

SQLite foi avaliado conceitualmente como possível banco auxiliar, mas não foi adotado como segunda fonte operacional.

Posição recomendada:

- MariaDB deve continuar como fonte oficial de estoque, financeiro, sessões e ledger.
- SQLite só faria sentido futuramente como cache, fila de sincronização, cache de licença ou spool emergencial bem isolado.
- SQLite não deve duplicar o ledger nem virar banco paralelo de operação.

Impacto executivo: evita duas fontes de verdade e reduz risco de divergência de dados.

## 4. O que foi realizado e está finalizado

### 4.1 Fundação do repositório

Concluído:

- Criação do projeto ToyGo! em `D:\ToyGo!`.
- Inicialização como monorepo TypeScript.
- Configuração de workspaces npm para `apps/*` e `packages/*`.
- Configuração de scripts principais:
  - `npm run build`.
  - `npm run dev:desktop`.
  - `npm run dev:central`.
  - `npm run typecheck`.
  - `npm run lint`.
- Configuração de Git local.
- Configuração de remoto GitHub.
- Push do projeto para o remoto.

Valor entregue:

- O projeto saiu de estrutura vazia para base versionada e evolutiva.
- Existe trilha clara de commit, validação e envio remoto.

### 4.2 Desktop ToyGo!

Concluído:

- Aplicação Desktop criada com Electron, Vite, React e Tailwind CSS.
- Estrutura visual inicial com skins:
  - `dark`.
  - `cyberpunk`.
  - `light`.
- Tela de login e ativação inicial.
- Indicadores locais de licença e banco.
- Navegação para painel operacional.
- Painel operacional da Etapa 2 com linhas horizontais dinâmicas.
- Cronômetro em tempo real por sessão.
- Alerta visual de tempo próximo do limite.
- Alerta visual de tempo estourado.
- Inclusão de brinquedos/carrinhos adicionais na linha da criança.
- Venda cruzada de produtos da bomboniere na linha operacional.

Valor entregue:

- O Desktop já possui a primeira experiência operacional visível.
- A interface já demonstra a lógica central do negócio: criança, responsável, tempo, brinquedo, consumo e total projetado.

Limite atual:

- O painel ainda usa dados locais de demonstração.
- A tela ainda não está persistindo sessões reais no MariaDB.
- Login, operador, permissões e sessão de caixa ainda não estão completos.

### 4.3 Sistema Central Web

Concluído:

- Criação do app `apps/central-web` em Next.js.
- Página inicial administrativa mínima.
- Preparação conceitual para licenças, clientes e financeiro do SaaS.
- Ajuste de tipagem para permitir typecheck sem depender de import desnecessário de tipo do Next na página inicial.

Valor entregue:

- O Central já existe como app separado e pode evoluir sem misturar regra operacional do Desktop.

Limite atual:

- Ainda não possui autenticação real.
- Ainda não possui painel de clientes.
- Ainda não emite PIX/Boleto.
- Ainda não controla ativação/bloqueio real.
- Ainda não possui backend/API de licenciamento.

### 4.4 Pacote de domínio

Concluído no `packages/domain`:

- Tipos centrais de estoque.
- `StockMovement` como ledger imutável de estoque.
- `StockBalance` como read-model derivado.
- `InventoryEngine` para registrar entrada, consumo e reversão.
- `UnitConversionEngine` para conversão de unidades.
- `PriceNormalization` para normalização de preço por unidade base.
- Tipos centrais financeiros.
- `FinanceLedgerEntry` como ledger financeiro.
- `FinanceLedgerService` para lançamento financeiro append-only.
- `DefaultMovementIdFactory` sem dependência direta de `node:crypto`, favorecendo compatibilidade com ambiente browser/Electron renderer.

Valor entregue:

- A regra central fica limpa, testável e independente de banco, fiscal, hardware e UI.
- A arquitetura preserva rastreabilidade e evita alteração destrutiva de histórico.

Limite atual:

- Ainda faltam testes automatizados específicos para todas as invariantes.
- Ainda falta adapter persistente MariaDB para gravar e consultar os ledgers reais.

### 4.5 Camada de aplicação

Concluído no `packages/application`:

- `InventoryFinancePolicy` para refletir movimentos de estoque no ledger financeiro.
- `MonitoringSessionPricingPolicy` para calcular tempo decorrido, tempo restante, extra e total projetado da sessão.
- `CrossSellInventoryService` para registrar venda cruzada usando `InventoryEngine`.
- Exportação dos serviços novos pelo pacote de aplicação.

Valor entregue:

- A venda cruzada já segue o fluxo correto: UI -> aplicação -> domínio -> ledger de estoque -> reflexo financeiro.
- O financeiro não foi acoplado diretamente ao motor de estoque.

Limite atual:

- Ainda falta persistência real do resultado no MariaDB.
- Ainda falta orquestração de fechamento de conta e pagamento.

### 4.6 Banco de dados local

Concluído:

- Decisão oficial: MariaDB local.
- Driver: `mysql2`, por compatibilidade com protocolo MariaDB/MySQL.
- Configuração local em `infra/mysql/desktop/my.ini`.
- Schema base em `infra/mysql/desktop/schema.sql`.
- Script inicial em `scripts/mysql/init-local-desktop.ps1`.
- Variáveis preferenciais `TOYGO_DESKTOP_MARIADB_*`.
- Variáveis legadas `TOYGO_DESKTOP_MYSQL_*` mantidas por compatibilidade.
- Collation ajustada para opção compatível com MariaDB.
- Schema preparado para:
  - tenants.
  - unidades operacionais.
  - usuários.
  - itens.
  - conversões de unidade.
  - movimentos de estoque.
  - saldos de estoque.
  - ledger financeiro.
  - responsáveis.
  - crianças.
  - ativos de recreação.
  - sessões de recreação.
  - linhas de cobrança da sessão.

Valor entregue:

- A modelagem relacional básica já acompanha a evolução operacional da Etapa 2.
- A estrutura está preparada para persistir sessões, consumo, estoque e financeiro.

Limite atual:

- Ainda falta instalar e versionar uma estratégia formal de migrations.
- Ainda falta adapter de persistência conectado ao Desktop.
- Ainda falta validar o schema em uma versão MariaDB definitiva escolhida para empacotamento.
- Ainda falta o instalador provisionar o MariaDB automaticamente.

### 4.7 Licenciamento

Concluído:

- Pacote `packages/licensing` criado.
- Conceito de Machine ID.
- Conceito de cache local de licença.
- Separação entre licenciamento e core operacional.
- Licença proprietária formal no repositório.
- Nome do proprietário definido: Jeferson dos Santos Paula.

Valor entregue:

- O produto está juridicamente e tecnicamente orientado como software privado.
- A arquitetura já impede que a licença vire dependência interna do core transacional.

Limite atual:

- Ainda falta endpoint real no Central para ativação.
- Ainda falta bloqueio remoto real.
- Ainda falta tolerância offline parametrizada.
- Ainda falta assinatura/verificação criptográfica robusta da licença.
- Ainda falta rotina comercial de cobrança e renovação.

### 4.8 Documentação arquitetural

Concluído:

- `docs/architecture/ETAPA_1.md`.
- `docs/architecture/ETAPA_2.md`.
- `docs/architecture/MODULE_BOUNDARIES.md`.
- `docs/architecture/DESKTOP_DATABASE_INSTALLER.md`.
- README principal com visão técnica resumida.
- Este README executivo.

Valor entregue:

- O projeto possui decisões registradas.
- Evita retrabalho e mudança silenciosa de direção.
- Ajuda a manter a arquitetura modular e protegida.

## 5. O que está tecnicamente pronto

Está pronto para continuidade de desenvolvimento:

- Repositório remoto e histórico de commits.
- Monorepo TypeScript.
- Workspaces npm.
- Desktop renderizando primeira experiência operacional.
- Central Web inicial.
- Pacotes de domínio, aplicação, banco, backup, licenciamento, portas de integração e skins.
- Regra de ledger imutável desenhada e parcialmente implementada.
- Schema MariaDB base preparado para Etapas 1 e 2.
- Typecheck geral passando.

## 6. O que ainda não está pronto para produção

Ainda não está pronto para cliente final:

- Instalação automatizada do MariaDB pelo instalador do Desktop.
- Migrations versionadas e aplicadas automaticamente.
- Persistência real do painel operacional no MariaDB.
- Fechamento de conta da criança.
- Controle de caixa.
- Pagamento local.
- Emissão fiscal.
- Editor de Cupom & Etiquetas.
- Configuração SEFAZ/NFC-e.
- Contingência automática para séries 900/901.
- Fila de NFC-e offline para envio posterior.
- Impressão térmica ESC/POS.
- Autenticação real de operador.
- Controle de permissões.
- Cadastro completo de produtos, responsáveis e crianças via UI.
- Backup automático funcional.
- Restore validado.
- Central Web operacional.
- Licenciamento online real.
- Build instalável Windows final.
- Testes automatizados completos.
- Auditoria de segurança.
- Política LGPD operacional.
- Manual do usuário e manual técnico.

## 7. Próximas entregas recomendadas

### 7.1 Etapa 3 - Caixa, fechamento e persistência real

Prioridade: muito alta.

Objetivo:

- Transformar o painel da Etapa 2 em operação persistida no MariaDB.
- Fechar a conta de uma criança/sessão.
- Registrar forma de pagamento.
- Criar lançamento financeiro definitivo.
- Encerrar sessão com rastreabilidade.

Entregas esperadas:

- Adapter MariaDB para `StockMovement`.
- Adapter MariaDB para `StockBalance`.
- Adapter MariaDB para `FinanceLedgerEntry`.
- Repositório de responsáveis/crianças.
- Repositório de sessões.
- Repositório de linhas de cobrança.
- Tela de fechamento de conta.
- Cálculo final de tempo, adicionais e produtos.
- Registro de pagamento em dinheiro, cartão, PIX manual e interno.
- Histórico da sessão encerrada.
- Auditoria mínima do operador.

Critério de aceite:

- Abrir sessão, adicionar produto, encerrar conta e consultar tudo novamente após reiniciar o app.

### 7.2 Etapa 4 - Módulo fiscal obrigatório

Prioridade: muito alta.

Objetivo:

- Implementar o módulo fiscal brasileiro como capacidade obrigatória do produto.
- Atender pequenos comerciantes que precisam operar com cupom não fiscal, NFC-e, SEFAZ e contingência enquanto regularizam a situação cadastral.
- Entregar experiência visual profissional e fiel ao cupom fiscal real.

Entregas esperadas:

- Menu `Configurações -> Editor de Cupom & Etiquetas`.
- Modal grande com layout dividido: formulário à esquerda e preview térmico à direita.
- Abas de configuração: Cabeçalho, Itens, Rodapé e Avançado.
- Preview em tempo real simulando papel 58mm e 80mm.
- Campos de cabeçalho: nome fantasia, razão social, CNPJ, inscrição estadual, endereço, CEP, telefone e logo.
- Botão de busca automática de CNPJ por API.
- Autopreenchimento de endereço por CEP.
- Configuração de colunas de item: código, descrição, quantidade, valor unitário e total.
- Opções de largura, fonte, negrito, código de barras, lote e validade.
- Rodapé com agradecimento, texto adicional, QR Code e chave de acesso quando for NFC-e.
- Teste de impressão.
- Menu `Configurações -> Fiscal -> SEFAZ / NFC-e`.
- Upload de certificado digital A1 `.pfx` e senha.
- Campos CSC, série, ambiente, razão social, CNPJ e inscrição estadual.
- Toggle `Forçar Modo Contingência`.
- Status de credenciamento: Credenciado, Pendente ou Irregular.
- Suporte especial para séries 900 e 901.
- Contingência automática quando a série for 900 ou 901.
- Geração de NFC-e offline ao finalizar venda em contingência.
- Impressão com aviso claro de `EMITIDO EM CONTINGÊNCIA`.
- Armazenamento de notas para envio em lote posterior.
- Saída automática de contingência quando o usuário alterar a série para 1 após regularização.
- Alertas visíveis enquanto o sistema estiver em contingência.
- Modal de finalização de venda com botão verde `Imprimir Cupom Não Fiscal`.
- Modal de finalização de venda com botão azul `Emitir NFC-e`.
- QR Code e chave de acesso na impressão NFC-e.
- Suporte a impressoras térmicas via ESC/POS raw print.

Stack UI/UX solicitada:

- Tauri 2.0.
- Svelte 5.
- Tailwind CSS v3.4+.
- shadcn/ui.
- Dark mode predominante.
- Ícones Lucide.
- Alta usabilidade.

Critério de aceite:

- Usuário configura empresa, certificado, série e layout do cupom.
- Usuário finaliza uma venda e escolhe entre cupom não fiscal e NFC-e.
- Em série 900/901, o sistema entra em contingência, imprime aviso correto e guarda a nota para envio posterior.
- Preview do cupom reflete as alterações em tempo real.
- Impressão térmica funciona via ESC/POS mesmo com driver genérico.

Documento técnico de referência: `docs/architecture/FISCAL_MODULE.md`.

### 7.3 Etapa 5 - Cadastro operacional e fiscal mínimo

Prioridade: alta.

Objetivo:

- Permitir que o cliente configure a operação real sem editar banco ou arquivo.
- Preparar dados comerciais e fiscais usados pelo módulo fiscal.

Entregas esperadas:

- Cadastro de produtos.
- Cadastro de categorias.
- Cadastro de brinquedos/carrinhos/ativos.
- Cadastro de preços por tempo.
- Cadastro de responsáveis e crianças.
- Cadastro de usuários/operadores.
- Controle de unidades operacionais.
- Estoque inicial e ajuste manual com ledger.
- Campos fiscais por produto quando aplicável.
- Dados fiscais da empresa usados por cupom, NFC-e e SEFAZ.

Critério de aceite:

- Loja consegue configurar produtos, brinquedos, preços e parâmetros fiscais pela interface.

### 7.4 Etapa 6 - Estoque completo e compras

Prioridade: alta.

Objetivo:

- Fechar a operação de bomboniere e consumo com rastreabilidade de compra, venda e saldo.

Entregas esperadas:

- Entrada de compras.
- Ajuste de estoque.
- Baixa por venda.
- Reversão controlada.
- Alertas de estoque mínimo.
- Relatório de movimentação.
- Custo médio ou regra de custo definida.

Critério de aceite:

- Comprar produto, vender na sessão, baixar estoque e visualizar saldo correto.

### 7.5 Etapa 7 - Licenciamento real e Central Web

Prioridade: alta.

Objetivo:

- Tornar o ToyGo! comercialmente controlável pelo proprietário.

Entregas esperadas:

- API de ativação.
- Cadastro de clientes no Central.
- Geração e validação de licença.
- Bloqueio remoto.
- Período de tolerância offline.
- PIX/Boleto para licença.
- Painel do proprietário.
- Log de ativações.

Critério de aceite:

- Instância Desktop ativa com Machine ID, opera offline dentro da tolerância e bloqueia quando a licença expira conforme regra definida.

### 7.6 Etapa 8 - Instalador Windows e MariaDB embarcado

Prioridade: muito alta antes de produção.

Objetivo:

- Entregar o Desktop como instalador real para cliente.

Entregas esperadas:

- Build Electron para Windows.
- Provisionamento MariaDB local.
- Criação de usuário técnico do banco.
- Health check local.
- Start automático do serviço.
- Backup antes de upgrade.
- Bloqueio de downgrade destrutivo.
- Wizard inicial de configuração.

Critério de aceite:

- Instalar em máquina limpa Windows e abrir o ToyGo! operacional sem instalar banco manualmente.

### 7.7 Etapa 9 - LGPD, waiver e segurança de dados

Prioridade: média/alta.

Objetivo:

- Proteger dados de crianças, responsáveis e consentimentos.

Entregas esperadas:

- Waiver digital.
- Registro de consentimento.
- Termos por unidade/cliente.
- Política de retenção.
- Exportação/anonimização quando aplicável.
- Auditoria de acesso a dados sensíveis.

Critério de aceite:

- Responsável assina termo e o sistema guarda evidência rastreável.

### 7.8 Etapa 10 - BI, relatórios e gestão

Prioridade: média.

Objetivo:

- Dar visão executiva ao dono da operação.

Entregas esperadas:

- Receita por período.
- Sessões por horário.
- Tempo médio de permanência.
- Produtos mais vendidos.
- Brinquedos mais usados.
- Estoque crítico.
- Ranking por unidade.
- Exportação de relatórios.

Critério de aceite:

- Dono consegue tomar decisão operacional com dados do ToyGo!.

### 7.9 Etapa 11 - Booking, festas e membership

Prioridade: futura.

Objetivo:

- Expandir receita além da operação avulsa.

Entregas esperadas:

- Reservas.
- Festas.
- Pacotes de horas.
- Planos recorrentes.
- Benefícios por cliente.
- Controle de uso de pacote.

Critério de aceite:

- Cliente compra pacote/plano e o saldo é consumido corretamente nas sessões.

### 7.10 Etapa 12 - Hardware e automação física

Prioridade: futura.

Objetivo:

- Conectar operação física ao sistema.

Entregas esperadas:

- RFID/NFC.
- Pulseiras.
- QR Code.
- Catracas.
- Impressora térmica.
- Leitor de código de barras.

Critério de aceite:

- Entrada, identificação ou consumo podem ser feitos por dispositivo físico integrado.

## 8. Riscos executivos atuais

### 8.1 Persistência ainda não conectada à UI

Risco: a Etapa 2 demonstra fluxo, mas ainda não grava a operação real no banco.

Mitigação: priorizar Etapa 3 com adapters MariaDB antes de aumentar escopo visual.

### 8.2 Instalador MariaDB ainda não implementado

Risco: sem instalador, a promessa offline-first ainda depende de ambiente técnico preparado.

Mitigação: criar trilha de empacotamento Windows logo após persistência básica.

### 8.3 Central Web ainda é placeholder

Risco: licenciamento comercial ainda não existe operacionalmente.

Mitigação: evoluir Central na etapa de licenciamento real, depois que Desktop tiver fluxo mínimo de caixa e persistência confiável.

### 8.4 Fiscal obrigatório ainda não implementado

Risco: cliente real no Brasil pode exigir cupom, NFC-e, contingência e impressão térmica antes de aceitar implantação comercial.

Mitigação: tratar o módulo fiscal como etapa obrigatória logo após caixa/persistência, mantendo-o fora do core e com adapter fiscal próprio.

### 8.5 Stack fiscal solicitada diverge da stack atual

Risco: o módulo fiscal foi especificado com Tauri 2.0 e Svelte 5, enquanto o Desktop atual está em Electron, Vite, React e Tailwind CSS.

Mitigação: decidir no início da etapa fiscal entre migrar o Desktop, criar superfície fiscal separada ou adaptar a UI mantendo Electron/React.

### 8.6 Node_modules já apresentou extração parcial

Risco: ambiente local Windows/armazenamento pode deixar pacotes incompletos.

Mitigação: manter validação com `npm run typecheck`, evitar confiar apenas em instalação parcial e registrar scripts de bootstrap limpos.

## 9. Recomendação executiva de prioridade

Ordem recomendada para continuar sem retrabalho:

1. Persistência MariaDB do painel operacional.
2. Fechamento de conta e caixa.
3. Módulo fiscal obrigatório: cupom, NFC-e, SEFAZ, contingência 900/901 e ESC/POS.
4. Cadastro operacional e fiscal mínimo.
5. Estoque completo de bomboniere.
6. Instalador Windows com MariaDB local.
7. Licenciamento real no Central.
8. Backup/restore.
9. LGPD/waiver.
10. BI, booking, membership e hardware.

Motivo: antes de expandir para módulos comerciais avançados, o ToyGo! precisa provar o ciclo operacional completo: abrir sessão, consumir, fechar, pagar, persistir, auditar e recuperar dados após reiniciar.

## 10. Critério para considerar MVP operacional

O ToyGo! pode ser considerado MVP operacional quando cumprir estes pontos:

- Instala em Windows sem configuração manual complexa.
- Provisiona MariaDB local automaticamente.
- Permite login de operador.
- Cadastra produtos, responsáveis, crianças e brinquedos.
- Abre sessão.
- Controla tempo.
- Adiciona consumo.
- Fecha conta.
- Registra pagamento.
- Baixa estoque.
- Registra ledger financeiro.
- Configura cupom e dados fiscais da empresa.
- Emite cupom não fiscal quando necessário.
- Emite ou prepara NFC-e conforme ambiente e credenciamento.
- Opera contingência 900/901 com aviso claro e fila de envio posterior.
- Imprime em térmica via ESC/POS.
- Mostra histórico.
- Faz backup local.
- Restaura backup em teste.
- Opera sem internet.
- Valida licença dentro de regra offline definida.

## 11. Conclusão

O ToyGo! está bem encaminhado tecnicamente. As decisões mais importantes já foram tomadas: produto proprietário, Desktop offline-first, MariaDB local, arquitetura modular, ledger imutável e separação entre core e módulos periféricos.

O que existe hoje é uma base consistente e uma primeira tela operacional. O próximo salto importante é transformar a demonstração operacional em fluxo real persistido, com fechamento de conta e caixa. Logo depois, o módulo fiscal obrigatório precisa entrar como prioridade de produto brasileiro, cobrindo cupom, NFC-e, SEFAZ, contingência e impressão térmica.

Recomendação final: continuar pela Etapa 3 e preparar a Etapa 4 fiscal como entrega obrigatória, sem abrir módulos avançados antes de fechar persistência, caixa, ciclo financeiro local e a trilha fiscal brasileira.