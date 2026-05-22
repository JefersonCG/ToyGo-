# Módulo fiscal - Editor de Cupom, NFC-e e SEFAZ

## Status

Este documento registra o módulo fiscal como requisito obrigatório do roadmap ToyGo!. Ele ainda não representa implementação concluída. A implementação deve ocorrer após o fluxo mínimo de checkout, caixa e persistência real no MariaDB estar funcional.

## Objetivo executivo

Entregar um módulo fiscal completo, profissional e fácil de usar para estabelecimentos brasileiros, especialmente pequenos comerciantes que ainda estão regularizando a situação cadastral e precisam operar com contingência, cupom não fiscal e preparação para NFC-e.

## Escopo obrigatório

O módulo fiscal deve cobrir quatro blocos principais:

- Editor de Cupom & Etiquetas.
- Configuração SEFAZ / NFC-e.
- Contingência automática para séries 900/901.
- Fluxo de impressão no PDV com ESC/POS.

## 1. Editor de Cupom & Etiquetas

Localização prevista: `Configurações -> Editor de Cupom & Etiquetas`.

O editor deve abrir em modal grande com layout dividido:

- Lado esquerdo, 40%: formulário de configuração.
- Lado direito, 60%: preview em tempo real do cupom térmico.

O formulário deve ter abas:

- Cabeçalho.
- Itens.
- Rodapé.
- Avançado.

O preview deve simular papel térmico 58mm e 80mm, atualizando automaticamente conforme as alterações. O visual precisa ser fiel a cupom fiscal eletrônico SAT/NFC-e real, sem parecer apenas um card genérico de interface.

### Cabeçalho

Campos obrigatórios:

- Nome fantasia.
- Razão social.
- CNPJ.
- Botão `Buscar Automático` por API de CNPJ.
- Inscrição estadual.
- Endereço completo.
- CEP com autopreenchimento.
- Telefone.
- Logo da empresa.

### Itens

Configurações obrigatórias:

- Exibir código.
- Exibir descrição.
- Exibir quantidade.
- Exibir valor unitário.
- Exibir total.
- Configurar largura de colunas.
- Configurar fonte.
- Configurar negrito.
- Exibir código de barras do item.
- Exibir lote.
- Exibir validade.

### Rodapé

Campos e opções obrigatórias:

- Mensagem de agradecimento.
- Texto adicional.
- Exibir QR Code.
- Exibir chave de acesso.
- Restringir QR Code e chave de acesso a impressões NFC-e quando aplicável.

### Avançado

Opções obrigatórias:

- Tamanho do papel: 58mm ou 80mm.
- Teste de impressão.
- Ajustes finos de densidade visual para impressora térmica.
- Compatibilidade com impressão não fiscal e NFC-e.

## 2. Configuração SEFAZ / NFC-e

Localização prevista: `Configurações -> Fiscal -> SEFAZ / NFC-e`.

A tela deve ter visual moderno, dark mode predominante, Tailwind CSS e shadcn/ui conforme diretriz visual do módulo fiscal.

Campos obrigatórios:

- Upload do certificado digital A1 `.pfx`.
- Senha do certificado.
- CSC, Código de Segurança do Contribuinte.
- Série atual.
- Suporte especial para séries 900 e 901.
- Ambiente: Homologação ou Produção.
- Razão social.
- CNPJ.
- Inscrição estadual.
- Toggle `Forçar Modo Contingência`.
- Status de credenciamento: Credenciado, Pendente ou Irregular.

## 3. Contingência para séries 900/901

Quando a série estiver configurada como 900 ou 901, o ToyGo! deve operar automaticamente em modo contingência.

Comportamento obrigatório:

- Ativar modo contingência sem depender de ação adicional do operador.
- Finalizar venda gerando NFC-e offline.
- Imprimir cupom com aviso claro de `EMITIDO EM CONTINGÊNCIA`.
- Armazenar notas para envio em lote posterior.
- Mostrar alertas visíveis no PDV enquanto estiver em contingência.
- Permitir que o usuário altere a série para 1 após regularização do CNPJ.
- Sair automaticamente da contingência quando a série deixar de ser 900/901 e o modo for regularizado.

## 4. Fluxo de impressão no PDV

Ao finalizar uma venda, o ToyGo! deve mostrar tela ou modal com duas ações principais:

- Botão verde grande: `Imprimir Cupom Não Fiscal`.
- Botão azul grande: `Emitir NFC-e`.

Requisitos da NFC-e:

- Exibir QR Code.
- Exibir chave de acesso.
- Usar dados fiscais configurados.
- Respeitar ambiente de homologação ou produção.
- Respeitar modo contingência quando ativo.

Requisitos de impressão:

- Suporte total a impressoras térmicas.
- Impressão ESC/POS via raw print.
- Funcionamento mesmo com drivers genéricos.
- Compatibilidade com papel 58mm e 80mm.
- Teste de impressão nas configurações.

## 5. Stack UI/UX solicitada

Diretriz solicitada para este módulo:

- Tauri 2.0.
- Svelte 5.
- Tailwind CSS v3.4+.
- shadcn/ui.
- Dark mode predominante.
- Ícones Lucide.
- Alta usabilidade.

## 6. Impacto sobre a stack atual

O Desktop atual do ToyGo! foi iniciado em Electron, Vite, React e Tailwind CSS. A stack solicitada para o módulo fiscal é Tauri 2.0 e Svelte 5.

Antes da implementação, uma decisão técnica precisa ser tomada:

- Migrar o Desktop inteiro para Tauri/Svelte.
- Criar apenas o módulo fiscal como superfície separada em Tauri/Svelte.
- Manter Electron/React e adaptar a experiência visual, aceitando divergência da stack solicitada.

Recomendação atual: tratar Tauri/Svelte como requisito de produto para o módulo fiscal, mas executar uma etapa curta de decisão técnica antes de codificar para evitar retrabalho.

## 7. Fronteira arquitetural

O módulo fiscal não deve entrar dentro do core transacional. O core continua sem conhecer SEFAZ, certificado, NFC-e, SAT, TEF ou impressora.

Responsabilidades recomendadas:

- `packages/domain`: permanece com estoque, financeiro e invariantes puras.
- `packages/application`: orquestra checkout, financeiro e solicitação fiscal.
- `packages/integration-ports`: define contratos fiscais e de impressão.
- Adapter fiscal concreto: implementa NFC-e, contingência, fila e integração SEFAZ.
- App Desktop: oferece UI, configuração, preview e fluxo de impressão.

## 8. Persistência necessária

O schema fiscal ainda deve ser detalhado, mas precisa prever:

- Configurações fiscais por unidade.
- Certificado A1 armazenado com proteção adequada.
- Série e ambiente.
- CSC.
- Status de credenciamento.
- Configuração de layout de cupom.
- NFC-e emitidas.
- NFC-e em contingência.
- Fila de envio posterior.
- Logs de autorização, rejeição, cancelamento e inutilização quando aplicável.
- Histórico de impressão.

## 9. Critérios de aceite

O módulo fiscal será considerado pronto quando:

- O usuário configurar dados fiscais sem editar arquivo ou banco.
- O usuário personalizar cupom com preview em tempo real.
- O preview parecer cupom térmico real, em 58mm e 80mm.
- O PDV oferecer cupom não fiscal e NFC-e na finalização.
- A NFC-e usar certificado, CSC, série e ambiente configurados.
- Séries 900/901 ativarem contingência automaticamente.
- Cupom em contingência imprimir aviso correto.
- Notas em contingência ficarem armazenadas para envio posterior.
- Impressão ESC/POS funcionar em impressora térmica real.
- O core permanecer desacoplado do módulo fiscal.

## 10. Prioridade

Prioridade executiva: muito alta após persistência, checkout e caixa local.

Motivo: fiscal é requisito comercial relevante no Brasil e pode definir a viabilidade de implantação em clientes reais.