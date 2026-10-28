
# Escolha dos diagramas e justificativa

O repositório do Prato Cheio já possui diagramas de **componentes** e de **dados (DER)** em [`docs/projeto.md`](../projeto.md#diagramas). Por isso, foram escolhidos dois tipos de diagramas UML que respondem a perguntas diferentes e complementares sobre o funcionamento do sistema.

| Diagrama | Pergunta que responde | Por que é adequado ao Prato Cheio |
|---|---|---|
| **Estados (UML)** da doação | Quais estados uma doação pode assumir e quais eventos provocam as mudanças? | As principais regras de negócio envolvem o ciclo de vida das doações: disponibilidade, validade, aceite exclusivo por uma ONG e confirmação de retirada por motorista voluntário. O diagrama permite distinguir estados persistidos, condições derivadas e transições ainda não implementadas. |
| **Sequência (UML)** do aceite e da retirada | Como os participantes e componentes do sistema interagem durante o aceite e a confirmação de retirada, incluindo os caminhos alternativos e de erro? | O aceite e a retirada são operações críticas porque dependem do estado atual da doação e precisam impedir confirmações simultâneas ou duplicadas. O diagrama demonstra a comunicação entre API, serviço, repositório e PostgreSQL, destacando validações, respostas HTTP e atualizações atômicas. |

## Justificativa do Diagrama de Estados

O Diagrama de Estados foi escolhido porque permite representar as regras de negócio relacionadas às mudanças de situação de uma doação.

Na implementação original, o sistema contemplava os estados `disponivel` e `aceita`. A validade da doação era tratada como uma condição derivada, sem criar um novo estado persistido no banco.

Com a implementação da História 8, o ciclo de vida foi ampliado para incluir o estado `retirada`, alcançado somente após a confirmação por um motorista voluntário.

Esse diagrama também ajuda a identificar comportamentos que ainda não possuem definição ou implementação, como a possibilidade de uma doação aceita voltar a ficar disponível quando a ONG não realiza a retirada.

Dessa forma, o modelo contribui para evitar a inclusão de transições não autorizadas pelas regras de negócio.

## Justificativa do Diagrama de Sequência

O Diagrama de Sequência foi escolhido para representar como as operações são executadas pelos diferentes componentes do sistema.

O fluxo de aceite demonstra a interação entre ONG, API Express, serviço de regras de negócio, repositório SQL e PostgreSQL.

A atualização condicional do banco garante que uma doação disponível seja aceita por apenas uma ONG, mesmo quando existem solicitações simultâneas.

A História 8 acrescentou a confirmação de retirada pelo motorista voluntário, que utiliza a mesma arquitetura, mas possui validações e condições próprias.

Nesse fluxo, somente doações no estado `aceita` podem passar para `retirada`. A atualização condicional impede que duas confirmações sejam efetivadas para a mesma doação.

O diagrama também permite visualizar os retornos HTTP associados às validações, à inexistência de registros e aos conflitos de estado.

## Complementaridade dos diagramas

Os dois diagramas respondem a perguntas diferentes:

- O **Diagrama de Estados** mostra quais mudanças de situação são permitidas durante o ciclo de vida de uma doação.
- O **Diagrama de Sequência** mostra como essas mudanças são executadas pelos componentes do sistema e quais validações são realizadas.

A análise conjunta permite verificar se as transições representadas no modelo de estados possuem operações correspondentes na implementação e se os fluxos técnicos respeitam as regras de negócio.

## Evolução da História 8

A revisão posterior dos diagramas considerou a implementação da História 8, desenvolvida na branch `feat/confirmar-retirada-doacao`.

A PR foi integrada à `main` (PR #10), e a confirmação de retirada faz parte do comportamento atual do sistema.

Essa distinção permite documentar a evolução do projeto sem confundir funcionalidades já presentes na branch principal com alterações em processo de revisão.

## Ferramentas utilizadas

- **Claude (Anthropic):** geração das versões iniciais dos diagramas.
- **ChatGPT (OpenAI):** apoio à revisão posterior dos diagramas para contemplar a História 8.
- **Mermaid:** modelagem dos diagramas em arquivos Markdown editáveis, versionáveis e renderizados pelo GitHub.

As versões originais geradas pela IA foram preservadas em `docs/diagramas/ia-versao-inicial/`. As versões revisadas estão disponíveis em `docs/diagramas/final/`.