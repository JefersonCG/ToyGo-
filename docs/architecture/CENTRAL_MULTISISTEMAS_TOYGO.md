# ToyGo! na Central Multisistemas

Este documento transforma o levantamento de mercado em uma estrutura inicial de
produto para que o ToyGo! entre na Central Multisistemas sem perder identidade.

## Decisao

O ToyGo! deve seguir a mesma dinamica administrativa do MultiPlus+:

- cadastro de cliente, organizacao, unidade e instalacao;
- licenca por produto e modulo;
- cobranca centralizada;
- releases por produto;
- auditoria e Watchdog;
- backup e suporte assistido;
- comunicacao local -> Central por eventos resumidos;
- comandos remotos versionados, idempotentes e auditaveis.

O que muda e o dominio. MultiPlus+ gira em torno de PDV, estoque, caixa e
fiscal. ToyGo! gira em torno de visitante, responsavel, tempo de uso, item que
sai e retorna, zona, seguranca de retirada, festa, plano e venda cruzada.

## Linguagem operacional

| Termo ToyGo! | Uso no sistema |
|---|---|
| Unidade | Parque, quiosque, loja ou espaco fisico |
| Ambiente | Area fisica dentro da unidade |
| Zona | Area com capacidade, idade, regra de acesso ou risco proprio |
| Visitante | Crianca ou participante da experiencia |
| Responsavel | Adulto autorizado pela entrada e retirada |
| Sessao | Periodo de uso entre entrada e saida |
| Item locavel | Carrinho, brinquedo, locker, pulseira ou recurso que sai e retorna |
| Devolucao | Fechamento fisico com vistoria e apontamento de dano/manutencao |
| Oferta contextual | Venda cruzada apresentada conforme perfil, tempo, pacote ou vertical |

## Modulos iniciais

| Modulo | Estado inicial | Motivo |
|---|---|---|
| Unidades e ambientes | ativo | organiza shopping, parque, quiosque e multi-unidade |
| Recepcao diaria | ativo | check-in, check-out, fila e retirada segura |
| Aluguel de carrinhos | ativo | foco comercial inicial do ToyGo! |
| Sessoes de playground | ativo | foco comercial inicial junto aos carrinhos |
| Venda cruzada | ativo | aumenta ticket sem depender de modulos futuros |
| Estoque e produtos | ativo | lanches, meias, itens, acessorios e manutencao |
| Zonas e lotacao | reservado | necessario para playground e jump park |
| Waivers e LGPD | reservado | sensivel por envolver menores |
| Festas e reservas | reservado | alto valor, mas pode vir apos recepcao diaria |
| Memberships | reservado | recorrencia, banco de horas e planos |
| Jump park | reservado | mercado alvo de expansao |
| Integracao shopping | reservado | reporte de faturamento e fechamento |
| Dispositivos | reservado | QR, RFID, NFC, leitor, catraca e totens |
| Analytics | reservado | indicadores para dono/gerente e Central |

## Fluxo diario alvo

1. Abrir unidade.
2. Conferir operadores, caixa, banco local e licenca.
3. Conferir brinquedos/carrinhos disponiveis, em uso e em manutencao.
4. Abrir recepcao com atalhos grandes: entrada, devolucao, venda rapida e fila.
5. Na entrada, vincular responsavel, visitante, termo aplicavel e tempo/pacote.
6. Sugerir venda cruzada conforme contexto: meia, lanche, tempo extra, foto,
   locker, pacote familia ou plano.
7. Durante o uso, acompanhar tempo, zona, alertas e equipamentos fora do padrao.
8. Na devolucao, vistoriar item, registrar dano, excedente, consumo e pagamento.
9. Fechar caixa e gerar resumo operacional.
10. Sincronizar eventos resumidos com a Central quando houver conexao.

## Central Multisistemas

Na Central, o ToyGo! deve aparecer como produto proprio no seletor:

```text
Todos os produtos | MultiPlus+ | ToyGo!
```

Com ToyGo! selecionado, a navegacao recomendada e:

```text
Visao geral
Clientes
Unidades
Instalacoes
Licencas
Cobrancas
Watchdog
Releases
Backups
Auditoria

Operacao ToyGo!
  Recepcao
  Carrinhos
  Playground
  Venda cruzada
  Zonas
  Waivers
  Festas
  Memberships
  Dispositivos
  Relatorios
```

## Pareamento e ativacao

O ToyGo! nao se autorregistra na Central e a Central nao "descobre" sozinha
que uma instalacao do ToyGo! existe. O vinculo comeca sempre do lado humano,
contra uma licenca ja cadastrada com `product_code: toygo` — nao existe uma
chave de ativacao generica que sirva para qualquer produto da familia.

1. Empresa/organizacao e assinatura ja foram cadastradas na Central, com uma
   licenca especifica para `toygo` (mesma dinamica administrativa do
   MultiPlus+, ver secao "Decisao" acima).
2. Um administrador emite, no portal da Central, um codigo de pareamento
   **para essa organizacao e essa licenca ToyGo! especifica** — a Central ja
   sabe que produto e antes de qualquer coisa ser instalada. O codigo e
   curto, digitavel, expira em ate 15 minutos e aceita no maximo 5 tentativas
   erradas antes de precisar ser reemitido.
3. O codigo e colado na unidade ToyGo! sendo implantada. A instalacao gera
   **localmente** seu proprio par de chaves Ed25519 — a chave privada nunca
   sai da maquina nem trafega pela rede.
4. A instalacao envia o codigo, a chave publica e metadados minimos. A
   Central confere se o produto que esta pareando bate com o `product_code`
   da licenca associada aquele codigo (ToyGo! pareando com codigo de licenca
   MultiPlus+, por exemplo, falha fechado), alem de organizacao e status da
   licenca.
5. So entao a Central emite um Installation ID e uma credencial opaca
   rotativa, renovada periodicamente por prova de posse da chave privada
   (nunca a chave em si). A ativacao nao termina num clique — abre um ciclo
   continuo de heartbeat e rotacao de credencial.

Detalhe completo e diagrama de sequencia: [Integracao de
sistemas](https://github.com/JefersonCG/CENTRAL-MULTISISTEMA/blob/main/docs/architecture/SYSTEM_INTEGRATION.md)
e [fechamento da Fase 5](https://github.com/JefersonCG/CENTRAL-MULTISISTEMA/blob/main/docs/architecture/INSTALLATION_PAIRING_CLOSURE.md)
no repositorio da Central.

## Limites de dados

A Central pode receber indicadores agregados e eventos tecnicos:

- unidade online/offline;
- instalacao sem heartbeat;
- lotacao atual por zona;
- quantidade de sessoes abertas;
- carrinhos em uso, disponiveis ou em manutencao;
- reservas do dia em resumo;
- status de licenca e cobranca;
- eventos de dispositivo, banco local, sincronizacao e backup.

A Central nao deve receber por padrao o historico completo de criancas,
responsaveis, termos e consumo individual. Esses dados ficam no ambiente local,
com sincronizacao minima e autorizada quando houver finalidade clara.

## Criterios de aceite da estrutura

- O ToyGo! aparece por `product_code = "toygo"`.
- Todo modulo ToyGo! declara plano minimo, status, menu e permissoes.
- Carrinhos e playground funcionam como operacoes iniciais.
- Jump park e shopping ficam reservados sem bloquear o primeiro produto.
- Venda cruzada existe como modulo transversal do ToyGo!.
- Dados de menores sao minimizados na Central.
- O Desktop continua offline-first.
- A identidade visual continua ToyGo!, mas o fluxo administrativo segue a
  Central Multisistemas.

