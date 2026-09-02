Documento de Análise — Prato Cheio

Trabalho 1 · máximo 4 páginas · entrega na Aula 5

Problema central

No Brasil, toneladas de alimentos em bom estado são descartadas diariamente por restaurantes, supermercados e produtores, enquanto ONGs e comunidades enfrentam insegurança alimentar. A dificuldade está na conexão rápida e confiável entre quem tem excedente e quem pode aproveitá-lo: o alimento é perecível e a janela de oportunidade é curta.

O Prato Cheio resolve esse problema criando um canal digital simples onde doadores publicam alimentos disponíveis e ONGs podem visualizá-los e aceitá-los antes que se percam.

Incertezas
Doadores terão disciplina para publicar doações com frequência?
As ONGs conseguirão buscar o alimento no tempo da validade informada?
Um fluxo sem autenticação (Unidade 1) é suficiente para validar o modelo?
Stakeholders
Stakeholder	Interesse	Influência	O que espera
Doador (restaurante, supermercado)	Reduzir desperdício, responsabilidade social	Alta — sem ele não há oferta	Cadastro rápido, sem burocracia
ONG / Instituição receptora	Receber alimentos para distribuição	Alta — sem ela não há demanda	Visualizar e aceitar doações de forma simples
Comunidade atendida	Acesso a alimentação	Baixa (indireta)	Mais refeições disponíveis
Equipe de desenvolvimento	Aprender e entregar	Média	Escopo factível, CI verde, código testado
Objetivos de impacto
Reduzir o tempo entre a disponibilidade de alimento excedente e sua destinação a quem precisa.
Dar visibilidade às doações disponíveis em tempo real.
Garantir que cada doação seja aceita por no máximo uma ONG (evitar conflito de retirada).
Regras de negócio
Uma doação possui: tipo de alimento, quantidade, validade e status.
Status possíveis: disponivel (padrão ao criar) e aceita.
Campos obrigatórios para publicar: tipo, quantidade, validade.
Uma doação aceita não pode ser aceita novamente por outra ONG.
Doações aceitas não aparecem na listagem de disponíveis.
Histórias de usuário
#	História (Como… quero… para…)	INVEST: o que falha
0.1	Como doador, quero publicar uma doação informando tipo, quantidade e validade, para que ONGs possam vê-la.	—
0.2	Como ONG, quero ver a lista de doações disponíveis, para escolher qual buscar.	—
0.3	Como ONG, quero aceitar uma doação, para reservá-la e retirá-la.	—
Critérios de aceite

História 0.1 — Publicar doação

Dado que o doador informa tipo, quantidade e validade válidos, quando ele publica, então a doação é criada com status disponivel.
Dado que algum campo obrigatório está ausente, quando ele tenta publicar, então o sistema recusa com erro.

História 0.2 — Listar disponíveis

Dado que existem doações publicadas e nenhuma foi aceita, quando uma ONG consulta, então todas aparecem.
Dado que uma doação foi aceita, quando uma ONG consulta, então ela não aparece na lista.

História 0.3 — Aceitar doação

Dado que a doação está disponível, quando a ONG aceita, então o status muda para aceita com o nome da ONG registrado.
Dado que a doação já foi aceita por outra ONG, quando uma segunda ONG tenta aceitar, então o sistema recusa.
Riscos
Risco	Probabilidade	Impacto	Mitigação concreta
Condição de corrida no aceite: duas ONGs enviam POST /api/doacoes/:id/aceitar quase ao mesmo tempo; a implementação original fazia ler status → checar → gravar em passos separados, então ambas podiam passar pela checagem antes de qualquer uma gravar.	Média (aumenta com o uso real, em produção)	Alto — duas ONGs se deslocam para retirar o mesmo lote	Implementado. marcarComoAceita agora faz um UPDATE atômico (UPDATE doacoes SET status='aceita', ong=? WHERE id=? AND status='disponivel') e checa alteradas (linhas afetadas): se zero, a doação já foi aceita e o sistema recusa. Coberto pelo teste "quando duas ONGs tentam aceitar ao mesmo tempo, só uma consegue" (tests/doacoes.test.js).
Doação vencida continua visível: listarDisponiveis() não filtra por validade, então uma ONG pode ver e tentar aceitar um alimento já impróprio para consumo.	Média	Alto — risco de segurança alimentar (envolve o regulador, Anvisa)	Adicionar filtro WHERE status = 'disponivel' AND validade >= date('now') na consulta, e um teste que publica uma doação com validade no passado e confirma que ela não aparece na listagem.
Falta de autenticação permite que qualquer pessoa aceite em nome de qualquer ONG	Alta (é o comportamento atual)	Médio	Aceito como limitação documentada da U1 (escopo do walking skeleton); autenticação simples por token de ONG entra no backlog da U2, registrada como decisão a revisitar no ADR.
Hipótese e experimento

Suposição do caso: "As ONGs conseguirão buscar o alimento no tempo da validade informada?" (ver Incertezas, acima) — hoje isso é uma crença não testada da equipe, não um fato verificado.

Hipótese testável: Se uma doação for publicada com pelo menos 2 horas de antecedência em relação ao horário de validade/coleta, então pelo menos 70% das doações publicadas serão aceitas por uma ONG antes de vencer.

Experimento:

Método: piloto controlado de 2 semanas com doadores e ONGs reais (parceiros já conhecidos pela equipe, ex. 2-3 restaurantes e 2-3 ONGs), usando o sistema em produção (Unidade 1/2).
Métricas coletadas: (1) % de doações aceitas antes da validade; (2) tempo mediano entre criada_em e o aceite; (3) nº de doações que expiraram sem aceite.
Como medir: consulta simples ao banco comparando criada_em, horário do aceite e validade de cada registro — não exige instrumentação nova, só os dados já persistidos pelo schema atual.
Critério de sucesso: ≥ 70% de doações aceitas antes do vencimento confirma a hipótese e valida seguir investindo no fluxo atual sem mudanças estruturais.
Critério de falha: < 50% indica que o problema não é só "ter um canal digital" — pode ser necessário adicionar notificações push/WhatsApp para ONGs (mudança de escopo a ser registrada em ADR na U2).
Decisão de análise
Problema: Falta de canal rápido entre doadores de alimentos e ONGs receptoras.
Alternativas: (1) Formulário via Google Forms — simples mas sem integração, sem atualização de status. (2) App mobile nativo — poderoso mas custo alto para MVP. (3) API REST com frontend leve — equilíbrio entre simplicidade e funcionalidade.
Decisão e justificativa: API REST + página web estática. Permite validar o fluxo ponta a ponta com o mínimo de infraestrutura e possibilita evolução incremental.
Riscos e limitações: Sem autenticação na U1; sem notificações; sem controle de validade automático.
Uso de IA

Documento gerado com auxílio de IA para estruturação e redação. O grupo revisou, ajustou o escopo e validou os critérios de aceite contra os testes do template.
