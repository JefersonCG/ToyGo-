# O_Batedor no ToyGo! — requisito de instalação (ainda não implementado)

## Status

Este documento registra o `O_Batedor` como requisito obrigatório do instalador do ToyGo! Desktop, replicando o contrato já validado em produção no MultiPlus+ (`scripts/windows/o_batedor.ps1`, detalhado em `docs/architecture/O_BATEDOR_DOSSIE.md` e `docs/roadmap/OBatedor.md` daquele repositório). **Nenhuma linha de código do Batedor existe hoje no ToyGo!.** Este documento é o requisito de aceite, não a implementação.

## Por que reaproveitar o O_Batedor em vez de criar um instalador novo do zero

O ToyGo! e o MultiPlus+ compartilham o mesmo perfil de implantação: aplicação Desktop Windows, instalada em máquina de comerciante/operador sem TI dedicado, com persistência local (MariaDB/MySQL) e necessidade de diagnóstico reproduzível quando o suporte remoto precisa investigar um ambiente. O contrato de segurança do O_Batedor já foi pensado, documentado e exercitado para esse exato cenário — recriar isso do zero para o ToyGo! reintroduziria riscos (hardening incorreto, regras de firewall abertas demais, bloqueio indevido de Windows Update) que o MultiPlus+ já endereçou.

## O que precisa ser decidido antes de codificar

O script canônico do MultiPlus+ hoje é específico daquele produto: nome fixo `MultiPlus`, pasta `C:\MultiPlus`, log em `%LOCALAPPDATA%\MultiPlus\Logs`, regras de firewall nomeadas para `8080/TCP` (API local) e `3306/TCP` (MariaDB). Antes de "colocar o Batedor no ToyGo!", uma destas rotas precisa ser escolhida — e isso é uma decisão de arquitetura, não um detalhe de implementação:

1. **Generalizar o script existente** (parametrizar nome do produto, pasta, portas) para que `scripts/windows/o_batedor.ps1` do MultiPlus+ vire um utilitário compartilhado entre os dois produtos, versionado num só lugar (evita duas cópias divergindo com o tempo; exige decidir onde esse compartilhado mora — um repositório/pacote comum, não um fork).
2. **Fork dedicado para o ToyGo!**, com o mesmo contrato de segurança e as mesmas fases, mas nome, pasta e portas próprias do ToyGo! (mais simples de começar, risco de divergência entre os dois scripts ao longo do tempo se não houver disciplina de manter os contratos sincronizados).

Recomendação atual: opção 1 (generalizar), porque o contrato de segurança (DryRun por padrão, `-AllowMutation` explícito, preservação de Defender/UAC/Firewall global/Windows Update, sem encerrar processos alheios, sem desativar USB) é exatamente o mesmo nos dois produtos — só os parâmetros de produto mudam. Isso também evita o problema clássico de "consertei um bug de segurança no Batedor do MultiPlus+ e esqueci de replicar no do ToyGo!".

## Contrato de segurança (não muda entre produtos)

Idêntico ao já documentado no MultiPlus+ — reafirmado aqui para que a implementação do ToyGo! não regrida nenhuma dessas garantias:

- A execução inicia em `DryRun`; mudar o host exige `-AllowMutation` explícito e privilégio administrativo.
- `AGRESSIVO` e `COMPLIANCE` são perfis de governança; ambos preservam Defender, UAC, Firewall global e Windows Update.
- Regras locais do produto ficam limitadas às portas do próprio produto, perfis `Domain,Private` e `LocalSubnet`, só quando explicitamente autorizadas.
- Windows Update, processos fora de uma allowlist e USB são **auditados**, nunca bloqueados/encerrados/desativados globalmente pelo Batedor.
- O Batedor não é mecanismo de evasão de antivírus, não esconde sua execução e não assina payloads como se fossem do produto.
- Cada fase escreve status em console, TXT e JSON; falhas não fatais entram em `errors`; código de saída diferente de zero sinaliza erro registrado.

## Artefatos esperados (mesmo formato do MultiPlus+, caminho adaptado ao produto)

- JSON de diagnóstico: `%TEMP%\diagnostico_ambiente_YYYYMMDD_HHMMSS.json`.
- Log TXT: `%LOCALAPPDATA%\ToyGo\Logs\O_Batedor_YYYYMMDD_HHMMSS.txt` (fallback em `%TEMP%\ToyGo\Logs\` quando o perfil local não permitir criar a pasta).
- O JSON é artefato de diagnóstico e auditoria — não significa que o banco foi provisionado, que uma NFC-e foi autorizada ou que o ambiente passou por homologação estadual.

## Critérios de aceite

- Decisão tomada e registrada (script compartilhado vs. fork dedicado) antes de qualquer código ser escrito.
- Todas as cláusulas do contrato de segurança acima preservadas, sem exceção, na primeira versão.
- DryRun funcional e auditável antes de qualquer mutação ser sequer proposta.
- Handoff (JSON + TXT) gerado em formato consumível pelo instalador do ToyGo! Desktop e pelo suporte, do mesmo jeito que já acontece no MultiPlus+.
- **Não marcar esta etapa como concluída só porque o DryRun terminou com código 0** — mesma ressalva que já vale para o MultiPlus+.

## Prioridade

Depende da definição do instalador do ToyGo! Desktop (ainda não iniciado) e da decisão de stack registrada em `FISCAL_MODULE.md` (Tauri/Svelte vs. manter Electron/React), já que o formato de empacotamento final influencia como o Batedor se acopla ao instalador.
