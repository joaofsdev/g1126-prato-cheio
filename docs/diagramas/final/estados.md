# Diagrama de Estados da doação (versão final)

Pergunta que responde: **quais estados uma doação pode assumir e quais eventos provocam as mudanças?**

```mermaid
stateDiagram-v2
  direction LR
  [*] --> disponivel: POST /api/doacoes (dados válidos e validade >= hoje)
  disponivel --> aceita: POST /api/doacoes/:id/aceitar (ONG informada e validade >= hoje)
  aceita --> [*]

  state "disponivel (vencida)" as vencida
  disponivel --> vencida: a data passa de validade (derivado, nada é gravado)
  vencida --> [*]

  note right of disponivel
    Só existem 2 valores gravados em status:
    'disponivel' e 'aceita' (CHECK da tabela doacoes).
    Publicação inválida (400) não cria doação.
  end note

  note right of vencida
    Continua com status 'disponivel' no banco, mas some da lista (Regra 1)
    e o aceite responde 409 "Doação vencida não pode ser aceita".
    A validade é o último dia de retirada: vencendo hoje ainda aparece.
  end note

  note right of aceita
    Estado final no sistema atual: guarda ong e aceita_em.
    Não implementado de propósito: Regra 3 (aceita e não retira,
    decisão da Marta) e histórias 4 e 8 (motorista confirma retirada).
  end note
```

Fontes: `migrations/001_cria_tabela_doacoes.sql` (CHECK de `status`), `src/repositorio.js`
(`listarDisponiveis`, `marcarComoAceita`), `src/doacoes.js` (`aceitar`, `validarDadosDoacao`),
`docs/analise.md` (Regras 1, 2 e 3).
