# ToyGo! - levantamento operacional de mercado

Levantamento inicial para orientar o ToyGo! dentro da Central Multisistemas.
Consulta feita em 2026-09-03 a partir de operacoes e softwares de playground,
espacos kids, carrinhos eletricos e trampoline/jump parks.

## Sinais de mercado

1. O mercado exige operacao rapida de recepcao.
   Sistemas do setor destacam check-in, check-out, pulseiras, QR Code, totens e
   controle visual de capacidade. Isso confirma que a primeira tela do ToyGo!
   deve priorizar pessoas dentro da unidade, tempo restante, pendencias de
   retirada e alertas de lotacao.

2. Carrinhos eletricos e playgrounds precisam ser tratados como operacoes irmas.
   O carrinho sai, retorna, passa por vistoria e pode gerar manutencao. O
   playground controla sessao por tempo, zona e responsavel. O ToyGo! deve usar
   um mesmo contrato operacional para entrada, saida, devolucao, consumo e
   fechamento, com detalhes por vertical.

3. Festa, reserva e grupos escolares aumentam ticket e complexidade.
   O fluxo precisa suportar agenda, sala/ambiente, pacote, sinal, lista de
   convidados, alergias, acompanhantes, responsaveis e consumo adicional.

4. Venda cruzada e recorrencia sao parte do produto, nao apenas um extra.
   O setor vende meias antiderrapantes, lanches, combos, presentes, fotos,
   lockers, tempo adicional, pacotes de festa, planos mensais, banco de horas e
   vouchers. A venda cruzada deve depender do contexto da operacao.

5. Multi-unidade e shopping pedem governanca central.
   Operadores precisam enxergar faturamento por unidade, integracao com shopping,
   permissoes por unidade, relatorios e status em tempo real. A Central deve
   consolidar metadados e indicadores, sem virar o banco operacional completo.

6. Jump parks ampliam o mesmo nucleo.
   Trampoline parks trabalham com sessoes por horario, capacidade, regras por
   idade, meias obrigatorias ou recomendadas, compra antecipada, festas e
   atracoes variadas. A estrutura do ToyGo! deve reservar modulos para jump park
   desde o inicio, mesmo que a primeira entrega foque em carrinhos e playground.

## Verticais iniciais

| Vertical | Fluxo central | Necessidades do sistema |
|---|---|---|
| Carrinhos eletricos | retirar -> usar -> retornar -> vistoriar -> fechar | controle por tempo ou corrida, equipamento, bateria, dano, manutencao, caixa e relatorio por item |
| Playground indoor | check-in -> brincar -> consumir -> check-out | responsavel, crianca, termo, pulseira, tempo, zona, lotacao, retirada segura |
| Quiosque em shopping | vender -> controlar fila -> reportar -> fechar caixa | multiplos operadores, integracao de faturamento do shopping, fiscal, recibos e conciliacao |
| Festas e eventos | reservar -> sinal -> preparar -> receber convidados -> consumir -> encerrar | calendario, sala, pacote, convidados, adicionais, contrato e pagamento |
| Jump park | vender sessao -> validar regra -> controlar acesso -> acompanhar lotacao -> encerrar | horarios, capacidade por atracao/zona, regras por idade, meias, grupos e eventos |

## Venda cruzada por contexto

| Contexto | Ofertas recomendadas |
|---|---|
| Entrada de playground | meia, pulseira extra, tempo adicional, combo lanche, locker |
| Check-out com tempo excedido | minutos excedentes, pacote de horas, assinatura |
| Carrinho eletrico | foto, corrida extra, segundo carrinho, acessorio, pacote familia |
| Festa | decoracao, buffet, lembrancinha, monitor extra, foto, convite digital |
| Jump park | meia antiderrapante, aula/monitoria, tempo adicional, combo bebida, pacote mensal |
| Cliente recorrente | membership, banco de horas, voucher, campanha de retorno |

## Fontes consultadas

- SafePlay: sistema brasileiro para brinquedotecas, espacos kids, parques,
  carrinhos eletricos e quiosques em shopping, com entrada/saida, festas,
  planos, fiscal, offline e multi-unidade.
  https://safeplay.com.br/
- ROLLER: plataforma internacional para playground indoor com booking, POS,
  festas, vendas e experiencia do visitante.
  https://www.roller.software/industries/playground-software
- anny: booking para indoor playground com slots, QR check-in/check-out,
  termos digitais, capacidade, festas, add-ons, grupos e depositos.
  https://anny.co/en/solutions/indoor-playground-booking-system
- High Trek POS: ticketing, POS, waivers, memberships, grupos, campanhas e
  vendas no local para atracoes.
  https://www.hightrekpos.com/
- P Diverte Cars no ParkShopping: exemplo de aluguel de carrinhos eletricos em
  shopping.
  https://www.parkshopping.com.br/lojas/mini-cars/
- Flip Park: exemplo brasileiro de trampoline indoor com atracoes, ingressos por
  tempo, festas e adicionais como meia antiderrapante.
  https://www.flippark.com.br/
- JJ Park: exemplo brasileiro de jump/trampoline park com venda antecipada,
  regras de acompanhante/documento e meia antiderrapante.
  https://www.jjpark.com.br/

