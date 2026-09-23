# Status atual do ToyGo! — 23/09/2026

Este documento prevalece sobre os trechos históricos do `README_EXECUTIVO.md`
que ainda descrevem o projeto como Etapas 1 e 2.

## Entregue nesta rodada

- Adapter real do Desktop contra a Central, com pareamento, heartbeat,
  eventos, comandos remotos, releases e manifesto de backup.
- Controle remoto de bloqueio/desbloqueio, refletido na projeção local de
  licença do Desktop.
- Portal da Central MultiSistemas publicado no repositório da Central, com
  login/sessão, MFA, instalações pareadas, heartbeat, bloqueio/desbloqueio e
  mensalidades PIX/Boleto.
- Instalador Windows NSIS com MariaDB embarcado e O_Batedor.
- Instalação limpa em runner Windows, com pacote instalado e recursos
  empacotados verificados no CI:
  <https://github.com/JefersonCG/ToyGo-/actions/runs/35741534422>.

## Pendências cabíveis ainda abertas

1. Assinar o instalador com Authenticode e publicar o checksum no processo de
   release.
2. Entregar o wizard visual de primeira configuração; o CLI de provisionamento
   já existe.
3. Executar uma homologação completa do bootstrap MariaDB pelo Desktop
   instalado, separada do gate de instalação limpa do CI.
4. Executar o ciclo ponta a ponta em staging: botão do portal, comando assinado
   da Central e confirmação no `readLicenseProjection` do Desktop pareado.
5. Implementar a persistência real da operação do Desktop: sessões, caixa,
   fechamento de conta, pagamentos e migrations aplicadas automaticamente.
6. Implementar o módulo fiscal brasileiro: NFC-e/SEFAZ, contingência,
   certificados, fila offline e impressão ESC/POS.
7. Fazer hardening e implantação de produção: segredos, assinatura, backups,
   observabilidade e procedimento de rollback.

## Fora do escopo desta rodada

- Credenciais reais e homologação financeira de produção no ASAAS.
- Homologação fiscal junto à SEFAZ.
- Validação visual em máquina física do wizard.
- Arquitetura de múltiplos terminais por unidade.
