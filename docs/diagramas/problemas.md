# Avaliação crítica das versões geradas pela IA

Versões originais: [`ia-versao-inicial/estados.md`](ia-versao-inicial/estados.md) e
[`ia-versao-inicial/sequencia.md`](ia-versao-inicial/sequencia.md).
Versões corrigidas: [`final/estados.md`](final/estados.md) e [`final/sequencia.md`](final/sequencia.md).

## Problema 1 — Estados inventados e transição de regra ainda não decidida (Estados)

- **Problema:** a IA desenhou 7 estados (`Publicada`, `Disponivel`, `Aceita`, `Retirada`, `Expirada`,
  `Cancelada`) e a transição `Aceita → Disponivel` (ONG não retira no prazo). Só `disponivel` e `aceita`
  existem na implementação. `Retirada` vem das histórias 4 e 8 (não implementadas), `Cancelada` não
  aparece em nenhum requisito, e `Publicada` é um passo intermediário que não existe: a doação nasce
  `disponivel` ou nem é criada.
- **Justificativa:** `docs/analise.md` define a Regra 3 como **regra ausente**, a decidir pela Marta, e
  registra explicitamente que "voltar a ficar disponível" é uma *regra inventada* que **não** deve ser
  assumida. O diagrama da IA a trata como fato. Além disso, o `CHECK` da tabela `doacoes` só aceita os
  dois valores, então o diagrama contradiz o modelo de dados real.
- **Correção:** o diagrama final mantém só os estados gravados (`disponivel`, `aceita`) e a criação
  direta em `disponivel`. O que está fora do escopo (Regra 3, histórias 4 e 8) aparece como nota, e não
  como estado ou transição.

## Problema 2 — "Expirada" tratada como estado, mas é uma condição derivada (Estados)

- **Problema:** a IA modelou `Disponivel → Expirada` como transição disparada pelo tempo, como se o
  sistema gravasse esse estado.
- **Justificativa:** não há job que mude o `status`. Uma doação vencida **continua com `status =
  'disponivel'` no banco**; ela só deixa de aparecer porque a consulta filtra `validade >= CURRENT_DATE`
  (`src/repositorio.js`), e o aceite dela responde 409 "Doação vencida não pode ser aceita". Também há um
  detalhe que a IA perdeu: a validade é o **último dia de retirada**, então uma doação que vence hoje
  ainda aparece (decisão 5 de `docs/projeto.md`). Quem lesse o diagrama da IA esperaria um valor
  `expirada` na coluna e testes sobre uma transição que não existe.
- **Correção:** o diagrama final mostra "disponivel (vencida)" como estado derivado, com nota explicando
  que nada é gravado, quando ele passa a valer e o efeito (some da lista, aceite com 409).

## Problema 3 — Aceite desenhado como ler-checar-gravar, ignorando a atomicidade e a validade (Sequência)

- **Problema:** a IA mostra `buscarPorId` seguido de `atualizarStatus` condicionado ao status lido
  (`alt status = disponivel`). Na implementação, a decisão acontece **dentro do `UPDATE`**
  (`WHERE id = $2 AND status = 'disponivel' AND validade >= CURRENT_DATE`) e o serviço olha o número de
  linhas alteradas. A validade (Regra 1) também não aparece.
- **Justificativa:** ler-checar-gravar é exatamente a condição de corrida registrada em **Riscos** de
  `docs/analise.md`: duas ONGs poderiam passar pela checagem antes de qualquer uma gravar, violando a
  Regra 2 (uma doação, uma ONG). O diagrama da IA reproduz o desenho que o grupo já corrigiu, então
  comunicaria uma decisão de projeto errada.
- **Correção:** o diagrama final mostra o `UPDATE` atômico com as três condições e o ramo "0 linhas
  alteradas", que cobre tanto "perdeu a disputa" quanto "venceu".

## Problema 4 — Fluxos alternativos e de erro ausentes (Sequência)

- **Problema:** a IA só representou 200 e 409 ("já aceita"). Faltam 400 (id inválido, ONG vazia ou acima
  de 120 caracteres), 404 (doação inexistente), 503 (banco fora do ar), o 409 de "vencida" e a releitura
  após falha do `UPDATE`, que o serviço faz para escolher a mensagem certa para a ONG.
- **Justificativa:** o RNF1 de `docs/projeto.md` (confiabilidade) exige o status certo para cada erro, e
  há testes dedicados a cada um (`[0.3a]`, `[0.3b]`, `[5c]`, `[5d]`, `[6c]`, `Falha de banco`). Um diagrama
  sem esses caminhos esconde justamente o que o sistema trata com mais cuidado, e não permite conferir os
  testes com o fluxo.
- **Correção:** o diagrama final tem blocos `alt` para cada caminho, com o status HTTP, e uma nota sobre
  o 503 que vale para qualquer consulta ao banco.

## Conferência com requisitos e implementação

| Item do diagrama final | Confere com |
|---|---|
| Só `disponivel` e `aceita` gravados | `CHECK` em `migrations/001_cria_tabela_doacoes.sql` |
| "vencida" derivada, vence hoje ainda aparece | `listarDisponiveis`, decisão 5 em `docs/projeto.md`, testes `[6a]`–`[6c]` |
| Aceite atômico e 409 por motivo | `marcarComoAceita`, `aceitar`, critério `0.3b`, Riscos em `docs/analise.md` |
| Erros 400/404/409/503 | `src/erros.js`, middleware em `src/app.js`, RNF1 |
| Regra 3 e histórias 4 e 8 fora do modelo | seção "Fora do escopo" de `docs/projeto.md` |
