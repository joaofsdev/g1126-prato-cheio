# Retrospectiva da Iteração 1 — Análise e walking skeleton

- **Data:** <!-- preencher --> · **Grupo:** g1126 — Prato Cheio (Code4Food)

## O que decidimos nesta iteração

1. **Stack Node.js 22 + Express + SQLite embutido** (ver `docs/adr/0001-escolha-da-stack.md`), com o banco isolado em `src/db.js` para a migração a PostgreSQL na Unidade 3.
2. **História 0 = uma ONG aceita uma doação disponível**, a menor fatia que exercita publicar → listar → aceitar e a regra de exclusividade (Regra 2).
3. **Só tipo, quantidade e validade são obrigatórios** na publicação — saída do conflito doador x Vigilância Sanitária.
4. **Aceite com `UPDATE` atômico**, para que duas ONGs nunca consigam aceitar a mesma doação ao mesmo tempo (risco de condição de corrida).

## O que funcionou

<!-- Preencher em grupo. -->

## O que mudaríamos

<!-- Preencher em grupo. Sugestão de ponto honesto: parte dos commits da iteração foi direto na main
     e com mensagens genéricas ("Update app.js"); a partir da U2, só por Pull Request. -->

## Próximos passos (para a próxima iteração)

- Regra 1: esconder doações vencidas da lista (filtro por `validade` + teste).
- Levar a Regra 3 (ONG aceita e não retira) para decisão da Marta.
- Autenticação simples por ONG (risco registrado na análise).
- Documento de projeto e ADR da migração para PostgreSQL.

## Autoavaliação de contribuição

Distribuam 100 pontos entre os integrantes conforme a contribuição desta iteração
(inclui código, análise, documentação, revisão de PR). Cada integrante assina.

A coluna "O que fez" foi levantada a partir do histórico do repositório — **confiram e completem**
com o trabalho que não aparece em commit (discussões, revisão, apresentação).

| Integrante | Pontos | O que fez de mais relevante |
|---|:--:|---|
| João Francisco da Silva (@joaofsdev) |  | Criou o repositório a partir do template e o walking skeleton inicial; nome do grupo; revisou e integrou os PRs #2 e #3. |
| Pedro Israel (@p33drinho) |  | Implementou a camada de regras (`doacoes.js`) usando o repositório e o tratamento de erros; refatorou as consultas SQL; validação da porta e encerramento do servidor (`server.js`); tratamento de erros das rotas (`app.js`). |
| Iago Koch (@iagokoch) |  | Aceite atômico contra condição de corrida e o teste de aceite concorrente; riscos, hipótese e experimento na análise; integrou o PR #4. |
| Caio (@caiorosa31) |  | Melhorou a validação dos dados de doação e padronizou as colunas das consultas SQL. |
| Patrick Gusmão (@patrickgusmao10) |  | Complementou o documento de análise das aulas 1, 2 e 3 (PRs #2, #3 e #4). |
| William Vodzinsky (@vodzinskylila) |  | Stakeholders, objetivos e conflitos (Aula 2) e o mapa de stakeholders. |

**Total: 100**

Assinaturas: <!-- cada integrante -->
