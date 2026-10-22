# Versão inicial (IA) — Diagrama de Sequência: ONG aceita uma doação

> **Versão original gerada pela IA, sem nenhuma correção.** Não editar este arquivo.
> Ferramenta: Claude (Anthropic). Entrada fornecida: histórias de usuário, regras de negócio, riscos e
> decisões de `docs/analise.md` e `docs/projeto.md` (texto), **sem o código-fonte**.

```mermaid
sequenceDiagram
  actor ONG
  participant API
  participant Servico as Servico de doacoes
  participant Repo as Repositorio
  participant BD as Banco de dados

  ONG->>API: POST /api/doacoes/:id/aceitar (ong)
  API->>Servico: aceitar(id, ong)
  Servico->>Repo: buscarPorId(id)
  Repo->>BD: SELECT doacao
  BD-->>Repo: doacao
  Repo-->>Servico: doacao
  alt status = disponivel
    Servico->>Repo: atualizarStatus(id, aceita, ong)
    Repo->>BD: UPDATE status = aceita
    BD-->>Repo: ok
    Servico-->>API: doacao aceita
    API-->>ONG: 200 OK
  else status = aceita
    Servico-->>API: erro
    API-->>ONG: 409 Conflito
  end
```
