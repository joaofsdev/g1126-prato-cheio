# Prato Cheio — Code4Food

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Joao Francisco da Silva — @joaofsdev
- William Vodzinsky — @vodzinskylila
- Pedro Israel — @p33drinho
- Caio Rosa — @caiorosa31
- Iago Koch — @iagokoch
- Patrick Gusmão @patrickgusmao10

## Como rodar

Requisitos: **Node.js 22.13 ou superior** e **Docker** (com Docker Compose) para o PostgreSQL.

> Esta é a **stack preferencial** da disciplina. Se o seu grupo optar por outra, registre o ADR de justificativa e garanta os mesmos compromissos: repositório público com CI verde, rota de saúde, testes por um comando, os três comandos documentados aqui no README e banco relacional migrado para PostgreSQL na Unidade 3.

```bash
npm install            # só na primeira vez
cp .env.example .env   # só na primeira vez (no Windows: copy .env.example .env)
docker compose up -d   # sobe o PostgreSQL de desenvolvimento (5432) e o de testes (5433)
npm run db:migrar      # aplica as migrations de migrations/ no banco de DATABASE_URL
npm start              # sobe em http://localhost:3000
npm test               # roda os testes contra o PostgreSQL de testes
npm run test:cobertura # testes + relatório de cobertura (texto no terminal e coverage/index.html)
npm run dev            # sobe recarregando a cada alteração
```

`npm start`, `npm run dev` e `npm run db:migrar` leem o `.env` automaticamente. O servidor também
aplica as migrations pendentes ao subir.

Os testes usam o banco **`db-teste`** (em memória no contêiner), então não sujam o banco de
desenvolvimento. Para apontar os testes para outro PostgreSQL, defina `TEST_DATABASE_URL`.

> **Porta 5432 ocupada?** (outro PostgreSQL na máquina) Defina `DB_PORTA=5434` no `.env` e ajuste a
> porta em `DATABASE_URL`. O mesmo vale para os testes com `DB_TESTE_PORTA` e `TEST_DATABASE_URL`.

### Variáveis de ambiente

| Variável | Para que serve | Padrão |
|---|---|---|
| `DATABASE_URL` | banco usado pela aplicação | obrigatória (ver `.env.example`) |
| `TEST_DATABASE_URL` | banco usado por `npm test` | `postgres://pratocheio:pratocheio@localhost:5433/pratocheio_teste` |
| `PORT` | porta HTTP | `3000` |
| `DB_PORTA` / `DB_TESTE_PORTA` | portas no host do `docker-compose.yml` | `5432` / `5433` |

### Trouxe dados do SQLite da Unidade 1?

```bash
npm run db:migrar-dados-sqlite -- dados.sqlite
```

Copia as doações do arquivo SQLite para o PostgreSQL (banco vazio), preservando ids, status, ONG e
os instantes de publicação e aceite. É tudo-ou-nada: se algo falhar, nada é gravado.

## O banco: de SQLite para PostgreSQL

| Unidade | Banco | O que precisa instalar |
|---|---|---|
| 1 — Análise | SQLite (`node:sqlite`, embutido) | nada além do Node |
| 2 — Projeto | SQLite | nada |
| 3 — Construção | **PostgreSQL 16** (atual) | Docker (`docker compose up -d`) |

A decisão e os trade-offs estão no **[ADR 0002](docs/adr/0002-migracao-sqlite-para-postgresql.md)**.
Em resumo:

- **Só `src/db.js` conhece o driver** (`pg`). O resto recebe um objeto `db` com
  `query(sql, valores)` → `{ rows, alteradas }`, o mesmo contrato da Unidade 1 — os 16 testes que já
  existiam passaram sem alteração depois da troca.
- **Todo o SQL fica em `src/repositorio.js`**, com parâmetros `$1, $2…` (nada de concatenar valores).
- **Schema versionado** em `migrations/` (`001_…sql`, `002_…sql`), aplicado por `src/migrar.js` e
  registrado na tabela `schema_migrations`. Migration já integrada não se edita: mudança vira arquivo novo.
- Diferenças de dialeto tratadas: `AUTOINCREMENT` → `GENERATED ALWAYS AS IDENTITY`, `TEXT` → `DATE` /
  `TIMESTAMPTZ`, `datetime('now')` → `now()`, `?` → `$1`, fuso fixado em `America/Sao_Paulo`.
- **Banco fora do ar → HTTP 503** com mensagem clara (`src/erros.js`), em vez de um 500 genérico.

## Estrutura

```
src/server.js        entrypoint (npm start)
src/app.js           rotas da API e tratamento de erros
src/doacoes.js       regras de negócio
src/repositorio.js   acesso ao banco (todo o SQL)
src/db.js            conexão com o PostgreSQL (único arquivo que conhece o driver)
src/migrar.js        aplica as migrations pendentes
src/erros.js         erros da aplicação com o status HTTP de cada um
migrations/          schema versionado (.sql)
scripts/             db:migrar e cópia de dados do SQLite
public/index.html    interface (funciona no celular)
tests/               testes automatizados (Vitest + supertest)
docker-compose.yml   PostgreSQL de desenvolvimento e de testes
docs/analise.md      documento de análise   (Trabalho 1)
docs/projeto.md      documento de projeto   (Trabalho 2)
docs/adr/            decisões arquiteturais (Trabalho 2)
docs/validacao.md    validação e testes     (Trabalho 3)
docs/refatoracoes.md refatorações feitas    (Trabalho 3)
docs/demo.md         roteiro da demo        (Trabalho 3)
docs/retrospectivas/ retrospectiva de cada iteração
.github/workflows/   pipeline de CI (com PostgreSQL)
```

## Como trabalhar (fluxo de Pull Request)

A partir da Unidade 2, **nada entra direto na `main`**:

```bash
git checkout -b historia/ong-aceita-doacao
# ... implementa, escreve o teste, roda npm test ...
git commit -m "ONG aceita uma doação e ela sai da lista"
git push -u origin historia/ong-aceita-doacao
```

Abra o Pull Request no GitHub, preencha o template, espere o **CI ficar verde** e
peça a revisão de **outro integrante**. Só então faça o merge.

## Análise (Unidade 1)

Toda a análise — problema, stakeholders, regras de negócio, conflito de prioridade,
histórias, critérios de aceite, riscos e hipótese — está em **[docs/analise.md](docs/analise.md)**.
Ele é a fonte oficial: se algo aqui divergir, vale o que está lá.

## O que já está pronto e o que falta

**Pronto (Trabalho 1 — walking skeleton):** a História 0 funciona de ponta a ponta —
**um doador publica uma doação → uma ONG vê a doação → a ONG a aceita e ela sai da lista.**

**Pronto (Atividade 2 — História 5):** a Vigilância Sanitária consulta o registro completo de uma
doação pelo número (`GET /api/doacoes/:id`), em qualquer status — inclusive depois de aceita, quando
ela já saiu da lista. Testes em `tests/rastreio.test.js`.

| Camada | Arquivo | O que faz |
|---|---|---|
| Rotas | `src/app.js` | `GET /api/saude`, `GET /api/doacoes`, `POST /api/doacoes`, `GET /api/doacoes/:id`, `POST /api/doacoes/:id/aceitar` |
| Regras | `src/doacoes.js` | valida os campos obrigatórios (validade em `AAAA-MM-DD`, não no passado) e exige a ONG no aceite |
| SQL | `src/repositorio.js` | aceite com `UPDATE` atômico (impede dois aceites da mesma doação) |
| Banco | `src/db.js` + `migrations/` | PostgreSQL; schema com `criada_em` e `aceita_em` (medição do tempo até o aceite) |
| Testes | `tests/` | um teste por critério de aceite e por RNF, marcado com o código (`[0.3b]`, `[6c]`, `[RNF3]`…) |

Códigos de resposta: `201` publicada · `400` dados inválidos ou ONG ausente ·
`404` doação inexistente · `409` doação já aceita por outra ONG ou vencida · `503` banco fora do ar.

**Pronto (Atividade 2 — História 6 / Regra 1):** doação vencida não aparece na lista, não pode ser
aceita (`409`) e não pode ser publicada com validade no passado (`400`). "Hoje" segue o fuso de
São Paulo, na aplicação (`src/datas.js`) e no banco (`CURRENT_DATE`). Testes em `tests/vencidas.test.js`.

**Falta (limites conhecidos, registrados em `docs/analise.md`):**
- sem autenticação: qualquer pessoa pode aceitar em nome de qualquer ONG;
- o que acontece quando a ONG aceita e não retira ainda não foi decidido (regra ausente — decide a Marta).

A rastreabilidade entre histórias, critérios, regras, rotas e testes está na seção
**Rastreabilidade** de `docs/analise.md`. Quem fez o quê nesta iteração está em
`docs/retrospectivas/iteracao-1.md`. Histórias, decisões e requisitos não funcionais da Atividade 2
estão em **[docs/projeto.md](docs/projeto.md)**.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
