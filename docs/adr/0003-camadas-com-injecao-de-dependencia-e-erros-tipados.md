# ADR 0003 — Camadas com injeção de dependência e erros tipados

- **Data:** 2026-10-16
- **Status:** aceito

## Contexto

Na Unidade 1 o código já tinha camadas (`app.js` → `doacoes.js` → `repositorio.js` → `db.js`), mas
cada módulo importava o seguinte diretamente, como um objeto global. Isso trouxe dois problemas que
ficaram evidentes ao preparar a migração para PostgreSQL (ADR 0002):

1. **Não dava para testar uma camada com outra no lugar.** Para provar o comportamento com o "banco
   fora do ar" ou testar uma regra de negócio sem banco, seria preciso desligar o banco de verdade ou
   interceptar `import`s com `vi.mock`, que deixa o teste frágil e difícil de ler.
2. **O status HTTP era decidido pelo texto da mensagem.** O middleware de erros fazia
   `/^(Dados obrigatórios|ONG é obrigatória)/.test(mensagem)` para escolher entre 400, 404 e 409.
   Mudar uma frase de erro mudava o status da resposta sem ninguém perceber, e não havia como
   distinguir "banco fora do ar" de um bug.

A atividade pede testes de falha de banco e de entrada inválida, e o time precisa conseguir explicar o
código — então a solução tinha de ser pequena e sem "mágica".

## Alternativas consideradas

### Como cada camada recebe suas dependências

1. **Manter imports diretos (como na U1)** e usar `vi.mock` nos testes.
2. **Injeção de dependência manual por funções fábrica**: `criarRepositorio(db)`,
   `criarServicoDoacoes(repositorio)`, `criarApp({ db })`.
3. **Container de injeção de dependência** (ex.: `awilix`, `inversify`).

### Como um erro vira status HTTP

a. **Regex na mensagem** (como na U1).
b. **Classes de erro com o status** (`ErroValidacao` 400, `ErroNaoEncontrado` 404, `ErroConflito` 409,
   `ErroBancoIndisponivel` 503) em `src/erros.js`.
c. **Biblioteca `http-errors`.**

## Trade-offs

| Critério | Imports diretos + `vi.mock` | Fábricas (escolhido) | Container de DI |
|---|---|---|---|
| Linhas a mais | nenhuma | poucas (uma função por camada) | biblioteca + registro de dependências |
| Trocar o banco num teste | interceptar módulo | `criarApp({ db: outroDb })` | configurar o container |
| Legível para o time | sim | sim — é só passar parâmetro | exige aprender a ferramenta |
| Risco de esquecer de ligar algo | baixo | baixo (padrões em `criarApp`) | médio (erro só em tempo de execução) |

| Critério | Regex na mensagem | Classes de erro (escolhido) | `http-errors` |
|---|---|---|---|
| Status depende do texto | sim (frágil) | não | não |
| Dependência nova | não | não | sim |
| Distingue 503 de 500 | não | sim | sim, mas sem a tradução do `pg` |

## Decisão

**Fábricas com injeção de dependência manual (2) e classes de erro com status (b).**

- `src/repositorio.js` — `criarRepositorio(db)`: todo o SQL, recebe o `db`.
- `src/doacoes.js` — `criarServicoDoacoes(repositorio)`: regras de negócio, lança erros tipados.
- `src/app.js` — `criarApp({ db = dbPadrao() } = {})`: monta a cadeia; em produção usa o banco de
  `DATABASE_URL`, nos testes recebe outro. O middleware de erros usa `erro.status`.
- `src/db.js` — único ponto que conhece o driver; traduz falha de conexão em `ErroBancoIndisponivel`.
- `src/erros.js` — as classes de erro.

## Consequências

- **Positivas**
  - Testes que antes seriam difíceis ficaram diretos:
    - banco fora do ar de verdade → 503 (`tests/postgresql.test.js`);
    - id inválido não toca o banco, provado com um `db` espião (`tests/rastreio.test.js`, critério 5d);
    - erro inesperado → 500 sem vazar SQL (`tests/rnf.test.js`);
    - regras de negócio testadas com repositório falso, sem PostgreSQL (`tests/rnf.test.js`, RNF2).
  - Mudar a frase de um erro não muda mais o status HTTP.
  - Uma camada nova (ex.: outra entidade) segue o mesmo molde.
- **Negativas / o que abrimos mão**
  - Um nível a mais de indireção: para achar onde o repositório é criado é preciso olhar `criarApp`.
  - Ainda existe uma instância global (`dbPadrao()`), usada como padrão e pelos testes de integração;
    a injeção não eliminou o estado global, só o tornou substituível.
  - Erros de bibliotecas (ex.: `express.json`) continuam com tratamento próprio no middleware
    (`erro.type`), fora das classes de `src/erros.js`.
- **Riscos e o que fazer se der errado**
  - Se o número de dependências crescer muito (várias entidades, serviços externos), reavaliar um
    container de DI.

## Rastreabilidade

- RNF1 (Confiabilidade) e RNF2 (Manutenibilidade/Testabilidade) em `docs/projeto.md`.
- Pedido da atividade: testes de "falha de banco" e de "entrada inválida".
- ADR 0002: a troca de banco ficou contida em `db.js` graças a esse contrato.
