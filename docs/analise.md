# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

No Brasil, toneladas de alimentos em bom estado são descartadas diariamente por restaurantes, supermercados e produtores, enquanto ONGs e comunidades enfrentam insegurança alimentar. A dificuldade está na **conexão rápida e confiável** entre quem tem excedente e quem pode aproveitá-lo: o alimento é perecível e a janela de oportunidade é curta.

O Prato Cheio resolve esse problema criando um canal digital simples onde doadores publicam alimentos disponíveis e ONGs podem visualizá-los e aceitá-los antes que se percam.

## Incertezas

- Doadores terão disciplina para publicar doações com frequência?
- As ONGs conseguirão buscar o alimento no tempo da validade informada?
- Um fluxo sem autenticação (Unidade 1) é suficiente para validar o modelo?

## Stakeholders

| Stakeholder | Interesse | Influência | O que espera |
|---|---|---|---|
| Doador (restaurante, supermercado) | Reduzir desperdício, responsabilidade social | Alta — sem ele não há oferta | Cadastro rápido, sem burocracia |
| ONG / Instituição receptora | Receber alimentos para distribuição | Alta — sem ela não há demanda | Visualizar e aceitar doações de forma simples |
| Comunidade atendida | Acesso a alimentação | Baixa (indireta) | Mais refeições disponíveis |
| Equipe de desenvolvimento | Aprender e entregar | Média | Escopo factível, CI verde, código testado |

## Objetivos de impacto

1. Reduzir o tempo entre a disponibilidade de alimento excedente e sua destinação a quem precisa.
2. Dar visibilidade às doações disponíveis em tempo real.
3. Garantir que cada doação seja aceita por no máximo uma ONG (evitar conflito de retirada).

## Regras de negócio

- Uma doação possui: tipo de alimento, quantidade, validade e status.
- Status possíveis: `disponivel` (padrão ao criar) e `aceita`.
- Campos obrigatórios para publicar: tipo, quantidade, validade.
- Uma doação aceita não pode ser aceita novamente por outra ONG.
- Doações aceitas não aparecem na listagem de disponíveis.

## Histórias de usuário

| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|
| 0.1 | Como doador, quero publicar uma doação informando tipo, quantidade e validade, para que ONGs possam vê-la. | — |
| 0.2 | Como ONG, quero ver a lista de doações disponíveis, para escolher qual buscar. | — |
| 0.3 | Como ONG, quero aceitar uma doação, para reservá-la e retirá-la. | — |

## Critérios de aceite

**História 0.1 — Publicar doação**
- Dado que o doador informa tipo, quantidade e validade válidos, quando ele publica, então a doação é criada com status `disponivel`.
- Dado que algum campo obrigatório está ausente, quando ele tenta publicar, então o sistema recusa com erro.

**História 0.2 — Listar disponíveis**
- Dado que existem doações publicadas e nenhuma foi aceita, quando uma ONG consulta, então todas aparecem.
- Dado que uma doação foi aceita, quando uma ONG consulta, então ela não aparece na lista.

**História 0.3 — Aceitar doação**
- Dado que a doação está disponível, quando a ONG aceita, então o status muda para `aceita` com o nome da ONG registrado.
- Dado que a doação já foi aceita por outra ONG, quando uma segunda ONG tenta aceitar, então o sistema recusa.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| SQLite não escala para produção | Baixa (na U1) | Baixo | Migração planejada para PostgreSQL na U3 |
| Falta de autenticação permite abuso | Média | Médio | Aceito na U1; autenticação será adicionada em U2/U3 |
| Doação expirada não é retirada da lista | Média | Baixo | Pode ser tratada em iteração futura (filtro por validade) |

## Hipótese e experimento

**Hipótese:** Se oferecermos uma interface simples (API + página web) para publicar e aceitar doações, doadores e ONGs serão capazes de coordenar a transferência de alimentos antes do vencimento.

**Experimento:** O walking skeleton prova a viabilidade técnica — uma doação percorre toda a arquitetura (API → negócio → banco → resposta) e o fluxo completo funciona ponta a ponta.

## Decisão de análise

- **Problema:** Falta de canal rápido entre doadores de alimentos e ONGs receptoras.
- **Alternativas:** (1) Formulário via Google Forms — simples mas sem integração, sem atualização de status. (2) App mobile nativo — poderoso mas custo alto para MVP. (3) API REST com frontend leve — equilíbrio entre simplicidade e funcionalidade.
- **Decisão e justificativa:** API REST + página web estática. Permite validar o fluxo ponta a ponta com o mínimo de infraestrutura e possibilita evolução incremental.
- **Riscos e limitações:** Sem autenticação na U1; sem notificações; sem controle de validade automático.

## Uso de IA

Documento gerado com auxílio de IA para estruturação e redação. O grupo revisou, ajustou o escopo e validou os critérios de aceite contra os testes do template.
