# O_Batedor no ToyGo! — preflight do instalador

## Status

Este documento registra o `O_Batedor` como requisito obrigatório do instalador do ToyGo! Desktop. A implementação dedicada está em `scripts/windows/o_batedor.ps1`, com o mesmo contrato de segurança validado no MultiPlus+: DryRun por padrão, mutação explícita, diagnóstico JSON/TXT e handoff consumível pelo instalador.

## Por que reaproveitar o O_Batedor em vez de criar um instalador novo do zero

O ToyGo! e o MultiPlus+ compartilham o mesmo perfil de implantação: aplicação Desktop Windows, instalada em máquina de comerciante/operador sem TI dedicado, com persistência local (MariaDB/MySQL) e necessidade de diagnóstico reproduzível quando o suporte remoto precisa investigar um ambiente. O contrato de segurança do O_Batedor já foi pensado, documentado e exercitado para esse exato cenário — recriar isso do zero para o ToyGo! reintroduziria riscos (hardening incorreto, regras de firewall abertas demais, bloqueio indevido de Windows Update) que o MultiPlus+ já endereçou.

## Decisão adotada

Foi adotado um fork dedicado do ToyGo em `scripts/windows/o_batedor.ps1`,
porque os dois repositórios não compartilham um pacote executável. O fork
mantém o mesmo contrato de segurança; mudanças devem ser portadas e revisadas
nos dois produtos.

O script canônico do MultiPlus+ é específico daquele produto. O ToyGo usa um
fork dedicado em `scripts/windows/o_batedor.ps1`, com pasta, logs, portas e
handoff próprios. O contrato de segurança permanece equivalente e qualquer
mudança deve ser revisada nos dois produtos.


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
