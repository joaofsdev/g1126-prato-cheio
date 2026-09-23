# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Pedido do cliente e reformulação do problema

### Pedido inicial

"Precisamos de um aplicativo onde restaurantes e supermercados possam cadastrar alimentos que estão sobrando, para que ONGs encontrem essas doações e façam a retirada antes que os alimentos sejam descartados."

### Solução embutida no pedido

O pedido já pressupõe que a solução deve ser um aplicativo para cadastrar e consultar doações. Porém, definir um aplicativo antes de compreender completamente o problema pode limitar outras alternativas possíveis.

### Problema real

Restaurantes, supermercados e outros doadores possuem alimentos próprios para consumo que acabam sendo descartados porque não existe uma forma rápida e confiável de conectar esses excedentes às ONGs que conseguem recebê-los dentro do período adequado para consumo.

Portanto, o problema a ser resolvido não é "criar um aplicativo", mas reduzir a dificuldade e o tempo necessários para conectar alimentos excedentes a organizações capazes de aproveitá-los.

### Problema central

No Brasil, toneladas de alimentos em bom estado são descartadas diariamente por restaurantes, supermercados e produtores, enquanto ONGs e comunidades enfrentam insegurança alimentar. A dificuldade está na conexão rápida e confiável entre quem tem excedente e quem pode aproveitá-lo: o alimento é perecível e a janela de oportunidade é curta.

O Prato Cheio resolve esse problema criando um canal digital simples onde doadores publicam alimentos disponíveis e ONGs podem visualizá-los e aceitá-los antes que se percam.

## Incertezas

Antes de definir ou evoluir a solução, existem questões que precisam ser esclarecidas:

1. Os doadores terão disciplina para publicar as doações com frequência e com informações corretas?

2. As ONGs conseguirão buscar o alimento dentro do período de validade informado?

3. Um fluxo sem autenticação na Unidade 1 é suficiente para validar o modelo?

4. As ONGs consultarão o sistema com frequência suficiente para encontrar as doações antes que elas expirem?

5. Os doadores estarão dispostos a utilizar mais um canal digital no processo de destinação dos alimentos?

## Restrições

### Restrição de prazo

O projeto deve ser desenvolvido e entregue dentro do período definido para a disciplina, com evolução incremental ao longo das unidades.

Essa restrição limita soluções que demandem muito tempo de desenvolvimento, como um aplicativo mobile completo, integrações complexas ou uma infraestrutura de grande porte. Por isso, a solução inicial precisa ter um escopo reduzido e viável dentro do prazo disponível.

### Restrição técnica

Na Unidade 1, o projeto utiliza uma estrutura simples, com API REST, frontend leve e banco SQLite, sem mecanismos completos de autenticação.

Essa restrição limita funcionalidades que dependam de identificação segura dos usuários, controle avançado de permissões ou infraestrutura mais complexa. Essas funcionalidades podem ser incorporadas nas próximas evoluções do projeto.

### Restrição de negócio

Uma doação deve ser aceita por apenas uma ONG, evitando que duas instituições considerem o mesmo alimento reservado para retirada.

Essa restrição exige que a solução controle o estado da doação e impeça um segundo aceite depois que ela já estiver reservada. Portanto, qualquer alternativa de solução precisa garantir exclusividade no processo de aceite.

## Stakeholders

| Stakeholder | O que quer | Interesse | Influência | Consequência para a iteração 1 |
|---|---|---|---|---|
| Doadores (restaurantes, padarias e mercados) | Disponibilizar alimentos excedentes de forma rápida e com pouca burocracia. | Alto | Alto | A publicação da doação deve exigir poucas informações e ser simples de realizar. |
| ONGs e cozinhas comunitárias | Encontrar doações disponíveis a tempo e ter previsibilidade para organizar a retirada. | Alto | Alto | A iteração deve permitir visualizar as doações disponíveis e aceitar uma doação para retirada. |
| Motoristas voluntários | Conseguir utilizar o sistema pelo celular mesmo durante deslocamentos e com conexão instável. | Alto | Baixo | A solução deve funcionar no navegador do celular e manter uma interface simples e leve. |
| Marta (coordenadora) | Organizar a operação, acompanhar o crescimento do projeto e demonstrar seu impacto. | Alto | Alto | A iteração deve registrar informações básicas das doações e dos aceites, criando dados que possam ser acompanhados posteriormente. |
| Vigilância Sanitária | Garantir rastreabilidade mínima dos alimentos doados, incluindo informações como tipo, quantidade e validade. | Alto | Alto | A publicação deve registrar os dados mínimos necessários para identificar e acompanhar a doação. |
| Comunidade e pessoas beneficiadas* | Receber mais alimentos próprios para consumo por meio das organizações atendidas pelo projeto. | Alto | Baixo | A iteração deve priorizar um fluxo que reduza o tempo entre a disponibilização e o aceite da doação. |

\* **Stakeholder adicional identificado pelo grupo:** a comunidade e as pessoas beneficiadas não são apresentadas no caso como participantes diretos da operação do sistema, mas são diretamente afetadas pelo resultado do projeto, pois o aproveitamento das doações pode aumentar a quantidade de alimentos e refeições disponibilizados pelas organizações.

### Mapa de stakeholders

<img width="600" alt="Mapa de stakeholders em círculos concêntricos" src="https://github.com/user-attachments/assets/9657bf71-c3f4-4c43-b8bb-35712d838cdb" />

### Objetivos de impacto

- Reduzir o tempo entre a disponibilidade de alimento excedente e sua destinação a quem precisa.
- Dar visibilidade às doações disponíveis em tempo real.
- Garantir que cada doação seja aceita por no máximo uma ONG (evitar conflito de retirada).

## Regras de negócio

### Regra 1 — Doação expirada não deve permanecer disponível

**Onde estava:** comportamento esperado a partir da validade e da janela curta de retirada dos alimentos perecíveis.

**Enunciado explícito:** uma doação só pode permanecer disponível para aceite enquanto estiver dentro do seu período de validade ou da janela de retirada informada. Após esse período, ela não deve ser apresentada como disponível para novas aceitações.

**Como verificar:** cadastrar uma doação com validade ou janela de retirada encerrada e verificar que ela não aparece entre as doações disponíveis para aceite.

### Regra 2 — Uma doação aceita fica reservada para uma única ONG

**Onde estava:** comportamento atual do processo, no qual uma ONG precisa organizar a retirada após demonstrar interesse pela doação.

**Enunciado explícito:** quando uma ONG aceitar uma doação disponível, essa doação deve ficar reservada para ela e não poderá ser aceita por outra ONG.

**Como verificar:** disponibilizar uma doação, realizar o aceite por uma ONG e tentar realizar um segundo aceite. O segundo aceite deve ser impedido.

### Regra 3 — O que acontece quando uma ONG aceita e não realiza a retirada

**Tipo:** REGRA AUSENTE.

**Onde estava:** silêncio do caso. O caso informa que a ONG pode aceitar uma doação, mas não define o que deve acontecer caso ela não realize a retirada.

**Enunciado a decidir:** deve ser definido se uma doação aceita volta a ficar disponível, é cancelada ou permanece vinculada à ONG quando a retirada não acontece dentro do prazo.

**Como verificar:** após a decisão, aceitar uma doação e deixar o prazo de retirada expirar. O sistema deverá aplicar automaticamente o comportamento definido para essa situação.

**Quem decide:** Marta, como coordenadora da operação, em conjunto com as organizações participantes do piloto.

## Conflitos de prioridade

### Conflito — Simplicidade para o doador x rastreabilidade

**Fala do doador:** "Eu quero publicar uma doação rapidamente, preenchendo o mínimo possível de informações."

**Fala da Vigilância Sanitária:** "Eu preciso que cada doação tenha informações mínimas que permitam identificar e rastrear o alimento doado."

**Eixo do trade-off:** simplicidade e rapidez no cadastro x quantidade de informações necessárias para garantir rastreabilidade.

**O que o doador perde:** quanto mais campos obrigatórios existirem, maior será o tempo e o esforço necessários para publicar uma doação, aumentando a burocracia do processo.

**O que a Vigilância Sanitária perde:** se informações importantes não forem registradas, diminui a capacidade de identificar e rastrear adequadamente os alimentos doados.

**Critério de decisão:** na iteração 1, serão obrigatórios no cadastro apenas os dados mínimos necessários para a rastreabilidade da doação: tipo de alimento, quantidade e validade ou janela de retirada. Informações adicionais deverão ser opcionais enquanto não houver uma exigência que justifique torná-las obrigatórias.

**Saída escolhida:** conciliar. A solução mantém obrigatórios os dados mínimos necessários para a rastreabilidade e evita exigir informações adicionais que aumentariam a burocracia para o doador.

## Histórias de usuário

| # | História (Como… quero… para…) | INVEST: o que falha | Ação corretiva |
|---|---|---|---|
| 1 | Como doador, quero publicar uma doação informando os dados essenciais do alimento, para reduzir a chance de alimentos próprios para consumo serem descartados. | N — Negociável: a história já determina quais dados devem ser informados. | Mover os detalhes dos campos obrigatórios para os critérios de aceite e manter na história apenas o comportamento percebido pelo doador. |
| 2 | Como ONG, quero visualizar as doações disponíveis, para identificar rapidamente alimentos que possam ser retirados antes de perderem a validade. | T — Testável: “rapidamente” não possui uma medida objetiva. | Definir nos critérios de aceite uma condição mensurável para disponibilidade e tempo de resposta da consulta. |
| 3 ★ História 0 | Como ONG, quero aceitar uma doação disponível, para garantir sua retirada e evitar que o alimento seja desperdiçado. | I — Independente: depende da existência de uma doação previamente publicada. | Manter a dependência explícita e organizar o fluxo para que publicação e aceite formem uma fatia vertical executável. |
| 4 | Como motorista voluntário, quero confirmar a coleta pelo celular, para registrar a retirada mesmo durante meus deslocamentos. | T — Testável: a história não define como verificar o comportamento em uma conexão instável. | Levar para os critérios de aceite a condição de uso em celular e conexão instável, com ambiente e medida verificáveis. |
| 5 | Como Vigilância Sanitária, quero que as doações mantenham informações mínimas de rastreabilidade, para possibilitar a identificação do alimento doado quando necessário. | N — Negociável: definir campos específicos diretamente na história reduziria a possibilidade de negociação. | Manter a história focada na necessidade de rastreabilidade e definir os dados mínimos nos critérios de aceite conforme as regras do negócio. |
| 6 | Como ONG, quero visualizar doações disponíveis que ainda estejam dentro da janela de retirada, para escolher uma opção que possa ser coletada a tempo. | P — Pequena: esta linha é uma fatia derivada de uma história gigante. | Isolar apenas o caminho de descoberta das doações disponíveis, sem incluir aceite ou retirada. |
| 7 | Como ONG, quero aceitar uma doação disponível, para assumir a retirada daquele alimento antes que ele seja destinado a outra organização. | I — Independente: depende da existência de uma doação previamente publicada. | Manter a dependência explícita e tratar o aceite como uma fatia funcional própria, aplicando a regra de exclusividade. |
| 8 | Como motorista voluntário, quero confirmar a retirada de uma doação pelo celular, para registrar que o alimento foi coletado dentro da janela prevista. | T — Testável: precisa de uma condição observável para confirmar o momento da coleta. | Definir nos critérios de aceite o registro do horário da coleta e a condição de uso pelo celular em conexão instável. |

**Por que ela:** a História 0 escolhida foi o aceite de uma doação disponível por uma ONG, porque é a menor fatia capaz de demonstrar o fluxo central do Prato Cheio de ponta a ponta. Para isso, uma doação precisa existir, ser visualizada e aceita, e após o aceite ela não pode continuar disponível para outra ONG. Além disso, essa fatia deve registrar o instante da publicação e o instante do aceite, permitindo medir o tempo entre a disponibilização e a destinação da doação.

**O que ficou fora:** autenticação, notificações, filtros avançados, fotos, localização detalhada e outras melhorias que não são necessárias para provar o fluxo principal nesta primeira fatia.

**Por quê:** esses itens aumentariam o escopo da primeira entrega sem reduzir o principal risco que queremos validar agora. A História 0 deve permanecer pequena, mas suficiente para testar a regra central de exclusividade do aceite e começar a produzir a medição de tempo que ainda não existe.

## Critérios de aceite

Cada critério tem um código (ex.: `0.1a`) que aparece no nome do teste correspondente em `tests/doacoes.test.js`.

### História 0.1 — Publicar doação

- **0.1a** — Dado que o doador informa tipo, quantidade e validade válidos, quando ele publica, então a doação é criada com status `disponivel` e o instante da publicação (`criada_em`) é registrado.
- **0.1b** — Dado que algum campo obrigatório está ausente (ou a quantidade é zero), quando ele tenta publicar, então o sistema recusa com erro e nada é gravado.

### História 0.2 — Listar disponíveis

- **0.2a** — Dado que existem doações publicadas e nenhuma foi aceita, quando uma ONG consulta, então todas aparecem.
- **0.2b** — Dado que uma doação foi aceita, quando uma ONG consulta, então ela não aparece na lista.

### História 0.3 — Aceitar doação

- **0.3a** — Dado que a doação está disponível, quando a ONG aceita informando seu nome, então o status muda para `aceita` com o nome da ONG e o instante do aceite (`aceita_em`) registrados. Sem o nome da ONG, o aceite é recusado.
- **0.3b** — Dado que a doação já foi aceita por outra ONG, quando uma segunda ONG tenta aceitar, então o sistema recusa (HTTP 409) e mantém o primeiro aceite — inclusive quando os dois pedidos chegam ao mesmo tempo.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação concreta |
|---|---|---|---|
| Condição de corrida no aceite: duas ONGs enviam POST /api/doacoes/:id/aceitar quase ao mesmo tempo; a implementação original fazia ler status → checar → gravar em passos separados, então ambas podiam passar pela checagem antes de qualquer uma gravar. | Média (aumenta com o uso real, em produção) | Alto — duas ONGs se deslocam para retirar o mesmo lote | Implementado. marcarComoAceita agora faz um UPDATE atômico (`UPDATE doacoes SET status='aceita', ong=?, aceita_em=datetime('now') WHERE id=? AND status='disponivel'`) e checa alteradas (linhas afetadas): se zero, a doação já foi aceita e o sistema recusa com HTTP 409. Coberto pelo teste "quando duas ONGs tentam aceitar ao mesmo tempo, só uma consegue" (tests/doacoes.test.js). |
| Doação vencida continua visível: listarDisponiveis() não filtra por validade, então uma ONG pode ver e tentar aceitar um alimento já impróprio para consumo. | Média | Alto — risco de segurança alimentar (envolve o regulador, Anvisa) | **Não implementado na História 0** (os critérios 0.1–0.3 não cobrem validade; é a Regra 1). Próximo passo: filtrar `WHERE status = 'disponivel' AND validade >= date('now')` em `listarDisponiveis()` e um teste que publica uma doação com validade no passado e confirma que ela não aparece. |
| Falta de autenticação permite que qualquer pessoa aceite em nome de qualquer ONG | Alta (é o comportamento atual) | Médio | Aceito como limitação documentada da U1 (escopo do walking skeleton); autenticação simples por token de ONG entra no backlog da U2, registrada como decisão a revisitar no ADR. Na U1 o nome da ONG é obrigatório no aceite (critério 0.3a), mas não é verificado. |

## Hipótese e experimento

**Suposição do caso:** "As ONGs conseguirão buscar o alimento no tempo da validade informada?" (ver Incertezas, acima) — hoje isso é uma crença não testada da equipe, não um fato verificado.

**Hipótese testável:** Se uma doação for publicada com pelo menos 2 horas de antecedência em relação ao horário de validade/coleta, então pelo menos 70% das doações publicadas serão aceitas por uma ONG antes de vencer.

**Experimento:**

- **Método:** piloto controlado de 2 semanas com doadores e ONGs reais (parceiros já conhecidos pela equipe, ex. 2-3 restaurantes e 2-3 ONGs), usando o sistema em produção (Unidade 1/2).
- **Métricas coletadas:** (1) % de doações aceitas antes da validade; (2) tempo mediano entre `criada_em` e `aceita_em`; (3) nº de doações que expiraram sem aceite.
- **Como medir:** consulta simples ao banco comparando `criada_em`, `aceita_em` e `validade` de cada registro. Os dois instantes já são gravados pela História 0 (colunas do schema em `src/db.js`), então o experimento não exige instrumentação nova.
- **Critério de sucesso:** ≥ 70% de doações aceitas antes do vencimento confirma a hipótese e valida seguir investindo no fluxo atual sem mudanças estruturais.
- **Critério de falha:** < 50% indica que o problema não é só "ter um canal digital" — pode ser necessário adicionar notificações push/WhatsApp para ONGs (mudança de escopo a ser registrada em ADR na U2).

## Decisão de análise

- **Problema:** Falta de canal rápido entre doadores de alimentos e ONGs receptoras.
- **Alternativas:** (1) Formulário via Google Forms — simples mas sem integração, sem atualização de status. (2) App mobile nativo — poderoso mas custo alto para MVP. (3) API REST com frontend leve — equilíbrio entre simplicidade e funcionalidade.
- **Decisão e justificativa:** API REST + página web estática. Permite validar o fluxo ponta a ponta com o mínimo de infraestrutura e possibilita evolução incremental.
- **Riscos e limitações:** Sem autenticação na U1; sem notificações; sem controle de validade automático (Regra 1 fica para a próxima iteração — ver Riscos); sem decisão sobre a ONG que aceita e não retira (Regra 3, regra ausente).

## Rastreabilidade

Como o que foi implementado se liga às histórias, regras e critérios. Os testes estão em `tests/doacoes.test.js` e citam o código do critério no nome.

| Critério | História / regra | Onde está implementado | Teste(s) |
|---|---|---|---|
| 0.1a — publica com status `disponivel` e registra `criada_em` | História 1 · conflito (dados mínimos) | `POST /api/doacoes` → `criarDoacao` → `repositorio.inserir` | `[0.1a] cria a doação com status disponivel…` |
| 0.1b — recusa sem campo obrigatório | Conflito doador x Vigilância (dados mínimos obrigatórios) · História 5 | `validarDadosDoacao` em `src/doacoes.js` | `[0.1b] recusa doação sem tipo / quantidade / validade`, `recusa quantidade zero`, `não grava nada…` |
| 0.2a — todas as disponíveis aparecem | História 2 | `GET /api/doacoes` → `listarDisponiveis` | `[0.2a] mostra todas as doações publicadas…` |
| 0.2b — aceita some da lista | Regra 2 | `WHERE status = 'disponivel'` em `repositorio.listarDisponiveis` | `[0.2b] a doação aceita sai da lista…` |
| 0.3a — aceita com ONG e `aceita_em` | ★ História 0 · hipótese (medição de tempo) | `POST /api/doacoes/:id/aceitar` → `aceitar` → `marcarComoAceita` | `[0.3a] muda o status para aceita…`, `[0.3a] recusa o aceite quando a ONG não é informada` |
| 0.3b — segundo aceite recusado | Regra 2 · restrição de negócio · risco de condição de corrida | `UPDATE … WHERE status = 'disponivel'` atômico; HTTP 409 | `[0.3b] recusa aceitar…`, `mantém o primeiro aceite…`, `duas ONGs ao mesmo tempo…` |

**Fora da História 0 (não implementado, de propósito):** Regra 1 (doação vencida), Regra 3 (regra ausente — aguarda decisão da Marta), histórias 4 e 8 (motorista voluntário) e autenticação.

## Uso de IA

A IA foi utilizada como apoio para gerar e revisar histórias de usuário. As sugestões foram confrontadas com o caso, com o mapa de stakeholders e com os critérios INVEST antes de serem aceitas pelo grupo.

### História #1

**O que a IA sugeriu:** incluir diretamente na história os dados que deveriam ser informados na publicação da doação.

**O que o grupo mudou:** decidimos manter a história focada na necessidade do doador e deixar os detalhes dos campos obrigatórios para os critérios de aceite.

**Por quê:** especificar campos diretamente na história reduz sua característica Negociável (N). Os detalhes podem ser definidos posteriormente de maneira verificável nos critérios de aceite.

### História #2

**O que a IA sugeriu:** utilizar a expressão "rapidamente" para representar a necessidade da ONG de encontrar doações em tempo hábil.

**O que o grupo mudou:** identificamos que "rapidamente" não possui uma medida objetiva e decidimos que o tempo esperado deve ser definido nos critérios de aceite.

**Por quê:** a expressão prejudica a Testabilidade (T), pois pessoas diferentes poderiam interpretar "rapidamente" de maneiras diferentes.

### História #3 — marcada como ★ História 0

**O que a IA sugeriu:** remover a história de aceite porque ela depende da existência de uma doação previamente publicada e, portanto, não seria totalmente Independente (I).

**O que o grupo mudou:** rejeitamos a sugestão de remoção e mantivemos a história, tornando sua dependência explícita.

**Por quê:** o aceite exerce uma regra central do negócio, pois uma doação aceita não pode continuar disponível para outra ONG. Além disso, essa fatia permite registrar os instantes da publicação e do aceite para iniciar a medição do tempo do processo.

### Regra inventada identificada

Durante a revisão, foi considerada a possibilidade de uma doação aceita voltar automaticamente a ficar disponível caso a ONG não realize a retirada dentro do prazo.

Essa regra não está definida no caso e, portanto, não foi assumida como requisito. Ela foi registrada como uma regra ausente. A decisão sobre o comportamento correto deve ser tomada por Marta, como coordenadora da operação, em conjunto com as organizações participantes do piloto.

### Restrições preservadas após a revisão

A revisão também identificou o risco de gerar histórias genéricas e deixar de considerar restrições específicas do caso. Por isso, o grupo manteve explícitas as condições relevantes para o projeto, principalmente o uso pelo celular com conexão instável pelos motoristas voluntários. As demais restrições do piloto, como orçamento próximo de zero, ausência de integração com sistemas dos restaurantes e execução inicial em apenas um bairro, continuam sendo consideradas como limites da solução, mesmo quando não aparecem diretamente em todas as histórias.