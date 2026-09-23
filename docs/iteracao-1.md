# Retrospectiva da Iteração 1 — Análise e walking skeleton

- **Data:** 23/09/2026 · **Grupo:** g1126 — Prato Cheio (Code4Food)

## O que decidimos nesta iteração

1. **Stack Node.js 22 + Express + SQLite embutido** (ver `docs/adr/0001-escolha-da-stack.md`), com o banco isolado em `src/db.js` para a migração a PostgreSQL na Unidade 3.
2. **História 0 = uma ONG aceita uma doação disponível**, a menor fatia que exercita publicar → listar → aceitar e a regra de exclusividade (Regra 2).
3. **Só tipo, quantidade e validade são obrigatórios** na publicação — saída do conflito doador x Vigilância Sanitária.
4. **Aceite com `UPDATE` atômico**, para que duas ONGs nunca consigam aceitar a mesma doação ao mesmo tempo (risco de condição de corrida).

## O que funcionou

- **A análise evoluiu aula a aula.** Cada complemento (aulas 1, 2 e 3) entrou por um Pull Request próprio (#1 a #4), revisado e integrado por outro integrante.
- **O risco virou código e teste.** A condição de corrida no aceite foi identificada na análise, corrigida com o `UPDATE` atômico e coberta por um teste que dispara dois aceites ao mesmo tempo.
- **CI desde o primeiro dia.** Todo push na `main` roda os testes e verifica se a aplicação sobe, então sabíamos a qualquer momento se o skeleton estava funcionando.
- **Critérios de aceite ligados aos testes.** Cada teste leva o código do critério que comprova (ex.: `[0.3b]`), e a seção Rastreabilidade do `docs/analise.md` mostra essa ligação.
- **Uso de IA com revisão.** As sugestões da IA foram confrontadas com o caso e com o INVEST; parte foi rejeitada (ex.: remover a História 0 por não ser independente).

## O que mudaríamos

- **Commits direto na `main`.** Parte do código entrou sem Pull Request e com mensagens genéricas ("Update app.js", "Update doacoes.js"), o que dificulta a revisão e mostrar quem fez o quê.
- **Duas versões das regras de negócio.** O README e o `docs/analise.md` chegaram a ter regras diferentes, com nomes de campos e rotas que não existiam no código. O documento oficial precisa ser um só.
- **Documento e código se afastaram.** A análise prometia registrar o instante do aceite antes de o código fazer isso; só foi corrigido na revisão final.
- **Concentração no fim do prazo.** Várias alterações de código e documentação ficaram para o dia da entrega.

## Próximos passos (para a próxima iteração)

- Regra 1: esconder doações vencidas da lista (filtro por `validade` + teste).
- Levar a Regra 3 (ONG aceita e não retira) para decisão da Marta.
- Autenticação simples por ONG (risco registrado na análise).
- Documento de projeto e ADR da migração para PostgreSQL.
- Tudo entra por Pull Request, com o CI verde e revisão de outro integrante antes do merge.

## Autoavaliação de contribuição

Distribuição de 100 pontos conforme a contribuição nesta iteração
(inclui código, análise, documentação e revisão de PR).

| Integrante | Pontos | O que fez de mais relevante |
|---|:--:|---|
| João Francisco da Silva (@joaofsdev) | 17 | Criou o repositório a partir do template e o walking skeleton inicial; revisou e integrou os PRs #2 e #3; alinhou código, testes e documentação para a apresentação (critérios com código, rastreabilidade, registro do instante do aceite). |
| Pedro Israel (@p33drinho) | 18 | Implementou a camada de regras (`doacoes.js`) usando o repositório e o tratamento de erros; refatorou as consultas SQL; validação da porta e encerramento do servidor (`server.js`); tratamento de erros das rotas (`app.js`). |
| Iago Koch (@iagokoch) | 18 | Aceite atômico contra condição de corrida e o teste de aceite concorrente; riscos, hipótese e experimento na análise; integrou o PR #4. |
| Caio (@caiorosa31) | 15 | Melhorou a validação dos dados de doação e padronizou as colunas das consultas SQL. |
| Patrick Gusmão (@patrickgusmao10) | 16 | Complementou o documento de análise das aulas 1, 2 e 3 (PRs #2, #3 e #4). |
| William Vodzinsky (@vodzinskylila) | 16 | Stakeholders, objetivos e conflitos (Aula 2) e o mapa de stakeholders. |

**Total: 100**

## Assinaturas

- João Francisco da Silva: ______________________
- Pedro Israel: ______________________
- Iago Koch: ______________________
- Caio: ______________________
- Patrick Gusmão: ______________________
- William Vodzinsky: ______________________
