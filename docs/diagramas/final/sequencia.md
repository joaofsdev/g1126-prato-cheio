
# Diagramas de Sequência — Aceite e confirmação de retirada (versão final)

Pergunta que respondem: **como os componentes do sistema interagem durante o aceite de uma doação e sua posterior retirada, incluindo os caminhos de sucesso e erro?**

O primeiro fluxo representa o aceite de uma doação pela ONG, já existente na `main`. O segundo representa a confirmação de retirada pelo motorista voluntário, desenvolvida na História 8, na branch `feat/confirmar-retirada-doacao`, integrada à `main` pelo PR #10.

## 1. Aceite de doação pela ONG

```mermaid
sequenceDiagram
    actor ONG
    participant API as app.js (rota)
    participant Servico as doacoes.js (regras)
    participant Repo as repositorio.js (SQL)
    participant BD as PostgreSQL

    ONG->>API: POST /api/doacoes/:id/aceitar {ong}
    API->>API: lerId(id)

    break ID inválido
        API-->>ONG: HTTP 400
    end

    API->>Servico: aceitar(id, ong)

    break ONG ausente, vazia ou acima de 120 caracteres
        Servico-->>API: ErroValidacao
        API-->>ONG: HTTP 400
    end

    Servico->>Repo: buscarPorId(id)
    Repo->>BD: SELECT WHERE id = $1
    BD-->>Repo: registro ou nenhum
    Repo-->>Servico: doação ou undefined

    break Doação inexistente
        Servico-->>API: ErroNaoEncontrado
        API-->>ONG: HTTP 404
    end

    Servico->>Repo: marcarComoAceita(id, ong)
    Repo->>BD: UPDATE status = 'aceita', ong, aceita_em = now()
    Note over Repo,BD: WHERE id = $2 AND status = 'disponivel' AND validade >= CURRENT_DATE
    BD-->>Repo: quantidade de linhas alteradas
    Repo-->>Servico: true ou false

    alt Nenhuma linha alterada
        Servico->>Repo: buscarPorId(id)
        Repo->>BD: SELECT WHERE id = $1
        BD-->>Repo: estado atual
        Repo-->>Servico: doação atual

        alt Continua disponível, mas venceu
            Servico-->>API: ErroConflito
            API-->>ONG: HTTP 409 - Doação vencida
        else Já foi aceita ou retirada
            Servico-->>API: ErroConflito
            API-->>ONG: HTTP 409 - Doação já foi aceita
        end
    else Uma linha alterada
        Servico->>Repo: buscarPorId(id)
        Repo->>BD: SELECT WHERE id = $1
        BD-->>Repo: registro atualizado
        Repo-->>Servico: doação aceita
        Servico-->>API: doação aceita
        API-->>ONG: HTTP 200 + JSON
    end

    Note over API,BD: Falha de conexão com o banco pode resultar em HTTP 503.
```

## 2. Confirmação de retirada pelo motorista voluntário — História 8

```mermaid
sequenceDiagram
    actor Motorista as Motorista voluntário
    participant API as app.js (rota)
    participant Servico as doacoes.js (regras)
    participant Repo as repositorio.js (SQL)
    participant BD as PostgreSQL

    Motorista->>API: POST /api/doacoes/:id/retirar {motorista}
    API->>API: lerId(id)

    break ID inválido
        API-->>Motorista: HTTP 400
    end

    API->>Servico: confirmarRetirada(id, motorista)

    break Motorista ausente, vazio ou acima de 120 caracteres
        Servico-->>API: ErroValidacao
        API-->>Motorista: HTTP 400
    end

    Servico->>Repo: buscarPorId(id)
    Repo->>BD: SELECT WHERE id = $1
    BD-->>Repo: registro ou nenhum
    Repo-->>Servico: doação ou undefined

    break Doação inexistente
        Servico-->>API: ErroNaoEncontrado
        API-->>Motorista: HTTP 404
    end

    break Doação ainda disponível
        Servico-->>API: ErroConflito
        API-->>Motorista: HTTP 409 - Somente doações aceitas podem ser retiradas
    end

    break Doação já retirada
        Servico-->>API: ErroConflito
        API-->>Motorista: HTTP 409 - Doação já foi retirada
    end

    Servico->>Repo: marcarComoRetirada(id, motorista)
    Repo->>BD: UPDATE status = 'retirada', motorista, retirada_em = now()
    Note over Repo,BD: WHERE id = $2 AND status = 'aceita'
    BD-->>Repo: quantidade de linhas alteradas
    Repo-->>Servico: true ou false

    alt Nenhuma linha alterada
        Note over Servico,BD: Outra confirmação pode ter ocorrido entre SELECT e UPDATE.
        Servico-->>API: ErroConflito
        API-->>Motorista: HTTP 409 - Retirada já confirmada ou indisponível
    else Uma linha alterada
        Servico->>Repo: buscarPorId(id)
        Repo->>BD: SELECT WHERE id = $1
        BD-->>Repo: registro atualizado
        Repo-->>Servico: doação retirada
        Servico-->>API: doação retirada
        API-->>Motorista: HTTP 200 + JSON
    end

    Note over API,BD: A condição status = 'aceita' impede duas confirmações simultâneas.
```

## Decisões técnicas representadas

| Aspecto | Aceite da ONG | Confirmação de retirada |
|---|---|---|
| Endpoint | `POST /api/doacoes/:id/aceitar` | `POST /api/doacoes/:id/retirar` |
| Responsável pela operação | ONG | Motorista voluntário |
| Campo obrigatório | `ong` | `motorista` |
| Estado exigido | `disponivel`, com validade vigente | `aceita` |
| Estado resultante | `aceita` | `retirada` |
| Data registrada | `aceita_em` | `retirada_em` |
| Proteção contra concorrência | `UPDATE` condicional por estado e validade | `UPDATE` condicional por estado |
| Confirmação duplicada | HTTP 409 | HTTP 409 |

## Observações

A validação inicial consulta o registro antes da atualização. Entretanto, a proteção definitiva contra operações simultâneas ocorre no PostgreSQL, por meio das condições do `UPDATE`.

Na confirmação de retirada, caso nenhuma linha seja alterada, o serviço retorna conflito HTTP 409. Diferentemente do aceite, essa operação não realiza uma nova consulta para identificar o motivo específico da falha concorrente.

Os dois fluxos são implementados na mesma arquitetura, composta pela rota Express, serviço de regras de negócio, repositório SQL e PostgreSQL.

**Situação de integração:** integrado à `main` pelo PR #10 (`fff59e0`). O fluxo de retirada faz parte do comportamento atual.

## Fontes

- `src/app.js` — `lerId`, rotas de aceite e retirada, middleware de erros
- `src/doacoes.js` — `aceitar`, `confirmarRetirada`
- `src/repositorio.js` — `buscarPorId`, `marcarComoAceita`, `marcarComoRetirada`
- `src/erros.js` — tratamento dos erros de aplicação
- `migrations/002_adiciona_confirmacao_retirada.sql` — branch da História 8
- `docs/analise.md` — regras de negócio e riscos de concorrência
```