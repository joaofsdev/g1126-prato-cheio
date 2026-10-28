# Documento de Projeto — Prato Cheio

*Atividade Avaliativa 2 (N2) · evolução do walking skeleton da Unidade 1*

Este documento resume o que foi implementado nesta evolução, as decisões tomadas e os requisitos não
funcionais. Tudo aqui aponta para o código e para os testes que comprovam; se algo divergir, vale o código.

## Histórias implementadas

As histórias vêm da tabela de histórias de `docs/analise.md`. Cada critério tem um código que aparece
no nome do teste correspondente.

### História 6 — Esconder doações vencidas (Regra 1)

> Como ONG, quero visualizar doações disponíveis que ainda estejam dentro da janela de retirada,
> para escolher uma opção que possa ser coletada a tempo.

| Critério | Dado / Quando / Então | Teste (`tests/vencidas.test.js`) |
|---|---|---|
| **6a** | **Dado** doações com validade hoje e no futuro, **quando** a ONG consulta a lista, **então** elas aparecem (a que vence antes primeiro). | `[6a] mostra as doações que vencem hoje e as que vencem no futuro` |
| **6b** | **Dado** uma doação cuja validade já passou, **quando** a ONG consulta, **então** ela não aparece. | `[6b] não mostra a doação cuja validade já passou` |
| **6c** | **Dado** uma doação vencida, **quando** uma ONG tenta aceitá-la, **então** recebe 409 "Doação vencida não pode ser aceita" e a doação não muda. | `[6c] recusa com 409…`, `[6c] a doação vencida continua sem ONG…`, `[6c] doação já aceita continua respondendo "já foi aceita"…` |
| **6d** | **Dado** validade anterior a hoje, **quando** o doador publica, **então** recebe 400 e nada é gravado. | `[6d] recusa com 400…`, `[6d] não grava nada…` |

**Onde está:** `validade >= CURRENT_DATE` na listagem e no `UPDATE` atômico do aceite
(`src/repositorio.js:18` e `:36`); motivo do 409 em `aceitar` (`src/doacoes.js:117`); recusa na
publicação (`src/doacoes.js:62`); "hoje" no fuso de São Paulo (`src/datas.js:19`), o mesmo da conexão
(`src/db.js:51`).

### História 5 — Consultar rastreio de uma doação

> Como Vigilância Sanitária, quero que as doações mantenham informações mínimas de rastreabilidade,
> para possibilitar a identificação do alimento doado quando necessário.

| Critério | Dado / Quando / Então | Teste (`tests/rastreio.test.js`) |
|---|---|---|
| **5a** | **Dado** uma doação publicada, **quando** a Vigilância consulta pelo id, **então** recebe tipo, quantidade, validade, status e o instante da publicação. | `[5a] devolve tipo, quantidade, validade, status e instante da publicação` |
| **5b** | **Dado** uma doação aceita, **quando** consulta pelo id, **então** vê também a ONG e o instante do aceite — mesmo fora da lista. | `[5b] uma doação aceita mostra a ONG…`, `[5b] a doação aceita sai da lista, mas continua consultável…` |
| **5c** | **Dado** um id inexistente, **quando** consulta, **então** recebe 404. | `[5c] responde 404 para doação inexistente` |
| **5d** | **Dado** um id inválido (`abc`, `0`, `-1`, `1.5`, acima do INTEGER), **quando** consulta, **então** recebe 400 sem consultar o banco. | `[5d] responde 400 para id inválido…` (5 casos), `[5d] id inválido é recusado sem consultar o banco` |

**Onde está:** rota `GET /api/doacoes/:id` (`src/app.js:82`), validação do id em `lerId`
(`src/app.js:20`), `buscarPorId` com 404 (`src/doacoes.js:84`). Na tela: "Consultar doação (rastreio)".

### História 8 — Confirmar retirada da doação

> Como motorista voluntário, quero confirmar a retirada de uma doação pelo celular, para registrar que o
> alimento foi coletado dentro da janela prevista.

Os critérios 8a–8d estão em `docs/analise.md`. Os testes usam uma numeração própria (`[8.1]`…`[8.10]`);
a coluna da direita mostra qual teste comprova cada critério.

| Critério | Dado / Quando / Então | Teste (`tests/retirada.test.js`) |
|---|---|---|
| **8a** | **Dado** uma doação aceita por uma ONG, **quando** o motorista informa seu nome e confirma a retirada, **então** o status muda para `retirada` e são registrados o motorista e o instante da coleta (`retirada_em`). | `[8.1] confirma a retirada de uma doação aceita`, `[8.2] preserva o histórico da doação após a retirada` |
| **8b** | **Dado** que o nome do motorista não foi informado, **quando** a retirada é solicitada, **então** o sistema recusa (400) sem alterar a doação. | `[8.3] recusa retirada sem identificação do motorista` |
| **8c** | **Dado** uma doação que não está no status `aceita`, **quando** a retirada é solicitada, **então** o sistema recusa a transição (409) e preserva os dados. | `[8.7] impede retirada antes do aceite da ONG` |
| **8d** | **Dado** que a retirada já foi confirmada, **quando** uma nova confirmação é solicitada, **então** o sistema impede o registro duplicado (409), inclusive com pedidos simultâneos. | `[8.8] impede confirmar duas vezes a mesma retirada`, `[8.9] permite somente uma confirmação simultânea` |

Testes adicionais, sem critério próprio: `[8.4]` nome do motorista acima de 120 caracteres (400),
`[8.5]` id inválido (400), `[8.6]` doação inexistente (404) e `[8.10]` doação retirada não aparece na lista.

**Onde está:** rota `POST /api/doacoes/:id/retirar` (`src/app.js:102`); `confirmarRetirada`
(`src/doacoes.js:127`), que recusa status diferente de `aceita` (`:146`); `UPDATE … WHERE status = 'aceita'`
atômico em `marcarComoRetirada` (`src/repositorio.js:42`); status `retirada` e colunas `motorista` e
`retirada_em` em `migrations/002_adiciona_confirmacao_retirada.sql`. Na tela: "Confirmar retirada da doação".

**Limite:** os testes verificam a confirmação pela API. O uso pelo celular com conexão instável ainda não
foi validado, e a retirada não confere se a validade já passou.

### Fora do escopo desta evolução

- História 4 (motorista confirma a coleta pelo celular): a funcionalidade é a mesma da História 8; falta
  validar o uso em celular com conexão instável.
- Regra 3 (ONG aceita e não retira — aguarda a Marta).
- Autenticação: o nome da ONG continua sendo informado, não verificado. Por isso não há cenário de
  "permissão negada" (403) nos testes — não existe identidade para negar.

## Decisões de projeto

| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva | ADR |
|---|---|---|---|---|
| 1 | Stack Node.js + Express | Python/Flask; PostgreSQL desde a U1 | Setup simples, stack da disciplina | [0001](adr/0001-escolha-da-stack.md) |
| 2 | **PostgreSQL 16 em Docker Compose, driver `pg` com SQL à mão, migrations `.sql` versionadas** | manter SQLite; Neon/Supabase; PostgreSQL instalado; ORM (Prisma); Knex | Exigência da U3; concorrência no aceite (Regra 2); datas reais para a Regra 1 | [0002](adr/0002-migracao-sqlite-para-postgresql.md) |
| 3 | **Camadas com injeção de dependência por fábricas e erros tipados** | imports diretos + `vi.mock`; container de DI; status pelo texto da mensagem | Testar falha de banco e entrada inválida; status HTTP confiável | [0003](adr/0003-camadas-com-injecao-de-dependencia-e-erros-tipados.md) |
| 4 | "Hoje" sempre no fuso `America/Sao_Paulo` (app e banco) | fuso do servidor; UTC | Regra 1: entre 21h e meia-noite UTC já é amanhã | — (`src/datas.js`) |
| 5 | Doação que vence hoje ainda aparece | esconder no dia da validade | A validade é o último dia de retirada ("retirar até") | — |

## Tabela de trade-offs (decisão 2 em detalhe)

| Critério | SQLite (como era) | PostgreSQL + Docker (escolhido) |
|---|---|---|
| Setup para quem chega | `npm install` | `npm install` + Docker + `docker compose up -d` |
| Concorrência de escrita | uma escrita por vez | por linha |
| Tipos de data | `TEXT` | `DATE` / `TIMESTAMPTZ` |
| Testes | em memória, mais rápidos | contêiner `db-teste`; arquivos de teste em série |
| Igual em dev, testes e CI | sim | sim (mesma imagem) |

Comparação completa (incluindo Neon e ORM) no [ADR 0002](adr/0002-migracao-sqlite-para-postgresql.md).

## Requisitos não funcionais

Três RNFs escolhidos porque se aplicam ao que existe no sistema. Os testes levam a etiqueta `[RNF1]`,
`[RNF2]` ou `[RNF3]` em `tests/rnf.test.js`; outros testes que também os comprovam estão indicados.

| RNF | Enunciado | Onde aparece no código | Como é verificado | Impacto no projeto |
|---|---|---|---|---|
| **RNF1 — Confiabilidade** | Toda entrada é validada e todo erro responde no mesmo formato `{ "erro": "…" }` com o status certo; banco fora do ar responde 503, não 500. | `src/erros.js:4-39` (classes com status); middleware de erros `src/app.js:126`; `validarDadosDoacao` `src/doacoes.js:27` (inclui data real `AAAA-MM-DD`, `:56`); tradução de falha de conexão `src/db.js:28` | `[RNF1]` em `tests/rnf.test.js`; `Falha de banco` em `tests/postgresql.test.js` (banco inalcançável de verdade → 503); `[0.1b]`, `[5c]`, `[5d]`, `[6d]` | O middleware deixou de decidir o status pelo texto da mensagem; a validação de data foi exigida pela coluna `DATE` |
| **RNF2 — Manutenibilidade / Testabilidade** | O acesso a dados fica isolado em camadas e cada camada recebe suas dependências, para poder ser trocada nos testes. | `criarApp({ db })` `src/app.js:41-42`; `criarServicoDoacoes(repositorio)` `src/doacoes.js:67`; `criarRepositorio(db)` `src/repositorio.js:4`; driver só em `src/db.js:38`; schema em `migrations/` + `src/migrar.js:17` | `[RNF2]` em `tests/rnf.test.js` (regras testadas com repositório falso, sem banco); `[5d] … sem consultar o banco` (db espião); os 16 testes da U1 passaram sem alteração após trocar o banco | A migração SQLite → PostgreSQL ficou contida em `db.js` e `repositorio.js` (ADR 0002 e 0003) |
| **RNF3 — Segurança** | Nenhum valor do usuário é concatenado em SQL; erros não expõem detalhes internos; entradas têm limite de tamanho; o servidor não anuncia sua tecnologia. | Consultas com `$1, $2…` em `src/repositorio.js` (ex.: `:9`, `:26`, `:36`, `:48`); 500 genérico `src/app.js:144`; limite de 100 kb `src/app.js:56`; `TAMANHO_MAXIMO` `src/doacoes.js:5`; `x-powered-by` desligado `src/app.js:46`; `nosniff` `src/app.js:51`; credenciais só em variável de ambiente (`.env` fora do Git) | `[RNF3]` em `tests/rnf.test.js`: SQL malicioso gravado como texto e tabela intacta, 500 sem "relation"/"doacoes", 413, tamanho máximo, cabeçalhos | Sem autenticação ainda — o maior risco de segurança restante (ver Riscos em `docs/analise.md`) |

## Diagramas

### Da atividade anterior

- Mapa de stakeholders: em [`docs/analise.md` → Mapa de stakeholders](analise.md#mapa-de-stakeholders).
- Os diagramas de contexto e de dados/componentes da atividade anterior não foram versionados no
  repositório. Os diagramas atuais estão abaixo (componentes e dados) e em [`docs/diagramas/`](diagramas/README.md).

### Estados e sequência (atividade "Projeto" com apoio de IA)

Diagrama de estados da doação e de sequência do aceite, com a versão inicial da IA, os problemas
encontrados e as versões finais: [`docs/diagramas/`](diagramas/README.md).

### Componentes (estado atual do código)

```mermaid
flowchart LR
  UI["public/index.html<br/>(navegador / celular)"] -->|HTTP JSON| APP["src/app.js<br/>rotas + middleware de erros"]
  APP -->|criarServicoDoacoes| SERV["src/doacoes.js<br/>regras de negócio"]
  SERV -->|criarRepositorio| REPO["src/repositorio.js<br/>todo o SQL ($1, $2…)"]
  REPO -->|db.query| DB["src/db.js<br/>pool pg + tradução de erros"]
  DB --> PG[("PostgreSQL 16<br/>tabela doacoes")]
  MIG["src/migrar.js + migrations/*.sql"] --> PG
  SERV -.-> ERR["src/erros.js"]
  SERV -.-> DATAS["src/datas.js<br/>hoje em São Paulo"]
```

### Dados

```mermaid
erDiagram
  doacoes {
    integer id PK "GENERATED ALWAYS AS IDENTITY"
    text tipo "obrigatório, até 100 caracteres"
    text quantidade "obrigatório, até 50 caracteres"
    date validade "último dia de retirada"
    text status "disponivel | aceita | retirada"
    text ong "preenchido no aceite"
    timestamptz criada_em "default now()"
    timestamptz aceita_em "preenchido no aceite"
    text motorista "preenchido na retirada"
    timestamptz retirada_em "preenchido na retirada"
  }
  schema_migrations {
    text versao PK
    timestamptz aplicada_em
  }
```

## ADRs

Ver `docs/adr/`: [0001 — stack](adr/0001-escolha-da-stack.md) ·
[0002 — SQLite → PostgreSQL](adr/0002-migracao-sqlite-para-postgresql.md) ·
[0003 — camadas com injeção de dependência e erros tipados](adr/0003-camadas-com-injecao-de-dependencia-e-erros-tipados.md) ·
[0004 — reavaliação para várias cidades](adr/0004-reavaliacao-para-varias-cidades.md) (proposto).
As três atividades sobre ADRs estão organizadas em [`adr/atividades-adr.md`](adr/atividades-adr.md).

## Critérios de validação do projeto

- `npm test` verde, localmente e no CI (PostgreSQL real como service container).
- Todo critério de aceite (0.x, 5x, 6x, 8x) e todo RNF tem pelo menos um teste. Os critérios 0.x, 5x e 6x
  aparecem no nome do teste; os 8x estão ligados aos testes `[8.x]` pela tabela da História 8.
- Os testes da Unidade 1 continuam passando depois da troca de banco (evidência da refatoração).
- Cobertura gerada por `npm run test:cobertura`.
- Cada mudança entra por Pull Request revisado por outro integrante.

## Uso de IA

O código, os testes e a primeira versão desta documentação foram gerados com apoio do Claude Code a
partir dos critérios de aceite e decisões definidos pelo grupo, e revisados antes de cada commit.

Nos diagramas, a versão inicial foi gerada pelo Claude e a revisão da História 8 contou com o ChatGPT. As
versões da IA foram preservadas em `docs/diagramas/ia-versao-inicial/`, e os problemas encontrados e as
correções estão em [`docs/diagramas/problemas.md`](diagramas/problemas.md).

**PREENCHER:** o que foi alterado ou recusado do que a IA sugeriu no código e nos testes desta evolução.
