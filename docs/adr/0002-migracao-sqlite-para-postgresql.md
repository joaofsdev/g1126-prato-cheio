# ADR 0002 — Migração de SQLite para PostgreSQL

- **Data:** 2026-10-16
- **Status:** aceito (substitui a parte "banco SQLite" do [ADR 0001](0001-escolha-da-stack.md); o resto da stack continua valendo)

## Contexto

Na Unidade 1 o banco era SQLite embutido no Node (`node:sqlite`), escolhido para ter zero instalação
(ADR 0001). Para a evolução do produto isso deixou de bastar:

- **Exigência da disciplina:** o produto da Unidade 3 precisa rodar em PostgreSQL, alcançável por
  `DATABASE_URL`, com schema migrado e CI verde.
- **Concorrência real no aceite (Regra 2):** o aceite atômico (`UPDATE … WHERE status = 'disponivel'`)
  é a proteção contra duas ONGs aceitarem a mesma doação. No SQLite isso funcionava porque o banco
  serializa todas as escritas num único arquivo; num ambiente com vários acessos simultâneos o
  PostgreSQL trata concorrência por linha, sem travar o banco inteiro.
- **Problemas operacionais do SQLite** que já apareceram no grupo: falha `disk I/O error` em pasta
  sincronizada (OneDrive), aviso `ExperimentalWarning` do `node:sqlite`, e arquivo local que não
  sobrevive a hospedagens com disco efêmero.
- **Tipos fracos:** `validade`, `criada_em` e `aceita_em` eram `TEXT`. A Regra 1 (esconder doação
  vencida) precisa comparar datas de verdade.

Restrições: o time tem pouca experiência com infraestrutura, o prazo é curto e o código precisa ser
explicável por qualquer integrante. O `src/db.js` já expunha `query()` → `{ rows }` justamente para
conter essa troca.

## Alternativas consideradas

### Onde o banco roda

1. **PostgreSQL em Docker Compose** (dev e testes) + service container no CI.
2. **PostgreSQL instalado na máquina** de cada integrante.
3. **Serviço gerenciado gratuito** (Neon, Supabase, Render).

### Como o código fala com o banco

A. **Driver `pg` com SQL escrito à mão**, isolado em `db.js` (conexão) e `repositorio.js` (SQL).
B. **ORM** (Prisma ou Sequelize), com schema e migrations gerados pela ferramenta.
C. **Query builder** (Knex), que gera o SQL e traz um sistema de migrations próprio.

### Como o schema evolui

i. **Arquivos `.sql` numerados + runner próprio** (`src/migrar.js`, ~40 linhas) que registra o que já
   rodou em `schema_migrations`.
ii. **Ferramenta de migrations** (`node-pg-migrate`, migrations do Knex/Prisma).
iii. **`CREATE TABLE IF NOT EXISTS` no código**, como era na Unidade 1.

## Trade-offs

| Critério | SQLite (como era) | PostgreSQL + Docker + `pg` (escolhido) | PostgreSQL gerenciado (Neon) | ORM (Prisma) |
|---|---|---|---|---|
| Setup para quem chega | `npm install` e pronto | precisa de Docker e `docker compose up -d` | precisa de conta e URL secreta | `npm install` + `prisma generate` |
| Funciona sem internet | sim | sim | não | depende do banco |
| Igual em dev, testes e CI | sim | sim (mesma imagem `postgres:16-alpine`) | testes compartilhariam o banco remoto | sim |
| Concorrência de escrita | uma escrita por vez (arquivo inteiro) | por linha | por linha | por linha |
| Tipos de data | `TEXT` | `DATE` / `TIMESTAMPTZ` | idem | idem |
| SQL visível para o time explicar | sim | sim | sim | não (gerado) |
| Velocidade dos testes | mais rápido (em memória) | um pouco mais lento (rede local); arquivos de teste não podem rodar em paralelo | lento (rede externa) | — |
| Custo de mudar de novo depois | — | baixo (só `db.js`) | baixo | alto (código acoplado ao ORM) |

## Decisão

**PostgreSQL 16 rodando em Docker Compose, acessado pelo driver `pg` com SQL escrito à mão, e schema
versionado em arquivos `.sql` aplicados por um runner próprio** (alternativas 1 + A + i).

- **Docker Compose** porque todos têm o mesmo banco com um comando, sem conta externa, e o CI usa a
  mesma imagem. Um serviço `db` (desenvolvimento, com volume) e um `db-teste` (em `tmpfs`, descartável).
- **`pg` + SQL à mão** porque a troca ficou contida em `src/db.js` e `src/repositorio.js` — o contrato
  `query(sql, valores)` → `{ rows, alteradas }` foi mantido, então regras e rotas não mudaram por causa
  do banco. Com ORM, o time teria de aprender e defender código gerado.
- **Runner próprio de migrations** porque são poucos arquivos e o runner é curto o bastante para
  qualquer integrante ler; uma ferramenta pronta traria recursos (rollback, `down`) que não usamos.

Configuração só por variável de ambiente: `DATABASE_URL` (app) e `TEST_DATABASE_URL` (testes), com
`.env.example` versionado e `.env` fora do Git.

### Diferenças de dialeto tratadas

| SQLite (U1) | PostgreSQL | Onde |
|---|---|---|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `INTEGER GENERATED ALWAYS AS IDENTITY` | `migrations/001_cria_tabela_doacoes.sql` |
| `validade TEXT` | `DATE` + validação `AAAA-MM-DD` antes de gravar (senão o banco recusaria com 500) | migration 001, `src/doacoes.js` |
| `criada_em`/`aceita_em TEXT` | `TIMESTAMPTZ` | migration 001 |
| `datetime('now')` | `now()` | `src/repositorio.js` |
| marcador `?` | `$1, $2…` | `src/repositorio.js` |
| `status TEXT` livre | `CHECK (status IN ('disponivel','aceita'))` | migration 001 |
| `DATE` vira `Date` no fuso do servidor | parser devolve o texto `AAAA-MM-DD` | `src/db.js` |
| fuso do servidor | conexão com `timezone=America/Sao_Paulo` | `src/db.js` |
| `info.changes` | `rowCount` (exposto como `alteradas`) | `src/db.js` |
| id sem limite prático | `INTEGER` vai até 2.147.483.647: id maior é recusado com 400 | `src/app.js` |

## Consequências

- **Positivas**
  - Os **16 testes que já existiam passaram sem nenhuma alteração** no PostgreSQL — evidência de que o
    comportamento se manteve. Somaram-se 11 testes da migração (`tests/postgresql.test.js`).
  - Banco fora do ar agora responde **503 "Banco de dados indisponível"** em vez de derrubar a
    requisição com 500 genérico (`src/erros.js`, `src/db.js`).
  - Datas são datas: a Regra 1 (doação vencida) pode usar `validade >= CURRENT_DATE`.
  - Schema com histórico: cada mudança é um arquivo novo em `migrations/`.
  - Dados do SQLite podem ser trazidos com `npm run db:migrar-dados-sqlite` (ids e sequência preservados).
- **Negativas / o que abrimos mão**
  - **Complexidade operacional maior:** quem chega precisa de Docker; antes bastava o Node. Na máquina
    de um integrante a porta 5432 já estava ocupada por outro PostgreSQL — por isso as portas do
    compose ficaram configuráveis (`DB_PORTA`, `DB_TESTE_PORTA`).
  - Testes dependem do contêiner `db-teste` no ar e **não rodam arquivos em paralelo**
    (`fileParallelism: false`), porque todos limpam o mesmo banco.
  - `validade` deixou de aceitar texto livre ("amanhã"): só `AAAA-MM-DD` (a tela já envia nesse formato).
  - O runner de migrations não tem rollback (`down`) nem trava contra dois processos migrando ao
    mesmo tempo — aceitável com um único servidor.
- **Riscos e o que fazer se der errado**
  - Se o Docker for obstáculo para algum integrante: a aplicação só precisa de uma `DATABASE_URL`;
    dá para apontar para um PostgreSQL instalado ou para um Neon gratuito sem mudar código.
  - Se surgirem migrations concorrentes (vários servidores): trocar o runner por `node-pg-migrate` ou
    adicionar `pg_advisory_lock` no `src/migrar.js`.

## Rastreabilidade

- Regra 2 / risco "condição de corrida no aceite" (`docs/analise.md`): o teste
  `[0.3b] quando duas ONGs tentam aceitar ao mesmo tempo, só uma consegue` passa no PostgreSQL.
- Regra 1 / risco "doação vencida continua visível": viabilizada pelo tipo `DATE`.
- Restrição técnica da Unidade 1 ("banco SQLite") e ADR 0001 → substituídas por esta decisão.
