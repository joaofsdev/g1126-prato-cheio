# Escolha dos diagramas e justificativa

O repositório já tem diagramas de **componentes** e de **dados (DER)** em
[`docs/projeto.md`](../projeto.md#diagramas). Por isso escolhemos dois tipos que respondem a perguntas
diferentes e que ainda não estavam documentados.

| Diagrama | Pergunta que responde | Por que é adequado ao Prato Cheio |
|---|---|---|
| **Estados (UML)** da doação | Quais estados uma doação pode assumir e quais eventos provocam as mudanças? | As regras centrais do negócio são regras de estado: Regra 1 (vencida não fica disponível), Regra 2 (aceita fica reservada a uma única ONG) e Regra 3 (ainda sem decisão). O diagrama separa o que está implementado do que não está. |
| **Sequência (UML)** do aceite | Como ONG, API, regras e banco interagem ao aceitar, e o que acontece em cada caminho de erro? | O aceite é a operação mais crítica (história 0): concorrência entre ONGs, validade e vários erros HTTP. Mostra a decisão de projeto do `UPDATE` atômico e os fluxos alternativos. |

Descartamos Classes (o modelo é uma tabela só) e Componentes/DER (já existem em `docs/projeto.md`).

Ferramenta de modelagem: **Mermaid** em arquivos Markdown (editável, versionável e renderizado pelo GitHub).
