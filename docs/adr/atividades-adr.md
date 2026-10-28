# Atividades sobre ADRs — Prato Cheio

Este arquivo organiza as três atividades sobre *Architecture Decision Records* pedidas na disciplina.
Cada atividade tem sua seção e aponta para onde está a resposta. Os ADRs numerados (`0001`, `0002`…)
registram decisões reais do projeto; este arquivo não substitui nenhum deles.

| Atividade | Onde está a resposta |
|---|---|
| 1 — Criar uma decisão arquitetural | [ADR 0002 — Migração de SQLite para PostgreSQL](0002-migracao-sqlite-para-postgresql.md) |
| 2 — Melhorar um ADR incompleto | [Seção abaixo](#atividade-2--melhorar-um-adr-incompleto) |
| 3 — Revisar a decisão diante de uma mudança | [Seção abaixo](#atividade-3--revisar-a-decisão-diante-de-uma-mudança) |

## Atividade 1 — Criar uma decisão arquitetural

A decisão escolhida foi a troca do banco da Unidade 1 (SQLite) por PostgreSQL, registrada no
[ADR 0002](0002-migracao-sqlite-para-postgresql.md). Onde está cada parte pedida:

| Parte pedida | Seção do ADR 0002 |
|---|---|
| Contexto do problema | **Contexto** — exigência da Unidade 3, concorrência no aceite, falhas do SQLite, datas guardadas como `TEXT` |
| Pelo menos duas alternativas reais | **Alternativas consideradas** — onde o banco roda (Docker, instalado, gerenciado), como o código fala com ele (`pg`, ORM, query builder) e como o schema evolui (runner próprio, ferramenta, `CREATE TABLE` no código) |
| Vantagens e desvantagens | **Trade-offs** — tabela comparando SQLite, PostgreSQL + Docker, Neon e Prisma |
| Decisão tomada | **Decisão** — PostgreSQL 16 em Docker Compose, driver `pg` com SQL à mão, migrations `.sql` |
| Justificativa técnica | Os três tópicos logo abaixo da **Decisão** |
| Consequências positivas e negativas | **Consequências** |

A decisão está implementada: `src/db.js` usa o driver `pg`, o schema está em `migrations/` e a suíte de
testes roda contra o PostgreSQL, localmente e no CI. O [ADR 0001](0001-escolha-da-stack.md), que escolheu
o SQLite, foi mantido como histórico.

## Atividade 2 — Melhorar um ADR incompleto

### A justificativa original

> "Decidimos utilizar PostgreSQL porque é um banco melhor."

### O que falta nela

| Falta | Por que isso é um problema |
|---|---|
| **Contexto** | Não diz que problema a decisão resolve. Quem lê depois não sabe se esse problema ainda existe. |
| **Critério** | "Melhor" em quê? Desempenho, custo, facilidade, concorrência? Sem critério, a afirmação não pode ser verificada nem contestada. |
| **Alternativas** | Não diz com o que o PostgreSQL foi comparado. "Melhor" só faz sentido em relação a outra opção. |
| **Consequências** | Toda escolha tem custo. A frase esconde o que o time passa a pagar (ex.: precisar de Docker). |
| **Rastreabilidade** | Não liga a decisão a nenhum requisito, regra ou risco da análise. |

### Versão melhorada

**Título:** Uso de PostgreSQL como banco de dados do Prato Cheio

**Status:** aceito · decisão completa no [ADR 0002](0002-migracao-sqlite-para-postgresql.md)

**Contexto.** O walking skeleton usava SQLite embutido no Node, escolhido por não exigir instalação
([ADR 0001](0001-escolha-da-stack.md)). A evolução do produto trouxe quatro necessidades que o SQLite
atendia mal:

1. **Exigência da disciplina:** o produto da Unidade 3 precisa rodar em PostgreSQL.
2. **Aceite concorrente (Regra 2):** duas ONGs não podem aceitar a mesma doação, mesmo com pedidos
   simultâneos. O SQLite serializa todas as escritas no arquivo inteiro.
3. **Datas reais (Regra 1):** para esconder doações vencidas é preciso comparar datas, mas `validade`,
   `criada_em` e `aceita_em` eram guardadas como `TEXT`.
4. **Problemas operacionais:** o grupo teve `disk I/O error` com o arquivo do banco numa pasta
   sincronizada pelo OneDrive, e o `node:sqlite` mostra aviso de recurso experimental.

**Alternativas consideradas.**

| Critério | Manter SQLite | PostgreSQL em Docker | PostgreSQL gerenciado (Neon) |
|---|---|---|---|
| Atende à exigência da Unidade 3 | não | sim | sim |
| Concorrência de escrita | uma escrita por vez | trava por linha | trava por linha |
| Tipos de data | `TEXT` | `DATE` / `TIMESTAMPTZ` | `DATE` / `TIMESTAMPTZ` |
| Funciona sem internet | sim | sim | não |
| Igual em desenvolvimento, testes e CI | sim | sim (mesma imagem `postgres:16-alpine`) | testes dividiriam o banco remoto |
| Setup para quem chega | só `npm install` | Docker + `docker compose up -d` | conta e URL secreta |

**Decisão.** Usar **PostgreSQL 16 em Docker Compose**, acessado pelo driver `pg`.

**Justificativa técnica.** Cada necessidade do contexto é atendida por uma propriedade concreta:

- **Regra 2:** o aceite é um único `UPDATE … WHERE status = 'disponivel'`, e o PostgreSQL trava só a linha
  da doação. O teste `[0.3b] quando duas ONGs tentam aceitar ao mesmo tempo, só uma consegue` passa contra
  o PostgreSQL.
- **Regra 1:** com a coluna `DATE`, a listagem filtra `validade >= CURRENT_DATE` direto no banco.
- **Ambiente:** a mesma imagem roda em desenvolvimento, nos testes e no CI, sem depender de serviço
  externo. Por isso o Docker foi preferido ao Neon.

**Consequências.**

- **Positivas:** os 16 testes que já existiam passaram sem alteração depois da troca
  ([refatoracoes.md](../refatoracoes.md)); banco fora do ar passou a responder 503 em vez de 500
  (`src/erros.js`); o schema ficou versionado em `migrations/`.
- **Negativas:** quem chega ao projeto precisa de Docker; os arquivos de teste não rodam em paralelo,
  porque todos limpam o mesmo banco.
- **Se der errado:** a aplicação só depende de `DATABASE_URL`, então dá para apontar para um PostgreSQL
  instalado ou gerenciado sem mudar código.

**Rastreabilidade.** Regra 1 e Regra 2 e os riscos "condição de corrida no aceite" e "doação vencida
continua visível" (`docs/analise.md`).

### Comparação

| | Versão original | Versão melhorada |
|---|---|---|
| Problema que resolve | não diz | quatro necessidades concretas |
| Critério de escolha | "melhor" | concorrência, tipos de data, ambiente, exigência da disciplina |
| Alternativas | nenhuma | três, comparadas em tabela |
| Custo da decisão | escondido | Docker obrigatório, testes em série |
| Como verificar | não dá | testes `[0.3b]` e `[6a]`–`[6d]` passando no PostgreSQL |

## Atividade 3 — Revisar a decisão diante de uma mudança

**Cenário:** "O Prato Cheio, inicialmente desenvolvido para um único bairro, será utilizado por ONGs e
doadores de várias cidades, com acessos simultâneos e maior volume de doações."

A revisão está no [ADR 0004 — Reavaliação do banco para uso em várias cidades](0004-reavaliacao-para-varias-cidades.md).
O ADR 0002 não foi apagado nem reescrito: ganhou apenas a indicação de que foi revisado.

| Parte pedida | Resposta no ADR 0004 |
|---|---|
| Reavaliação da decisão original | **Contexto** — tabela das suposições do piloto de um bairro que deixam de valer |
| Novos requisitos de escala | **Novos requisitos** — escopo por cidade, acessos simultâneos, volume sem apagar histórico |
| Impacto dos acessos simultâneos | **Impacto** — o aceite atômico continua correto com várias cópias da aplicação; o limite passa a ser o número de conexões |
| Impacto do aumento de dados | **Impacto** — a listagem sem filtro e sem paginação cresce com a tabela; o índice não cobre a cidade |
| Adequação da tecnologia | **Trade-offs** — quatro alternativas comparadas |
| Manter ou substituir | **Decisão** — manter o PostgreSQL, com ajustes, e réplicas como próximo passo |
| Preservação do ADR anterior | ADR 0002 mantido como histórico; o 0004 está como **proposto**, porque o cenário ainda não foi implementado |
