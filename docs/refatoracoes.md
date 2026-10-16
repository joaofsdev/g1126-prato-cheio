# Refatorações — Prato Cheio

*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*

## Refatoração 1 — Migração de SQLite para PostgreSQL

- **Motivo:** exigência da Unidade 3, concorrência real no aceite (Regra 2) e tipos de data para a
  Regra 1 — ver [ADR 0002](adr/0002-migracao-sqlite-para-postgresql.md).
- **O que mudou:**
  - `src/db.js`: pool do driver `pg` no lugar do `node:sqlite`; traduz falha de conexão em 503.
  - `migrations/001_cria_tabela_doacoes.sql` + `src/migrar.js`: schema versionado (antes era
    `CREATE TABLE` dentro do código).
  - `src/repositorio.js`: marcadores `$1…`, `now()`; passa a receber o `db` por parâmetro.
  - `src/doacoes.js` e `src/app.js`: erros tipados (`src/erros.js`) e injeção de dependência;
    `validade` validada como data `AAAA-MM-DD`.
  - `docker-compose.yml`, `.env.example`, `vitest.config.js`, CI com service do PostgreSQL.
- **O que NÃO mudou:** as rotas, os códigos HTTP já existentes, as regras de negócio e o arquivo
  `tests/doacoes.test.js` (nenhuma linha alterada).
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança (SQLite): **16 passando**
  - testes depois da mudança (PostgreSQL): **os mesmos 16 passando**, + 11 novos da migração (27 no total)
  - link da execução do CI verde: (preencher com o link do CI do PR de migração)

## Refatoração 2 — (nome)

- **Cheiro de código atacado:** (duplicação, função longa, nome que engana, regra na rota…)
- **Qual dor concreta isso resolvia:**
- **O que mudou:**
- **Evidência (testes verdes antes e depois):**

---

**Limitações e o que ficou de fora:** (o que vocês viram e decidiram não refatorar, e por quê)
