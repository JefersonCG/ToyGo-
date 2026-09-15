# Integracao do ToyGo! com a Central MultiSistemas

Este arquivo descreve somente o limite de conexao do ToyGo! com a Central. A
arquitetura, o roadmap, as fases, os contratos e o dossie da plataforma ficam
exclusivamente no repositorio
[Central MultiSistemas](https://github.com/JefersonCG/CENTRAL-MULTISISTEMA).

## Identidade da integracao

| Campo | Valor |
|---|---|
| `product_code` | `toygo` |
| Marco da Central | M11 - ToyGo! |
| Fase da Central | Fase 11 - Integracao ToyGo! e expansao |
| Estrategia | Mesmo manifesto, SDK e protocolo usados pelo MultiPlus+ |
| Manifesto de referencia | `contracts/product-manifest/examples/toygo.json` na Central |
| Estado | Integrado ao contrato v1; adapter de runtime conectado ao Desktop |

## O que este repositorio implementa

- Configuracao da URL e do ambiente da Central.
- Adaptador SDK do contrato v1 no Desktop.
- Chave privada Ed25519 e credencial da instalacao em armazenamento seguro local.
- Outbox e fila offline de eventos permitidos.
- Heartbeat e saude tecnica do produto.
- Execucao local de comandos declarados no manifesto.
- Backup previo, aplicacao de release e rollback.
- Projecao local da licenca Central e politica de continuidade offline.

## O que permanece local

- Carrinhos, locacoes e playground.
- Visitantes, criancas e responsaveis.
- Waivers e consentimentos.
- Sessoes, entrada, saida, zonas e lotacao.
- Reservas, festas e memberships.
- Acesso, RFID, catracas e dispositivos.
- Ledgers de estoque e financeiro.
- Motor fiscal proprio quando aplicavel.
- MariaDB/SQLite e dados detalhados da operacao.

## Dados permitidos para a Central

- Identidade e versao da instalacao.
- Heartbeat e verificacoes tecnicas classificadas.
- Eventos previstos no manifesto e no contrato registrado.
- Metricas agregadas autorizadas de capacidade e disponibilidade.
- Estado agregado de backup, release, sincronizacao e licenca.
- ACK estruturado de comandos executados localmente.

Dados completos de visitantes, criancas, responsaveis, sessoes ou consumo nao
sao telemetria. Qualquer agregado exige finalidade, minimizacao, retencao, RBAC
e auditoria.

## Contratos consumidos

- Product Manifest.
- OpenAPI v1.
- Envelope de eventos.
- Envelope de comandos.
- Descoberta e pareamento.
- SDK e suite de conformidade.

As versoes canônicas desses contratos pertencem ao repositorio da Central. Este
repositorio nao deve manter copias completas ou forks locais desses artefatos.

## Invariantes

- A inclusao do ToyGo! nao adiciona condicional ao core da Central.
- A conexao nasce do produto por HTTPS/WebSocket outbound.
- A operacao e a saida segura continuam locais sem internet.
- Comandos exigem allowlist, TTL, idempotencia, lease e ACK.
- Dados de menores recebem protecao e retencao especificas.
- Segredos nunca aparecem em interface ou log.
- Toda mudanca sensivel gera auditoria.

O ToyGo! nao possui endpoint proprio de licenciamento. O codigo digitado no
Desktop e um codigo de pareamento emitido para uma licenca `toygo` na Central;
o Desktop guarda somente a credencial opaca e a chave privada local protegidas
pelo armazenamento seguro do sistema operacional.

## Referencias autoritativas

- [README da Central](https://github.com/JefersonCG/CENTRAL-MULTISISTEMA/blob/main/README.md)
- [Dossie da Central](https://github.com/JefersonCG/CENTRAL-MULTISISTEMA/blob/main/Documento%20CentralMultisistema.md)
- [Fases da Central](https://github.com/JefersonCG/CENTRAL-MULTISISTEMA/blob/main/PHASES.md)
- [Roadmap da Central](https://github.com/JefersonCG/CENTRAL-MULTISISTEMA/blob/main/ROADMAP.md)
- [Integracao de sistemas](https://github.com/JefersonCG/CENTRAL-MULTISISTEMA/blob/main/docs/architecture/SYSTEM_INTEGRATION.md)
