# Versão inicial (IA) — Diagrama de Estados da doação

> **Versão original gerada pela IA, sem nenhuma correção.** Não editar este arquivo.
> Ferramenta: Claude (Anthropic). Entrada fornecida: histórias de usuário, regras de negócio, conflitos e
> decisões de `docs/analise.md` e `docs/projeto.md` (texto), **sem o código-fonte**.

```mermaid
stateDiagram-v2
  [*] --> Publicada: doador publica a doação
  Publicada --> Disponivel: dados mínimos validados
  Disponivel --> Aceita: ONG aceita (Regra 2)
  Disponivel --> Expirada: validade passa (Regra 1)
  Aceita --> Retirada: motorista confirma a coleta (histórias 4 e 8)
  Aceita --> Disponivel: ONG não retira no prazo (Regra 3)
  Aceita --> Cancelada: ONG desiste
  Retirada --> [*]
  Expirada --> [*]
  Cancelada --> [*]
```
