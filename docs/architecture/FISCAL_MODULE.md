# Módulo fiscal - Editor de Cupom, NFC-e e SEFAZ

## Status

Este documento registra o módulo fiscal como requisito obrigatório do roadmap ToyGo!. Ele ainda não representa implementação concluída. A implementação deve ocorrer após o fluxo mínimo de checkout, caixa e persistência real no MariaDB estar funcional.

## Fronteira não negociável com o fechamento de conta

O módulo fiscal é **anexado depois** do fechamento de conta/sessão, nunca uma
condição para ele — mesmo padrão já comprovado em produção no MultiPlus+
(`apps/pdv-server`, coberto por `test_sale_without_fiscal.py`). Concretamente:

- Fechar sessão, registrar pagamento e emitir comprovante não fiscal
  funcionam com **zero configuração fiscal cadastrada** — sem CNPJ, sem
  certificado, sem SEFAZ configurada.
- O serviço/rota que fecha a sessão não importa nada de
  `integration-ports`/fiscal nem falha se o fiscal estiver ausente ou mal
  configurado.
- Documentos fiscais (não fiscal impresso, NFC-e autorizada, NFC-e em
  contingência) têm status próprio, anexado à sessão já fechada — nunca
  bloqueiam o fechamento em si.
- Critério de aceite obrigatório desta etapa: um teste automatizado precisa
  provar que sessão fecha e emite comprovante com o fiscal totalmente
  desativado, antes de qualquer PR desta etapa ser aceito.

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

- Origem do certificado: A1 (`.pfx` em arquivo) ou A3 (token/HSM via PKCS#11) — ver detalhamento na seção "Correções de conformidade SEFAZ-RJ" abaixo.
- Upload do certificado digital A1 `.pfx`, quando a origem for A1.
- Módulo PKCS#11, slot, rótulo da chave e PIN protegido, quando a origem for A3.
- Senha do certificado ou PIN do token, nunca persistidos em texto puro.
- CSC, Código de Segurança do Contribuinte.
- Série atual.
- Suporte especial para séries 900 e 901.
- Ambiente: Homologação ou Produção.
- Razão social.
- CNPJ.
- Inscrição estadual.
- Toggle `Forçar Modo Contingência`.
- Status de credenciamento: Credenciado, Pendente ou Irregular.

Tela separada de matriz tributária por NCM (mesmo papel de `PUT /fiscal/ncm-rules/{ncm}` no MultiPlus+): CFOP, origem, CSOSN, CST de PIS/COFINS, alíquota de FCP (0% a 4%, conforme a UF) e alíquota aproximada de IBPT para o disclosure da Lei 12.741/2012 — ver "Correções de conformidade SEFAZ-RJ" abaixo.

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

## 3.1 Correções de conformidade SEFAZ-RJ (requisito, mesmo padrão já validado no MultiPlus+)

Registrado agora, antes de existir código fiscal no ToyGo!, para que a implementação da Etapa 4 já nasça sem as 4 lacunas que a auditoria encontrou e fechou no MultiPlus+ (`apps/pdv-server`, `services/fiscal.py`, `api/v1/routes/fiscal.py`, cobertas por teste automatizado — ver `docs/architecture/FISCAL_MODULE.md` do MultiPlus+ para o código de referência). Nenhum destes itens tem ainda uma linha de código no ToyGo!; são requisitos de aceite da Etapa 4, não implementação concluída.

1. **Cálculo de FCP por NCM** (Resolução SEFAZ-RJ 720/14): a matriz tributária por NCM (seção 2 acima) carrega uma alíquota de FCP (0% a 4%). Quando o produto tiver FCP aplicável, o item declara `ICMSSN900` com `vBCFCP`/`pFCP`/`vFCP`; quando não tiver, mantém o grupo `ICMSSN102` normal do Simples Nacional. O total do documento reflete a soma real por item, nunca um valor fixo. FCP-ST (produtos com substituição tributária) fica fora de escopo nesta etapa.
2. **Certificado A3 (token/HSM via PKCS#11), além do A1**: a tela de SEFAZ/NFC-e (seção 2) precisa aceitar as duas origens de certificado. Com A3, a chave privada nunca é exportada nem gravada em disco — a assinatura XMLDSig da NFC-e e dos eventos de cancelamento acontece dentro do próprio token. **Limite a documentar desde já**: o canal de rede (mTLS) com a SEFAZ normalmente exige a chave privada em arquivo, o que um token A3 não permite por design; a implementação deve falhar de forma explícita nesse caso (nunca tentar exportar a chave), orientando o uso de um certificado A1 auxiliar só para o transporte até existir um proxy TLS compatível com PKCS#11.
3. **Tributos aproximados — Lei 12.741/2012**: a mesma matriz por NCM carrega uma alíquota aproximada de IBPT. O valor deve aparecer tanto na NFC-e (texto complementar e impressão) quanto no cupom não fiscal, calculado de forma *best-effort* por item — nunca bloquear a emissão só porque um NCM não tem a alíquota cadastrada, já que a lei pede um valor aproximado, não uma apuração exata.
4. **Prazo de retransmissão da contingência (MOC 7.0) e retenção manual do gerente**: duas coisas distintas, que não podem ser confundidas na implementação.
   - **Prazo legal (obrigação, não configurável pelo operador)**: toda NFC-e emitida em contingência (série 900/901) carrega um prazo de retransmissão à SEFAZ igual ao fim do "primeiro dia útil subsequente" à emissão — pulando sábados, domingos e feriados. Feriados devem ser cadastráveis (municipais/estaduais variam por UF), não hardcoded como só sábado/domingo. Cada nota em fila deve expor esse prazo e um contador de notas vencidas deve existir em algum painel de diagnóstico do fiscal, para dar visibilidade operacional antes que vire problema.
   - **Retenção manual (decisão operacional do gerente, complementar ao prazo legal)**: a tela de Configuração SEFAZ / NFC-e (seção 2 acima) deve ganhar dois controles adicionais:
     - Um toggle `Reter retransmissão manualmente` — quando ligado, bloqueia novas tentativas de transmissão da fila até ser desligado.
     - Um campo de data/hora `Liberar retransmissão a partir de` — quando preenchido, bloqueia novas tentativas até esse instante, mesmo com o toggle desligado.
     - Uma tentativa de transmissão bloqueada por qualquer um dos dois não deve mudar o status da nota nem apagar a tentativa: precisa gerar um evento auditável de bloqueio, do mesmo jeito que qualquer outra tentativa de transmissão.
     - O toggle e a data/hora **não alteram o prazo legal** acima — só decidem quando o próprio sistema deve, na prática, tentar transmitir. Se a retenção manual ultrapassar o prazo legal, isso deve continuar visível no contador de notas vencidas, nunca escondido.

**Nota de arquitetura — hoje backend único, esquema pronto para crescer**: o ToyGo! hoje é um único processo Desktop por unidade (`packages/domain` + `packages/application` + `packages/integration-ports` + adapter, tudo local), sem um backend de rede compartilhado por vários terminais como o "Servidor PDV" do MultiPlus+. Isso é verdade hoje e não deve ser fingido diferente. Mas o produto vai evoluir para múltiplos terminais por unidade — por isso o item 4 acima (prazo + retenção manual) e toda a configuração fiscal já devem ser desenhados vivendo atrás de `packages/integration-ports`/adapter, nunca hardcoded no processo Desktop de forma que presuma "sou o único terminal". Ver `docs/architecture/MODULE_BOUNDARIES.md`, seção "Servidor ToyGo! (evolução futura)", para o esquema completo de como crescer disso para um backend único compartilhado por loja sem reescrever o core — a mesma lição já validada em produção no MultiPlus+: um backend compartilhado por unidade resolve isso sozinho, sem precisar de descoberta de máquinas na rede local (mDNS/broadcast) nem de um protocolo de envio de configuração entre processos independentes.

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

- Configurações fiscais por unidade, incluindo origem do certificado (A1 ou A3), retenção manual da retransmissão (toggle e data/hora) e feriados cadastrados para o cálculo do prazo legal.
- Certificado A1 armazenado com proteção adequada, ou coordenadas do token A3 (módulo PKCS#11, slot, rótulo, PIN protegido) — nunca a chave privada do A3, que não é exportável.
- Série e ambiente.
- CSC.
- Status de credenciamento.
- Configuração de layout de cupom.
- Matriz tributária por NCM: CFOP, origem, CSOSN, CST de PIS/COFINS, alíquota de FCP e alíquota aproximada de IBPT.
- NFC-e emitidas.
- NFC-e em contingência, com prazo legal de retransmissão e valor aproximado de tributos gravados por nota.
- Fila de envio posterior.
- Logs de autorização, rejeição, cancelamento e inutilização quando aplicável.
- Histórico de impressão.

## 9. Critérios de aceite

O módulo fiscal será considerado pronto quando:

- O usuário configurar dados fiscais sem editar arquivo ou banco.
- O usuário personalizar cupom com preview em tempo real.
- O preview parecer cupom térmico real, em 58mm e 80mm.
- O PDV oferecer cupom não fiscal e NFC-e na finalização.
- A NFC-e usar certificado (A1 ou A3), CSC, série e ambiente configurados.
- Séries 900/901 ativarem contingência automaticamente.
- Cupom em contingência imprimir aviso correto.
- Notas em contingência ficarem armazenadas para envio posterior.
- FCP for calculado por NCM e refletido no total do documento, sem valor fixo.
- Tributos aproximados (Lei 12.741/2012) aparecerem na NFC-e e no cupom não fiscal, de forma best-effort.
- Cada nota em contingência expuser seu prazo legal de retransmissão (MOC 7.0) e existir um contador de notas vencidas visível.
- O gerente conseguir reter/liberar manualmente a retransmissão (toggle e data/hora), sem alterar o prazo legal nem apagar tentativas bloqueadas.
- Impressão ESC/POS funcionar em impressora térmica real.
- O core permanecer desacoplado do módulo fiscal.

## 10. Prioridade

Prioridade executiva: muito alta após persistência, checkout e caixa local.

Motivo: fiscal é requisito comercial relevante no Brasil e pode definir a viabilidade de implantação em clientes reais.