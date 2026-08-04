# ADR 0001 — Escolha da stack (Node.js + Express + SQLite)

- **Data:** 2026-08-04
- **Status:** aceito

## Contexto

O projeto Prato Cheio precisa de uma stack para implementar o walking skeleton da Unidade 1: uma API REST que recebe doações, persiste no banco e devolve respostas. Os requisitos são:

- Simplicidade de setup (equipe com diferentes níveis de experiência)
- Banco relacional sem instalação externa (para a U1)
- CI rápido e sem dependências pesadas
- Possibilidade de migrar para PostgreSQL na Unidade 3
- Stack preferencial da disciplina

## Alternativas consideradas

### 1. Node.js 22 + Express + SQLite (via `node:sqlite`)

- **Prós:**
  - Stack preferencial da disciplina — alinhamento com expectativas e suporte do professor
  - SQLite embutido no Node 22 — zero instalação de banco
  - Ecossistema maduro (Express, Vitest, Supertest)
  - Testes em memória (`:memory:`) — rápidos e sem efeito colateral
  - Interface `query()` → `{ rows }` já abstrai o acesso, facilitando troca futura

- **Contras:**
  - `node:sqlite` ainda é experimental (warning no console)
  - SQLite não suporta acesso concorrente pesado (irrelevante para MVP)

### 2. Python + Flask + SQLite

- **Prós:**
  - Sintaxe familiar para parte da equipe
  - SQLite nativo via `sqlite3`

- **Contras:**
  - Não é a stack preferencial — exige ADR extra de justificativa e assume os compromissos adicionais descritos no README da disciplina
  - Ecossistema de testes menos integrado (pytest vs Vitest+Supertest)
  - Menor experiência da equipe com deploy Python

### 3. Node.js + Express + PostgreSQL (desde a U1)

- **Prós:**
  - Banco definitivo desde o início — sem necessidade de refatoração na U3
  - Recursos avançados (JSONB, concorrência real)

- **Contras:**
  - Requer instalação de PostgreSQL ou Docker desde a U1
  - CI mais complexo (precisa de service container)
  - Overhead desnecessário para o escopo de walking skeleton
  - Contra a progressão pedagógica da disciplina (SQLite → PostgreSQL)

## Decisão

Adotamos **Node.js 22 + Express + SQLite (embutido)** — a stack preferencial da disciplina.

Motivos principais:
1. Elimina dependências externas na U1 — qualquer máquina com Node 22 roda tudo.
2. O CI é simples: `npm ci && npm test` basta.
3. A camada `src/db.js` já isola o banco via interface `query()` → `{ rows }`, então a migração para PostgreSQL na U3 ficará contida nesse arquivo.
4. Testes rodam em SQLite `:memory:`, sem sujeira e sem lentidão de I/O.

## Consequências

- **Positivas:**
  - Setup instantâneo para novos membros da equipe (`npm install` e pronto)
  - CI leve e rápido (sem containers de banco)
  - Foco total na lógica de negócio, não em infra

- **Negativas / o que abrimos mão:**
  - Recursos SQL avançados de PostgreSQL (constraints complexas, JSONB) só estarão disponíveis na U3
  - O warning `ExperimentalWarning: SQLite is an experimental feature` aparece no console (não é erro)

- **Riscos e o que fazer se der errado:**
  - Se `node:sqlite` apresentar bug bloqueante: usar `better-sqlite3` como fallback (mesma API síncrona)
  - Se a migração para PostgreSQL na U3 for mais trabalhosa que o esperado: os testes existentes servem como rede de proteção para garantir que o comportamento se mantém

## Rastreabilidade

Atende à necessidade de banco relacional com zero instalação externa (risco "complexidade de setup") e alinha com a progressão pedagógica SQLite → PostgreSQL definida na disciplina.
