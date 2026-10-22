# Diagrama de Sequência — ONG aceita uma doação (versão final)

Pergunta que responde: **como as partes do sistema interagem durante o aceite e o que acontece em cada
caminho alternativo ou de erro?**

```mermaid
sequenceDiagram
  actor ONG
  participant API as app.js (rota)
  participant Servico as doacoes.js (regras)
  participant Repo as repositorio.js (SQL)
  participant BD as PostgreSQL

  ONG->>API: POST /api/doacoes/:id/aceitar {ong}
  API->>API: lerId(id)
  alt id invalido (texto, 0, negativo, grande demais)
    API-->>ONG: 400 ID de doacao invalido
  end
  API->>Servico: aceitar(id, ong)
  alt ong vazia ou acima de 120 caracteres
    Servico-->>API: ErroValidacao
    API-->>ONG: 400
  end
  Servico->>Repo: buscarPorId(id)
  Repo->>BD: SELECT ... WHERE id = $1
  BD-->>Repo: linha ou nenhuma
  alt doacao nao existe
    Servico-->>API: ErroNaoEncontrado
    API-->>ONG: 404
  end
  Servico->>Repo: marcarComoAceita(id, ong)
  Repo->>BD: UPDATE ... SET status aceita, ong, aceita_em = now() WHERE id = $2 AND status = disponivel AND validade >= CURRENT_DATE
  BD-->>Repo: linhas alteradas
  alt 0 linhas alteradas (perdeu a disputa ou venceu)
    Servico->>Repo: buscarPorId(id)
    Repo->>BD: SELECT ... WHERE id = $1
    BD-->>Repo: status atual
    alt status ainda e disponivel
      Servico-->>API: ErroConflito
      API-->>ONG: 409 Doacao vencida nao pode ser aceita
    else status e aceita
      Servico-->>API: ErroConflito
      API-->>ONG: 409 Doacao ja foi aceita por outra ONG
    end
  else 1 linha alterada
    Servico->>Repo: buscarPorId(id)
    Repo->>BD: SELECT ... WHERE id = $1
    BD-->>Repo: registro com aceita_em
    Servico-->>API: doacao aceita
    API-->>ONG: 200 OK
  end
  Note over API,BD: Falha de conexao com o banco em qualquer consulta vira 503 (ErroBancoIndisponivel)
```

Fontes: `src/app.js` (`lerId`, rota 5, middleware de erros), `src/doacoes.js` (`aceitar`),
`src/repositorio.js` (`marcarComoAceita`), `src/erros.js`, `docs/analise.md` (risco de condição de corrida).
