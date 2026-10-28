
# Avaliação crítica das versões geradas pela IA

Versões originais: [`ia-versao-inicial/estados.md`](ia-versao-inicial/estados.md) e
[`ia-versao-inicial/sequencia.md`](ia-versao-inicial/sequencia.md).

Versões corrigidas: [`final/estados.md`](final/estados.md) e
[`final/sequencia.md`](final/sequencia.md).

## Contexto da avaliação

A avaliação crítica inicial foi realizada considerando as funcionalidades existentes no projeto naquele momento, principalmente a publicação e o aceite de doações.

Posteriormente, a História 8 — Confirmação de retirada de doação por motorista voluntário — foi implementada na branch `feat/confirmar-retirada-doacao`.

Por esse motivo, esta documentação distingue os problemas identificados nas versões inicialmente geradas pela IA das atualizações necessárias para representar a evolução posterior do sistema.

## Problema 1 — Estados inventados e transição de regra ainda não decidida (Estados)

- **Problema:** a IA desenhou estados como `Publicada`, `Disponivel`, `Aceita`, `Retirada`, `Expirada` e `Cancelada`, além da transição `Aceita → Disponivel` quando a ONG não realiza a retirada no prazo. Na implementação original, somente `disponivel` e `aceita` eram persistidos. `Cancelada` não estava prevista nos requisitos, e `Publicada` não correspondia a um estado intermediário existente.
- **Justificativa:** `docs/analise.md` identifica a Regra 3 como uma decisão de negócio pendente. Portanto, permitir que uma doação aceita volte automaticamente a ficar disponível seria assumir uma regra ainda não definida. Além disso, o esquema inicial do banco não permitia os estados adicionais.
- **Correção:** a primeira revisão limitou o fluxo aos estados implementados e identificou as funcionalidades fora do escopo. Posteriormente, com a implementação da História 8, o estado `retirada` passou a ter respaldo no código e na migração do banco, sendo incorporado à versão final atualizada. Os demais estados e a transição de retorno continuam sem implementação.

## Problema 2 — "Expirada" tratada como estado persistido, mas é uma condição derivada (Estados)

- **Problema:** a IA representou `Disponivel → Expirada` como uma mudança de estado provocada pelo tempo, sugerindo que o sistema atualizaria o campo `status`.
- **Justificativa:** não existe uma rotina que altere automaticamente o status de uma doação vencida. O registro permanece com `status = 'disponivel'`, mas deixa de aparecer na listagem porque `listarDisponiveis` utiliza a condição `validade >= CURRENT_DATE`. Uma tentativa de aceite após o vencimento retorna HTTP 409. A validade inclui o próprio dia do vencimento.
- **Correção:** o diagrama final identifica `disponivel (vencida)` como uma condição derivada, esclarecendo que não corresponde a um novo valor persistido no banco.

## Problema 3 — Aceite representado sem a proteção atômica contra concorrência (Sequência)

- **Problema:** a IA representou uma consulta ao registro seguida de uma atualização baseada no estado previamente consultado, sem demonstrar que a condição de disponibilidade também precisava ser verificada na operação de escrita.
- **Justificativa:** duas ONGs poderiam consultar simultaneamente uma doação disponível. Caso a atualização não verificasse novamente o estado, ambas poderiam tentar efetivar o aceite. Isso contrariaria a regra de que uma doação somente pode ser aceita por uma ONG.
- **Correção:** o diagrama final representa a operação `UPDATE` com as condições `status = 'disponivel'` e `validade >= CURRENT_DATE`, além da verificação da quantidade de linhas alteradas. A decisão efetiva ocorre no banco, impedindo dois aceites simultâneos.

## Problema 4 — Ausência de fluxos alternativos e tratamento de erros (Sequência)

- **Problema:** a versão inicial da IA representava principalmente o caminho de sucesso e o conflito de doação já aceita, deixando de detalhar outros cenários.
- **Justificativa:** a implementação possui validações e respostas específicas para identificadores inválidos, ONG não informada, doações inexistentes, doações vencidas e falhas de acesso ao banco. A ausência desses caminhos dificultaria relacionar o diagrama aos requisitos e testes.
- **Correção:** o diagrama final passou a representar as respostas HTTP 400, 404 e 409, a consulta adicional realizada após falha do aceite e a possibilidade de HTTP 503 em falhas de conexão com o banco.

## Evolução posterior — História 8: confirmação de retirada

### Contexto

A primeira versão final dos diagramas considerava a doação aceita como o último estado implementado no sistema.

Entretanto, a História 8 introduziu uma nova operação: a confirmação de retirada de uma doação previamente aceita, realizada por um motorista voluntário.

Essa funcionalidade foi desenvolvida na branch `feat/confirmar-retirada-doacao` e integrada à `main` pelo PR #10.

### Evolução 1 — Inclusão do estado `retirada`

- **Situação anterior:** o diagrama final de Estados encerrava o ciclo da doação em `aceita` e indicava que a retirada não estava implementada.
- **Mudança no projeto:** a História 8 implementou a transição `aceita → retirada`, mediante confirmação de um motorista voluntário.
- **Justificativa:** a representação anterior deixou de abranger o fluxo desenvolvido. Manter `aceita` como estado terminal impediria compreender o ciclo completo previsto na nova implementação.
- **Atualização realizada:** foi acrescentado o estado `retirada`, alcançado exclusivamente a partir de `aceita`. Também foram documentados os campos `motorista` e `retirada_em` e a impossibilidade de confirmar uma retirada duplicada.

### Evolução 2 — Ampliação do Diagrama de Sequência

- **Situação anterior:** o diagrama final de Sequência descrevia apenas o aceite de uma doação pela ONG.
- **Mudança no projeto:** a História 8 acrescentou o endpoint `POST /api/doacoes/:id/retirar`, com validações específicas e persistência da confirmação.
- **Justificativa:** o novo fluxo envolve uma operação diferente do aceite, com outro responsável, outra transição de estado e tratamento próprio de conflitos.
- **Atualização realizada:** foi acrescentado um segundo fluxo de sequência, demonstrando a interação entre motorista, API Express, serviço de regras de negócio, repositório e PostgreSQL.

### Evolução 3 — Proteção contra confirmações duplicadas

- **Situação anterior:** a documentação de concorrência estava concentrada no aceite realizado pelas ONGs.
- **Mudança no projeto:** a confirmação de retirada passou a exigir proteção semelhante, evitando que dois motoristas confirmem a mesma retirada.
- **Justificativa:** a simples consulta do estado antes da atualização não seria suficiente para impedir uma condição de corrida.
- **Atualização realizada:** o diagrama de Sequência representa a atualização condicional:

```sql
UPDATE doacoes
SET status = 'retirada',
    motorista = $1,
    retirada_em = now()
WHERE id = $2
  AND status = 'aceita';
```

A operação somente é considerada bem-sucedida quando uma linha é alterada. Caso contrário, o serviço retorna HTTP 409.

### Evolução 4 — Validações e rastreabilidade da retirada

A História 8 também introduziu validações e informações necessárias para a rastreabilidade da operação:

- O motorista deve ser informado e seu nome não pode ultrapassar 120 caracteres.
- A doação precisa existir e estar no estado `aceita`.
- Doações ainda disponíveis não podem ter a retirada confirmada.
- Doações já retiradas não podem receber uma segunda confirmação.
- O banco registra o motorista responsável e a data/hora da retirada.
- A confirmação bem-sucedida retorna HTTP 200 com os dados atualizados da doação.

Essas regras foram incorporadas aos diagramas finais para representar o comportamento desenvolvido.

## Conferência com requisitos e implementação

| Item documentado | Evidência |
|---|---|
| Criação de doação com status `disponivel` | `src/doacoes.js`, `src/repositorio.js` |
| Aceite exclusivo por uma ONG | `marcarComoAceita`, Regra 2 de `docs/analise.md` |
| Validade como condição derivada | `listarDisponiveis`, `docs/projeto.md` |
| Tratamento dos erros de aceite | `src/app.js`, `src/doacoes.js`, `src/erros.js` |
| Inclusão do estado `retirada` | `migrations/002_adiciona_confirmacao_retirada.sql` |
| Confirmação de retirada | `confirmarRetirada`, `marcarComoRetirada` |
| Endpoint de retirada | `POST /api/doacoes/:id/retirar` em `src/app.js` |
| Prevenção de retirada duplicada | `UPDATE` condicional com `status = 'aceita'` |
| Registro do motorista e da data da retirada | Campos `motorista` e `retirada_em` |
| Regra 3 ainda pendente | `docs/analise.md` |

Os itens da História 8 estão integrados à `main` desde o PR #10.

## Reflexão sobre os diagramas

**Qual dos dois diagramas foi mais útil para compreender ou questionar uma decisão do projeto? Por quê?**

O Diagrama de Estados foi especialmente útil porque permitiu visualizar a evolução do ciclo de vida de uma doação e identificar quais transições realmente possuem respaldo nas regras de negócio e na implementação.

Na versão inicial, havia estados e transições que ainda não existiam no sistema. A análise mostrou a importância de diferenciar requisitos previstos, decisões pendentes e funcionalidades implementadas.

Com a História 8, o mesmo diagrama também permitiu identificar a necessidade de acrescentar o estado `retirada`, sem introduzir comportamentos não autorizados, como devolver automaticamente uma doação aceita ao estado disponível.

O Diagrama de Sequência complementou essa análise ao demonstrar como as operações são executadas e como o PostgreSQL impede confirmações simultâneas. Dessa forma, os dois diagramas contribuíram para verificar a consistência entre regras de negócio, arquitetura e implementação.