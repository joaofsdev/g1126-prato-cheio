# ADR 0004 — Reavaliação do banco para uso em várias cidades

- **Data:** 2026-10-28
- **Status:** proposto (revisa o [ADR 0002](0002-migracao-sqlite-para-postgresql.md), que continua valendo
  e fica preservado como histórico)

## Contexto

O ADR 0002 escolheu PostgreSQL 16 para um piloto em **um único bairro**. O cenário mudou:

> O Prato Cheio, inicialmente desenvolvido para um único bairro, será utilizado por ONGs e doadores de
> várias cidades, com acessos simultâneos e maior volume de doações.

A arquitetura atual tem suposições que só valem para um bairro:

| Suposição atual | Onde está | Por que deixa de valer |
|---|---|---|
| A ONG vê todas as doações disponíveis | `GET /api/doacoes` → `listarDisponiveis` (`src/repositorio.js:15`), sem filtro de local nem paginação | Uma ONG de uma cidade não consegue retirar doação de outra, e a lista cresce com todas as cidades juntas |
| Não existe a noção de cidade | tabela `doacoes` (`migrations/001_cria_tabela_doacoes.sql`) | Não há como filtrar nem indexar por local |
| O índice cobre a listagem | `idx_doacoes_status_validade (status, validade)` | Com várias cidades, a consulta passa a filtrar também por cidade |
| Um servidor basta | pool do `pg` com o tamanho padrão de 10 conexões, sem configuração (`src/db.js:47`) | Mais acessos simultâneos pedem mais conexões, ou várias cópias da aplicação |
| Só um processo aplica migrations | `src/migrar.js`, sem trava (limite já registrado no ADR 0002) | Várias cópias da aplicação subindo juntas podem tentar migrar ao mesmo tempo |
| Não há autenticação | risco registrado em `docs/analise.md` | Com mais ONGs, aumenta a chance de alguém aceitar em nome de outra |

## Novos requisitos

1. **Escopo por cidade:** doadores e ONGs trabalham com as doações da sua cidade.
2. **Acessos simultâneos:** várias ONGs, de várias cidades, consultando e aceitando ao mesmo tempo, sem
   que duas aceitem a mesma doação (Regra 2 continua valendo).
3. **Volume crescente:** o histórico não pode ser apagado, porque a Vigilância Sanitária consulta
   qualquer doação pelo número, em qualquer status (História 5).

## Impacto na decisão atual

- **Acessos simultâneos.** O aceite é um único `UPDATE … WHERE status = 'disponivel'`
  (`src/repositorio.js:32`), e quem garante a exclusividade é o PostgreSQL, travando só a linha da
  doação. Isso continua correto com qualquer número de cópias da aplicação, porque elas não guardam
  estado próprio: tudo passa pelo banco. O ponto fraco passa a ser o **número de conexões**, não a
  correção.
- **Mais dados.** A listagem sem filtro e sem paginação devolve tudo o que está disponível em todas as
  cidades. O custo cresce com a tabela e o tamanho da resposta também. O índice atual não ajuda a
  separar por cidade.
- **Histórico.** A consulta pelo número (`WHERE id = $1`) usa a chave primária e continua rápida mesmo
  com muitas linhas.

## Alternativas consideradas

1. **Manter um PostgreSQL só, com ajustes** — coluna de cidade, índice, paginação, pool configurável.
2. **PostgreSQL com réplicas de leitura ou tabela particionada por cidade** — leituras vão para as
   réplicas; a tabela é dividida por cidade.
3. **Um banco por cidade** — cada cidade com seu próprio PostgreSQL.
4. **Trocar por um banco NoSQL** (ex.: MongoDB) — esquema flexível e escala horizontal nativa.

## Trade-offs

| Critério | 1. PostgreSQL com ajustes | 2. Réplicas / partições | 3. Banco por cidade | 4. NoSQL |
|---|---|---|---|---|
| Garantia do aceite único (Regra 2) | mantida (trava por linha) | mantida, se o aceite for sempre no primário | mantida dentro de cada cidade | precisa ser refeita com outro mecanismo |
| Código e testes atuais | reaproveitados | reaproveitados, mais roteamento de leitura | reaproveitados, mais escolha do banco por cidade | reescritos |
| Complexidade de operação | baixa | média | alta (N bancos para migrar e monitorar) | média, e nova para o time |
| Relatórios entre cidades (Marta) | uma consulta | uma consulta | juntar N bancos | possível, com outra linguagem de consulta |
| Atende ao volume esperado | sim, enquanto um servidor aguentar | sim, com folga | sim | sim |
| Custo de voltar atrás | baixo | médio | alto | alto |

## Decisão (proposta)

**Manter o PostgreSQL (alternativa 1)**, com estes ajustes:

1. **Cidade nas doações:** migration nova (`003_…sql`) com a coluna `cidade` e o índice
   `(cidade, status, validade)`, que atende à listagem filtrada e ordenada por validade.
2. **Listagem filtrada e paginada:** `GET /api/doacoes?cidade=…&limite=…` em vez de devolver tudo.
3. **Pool configurável:** tamanho do pool do `pg` lido de variável de ambiente, em vez do padrão fixo.
4. **Várias cópias da aplicação:** a aplicação não guarda estado próprio, então pode rodar em mais de uma
   instância atrás de um balanceador sem mudar as regras.
5. **Migrations seguras com várias cópias:** `pg_advisory_lock` no `src/migrar.js`, como o ADR 0002 já
   previa.
6. **PostgreSQL gerenciado em produção:** backups e monitoramento sem o time operar o servidor.

A alternativa 2 fica como **próximo passo**, adotada quando algum gatilho abaixo aparecer.

## Justificativa

O requisito mais sensível do Prato Cheio é que **uma doação seja aceita por uma única ONG**, mesmo com
pedidos simultâneos. É justamente onde o PostgreSQL é forte, e a garantia já está testada
(`[0.3b] quando duas ONGs tentam aceitar ao mesmo tempo, só uma consegue`). Os problemas do novo cenário
são de **filtro, índice e conexões**, que se resolvem dentro do mesmo banco. Trocar de tecnologia (4) ou
dividir o banco por cidade (3) traria custo alto para resolver um problema que ainda não existe, e
perderia relatórios simples entre cidades.

## Consequências

- **Positivas**
  - Regras, SQL e os testes atuais continuam valendo.
  - O aceite continua correto com várias cópias da aplicação, sem mudar código.
  - A ONG recebe só o que pode retirar, e a resposta da listagem fica pequena.
- **Negativas / o que abrimos mão**
  - Uma migration nova e mudança no contrato da listagem: a interface passa a enviar a cidade.
  - Um único banco primário continua sendo o ponto central: se ele cair, todas as cidades param
    (responde 503, como hoje).
  - Doações antigas precisam receber uma cidade na migration (valor padrão do bairro do piloto).
- **Riscos e o que fazer se der errado**
  - Se o primário saturar: aplicar a alternativa 2 (réplicas para leitura, aceite sempre no primário).
  - A autenticação deixa de ser opcional com várias cidades e precisa de um ADR próprio.

## Gatilhos para reavaliar

Critérios propostos para adotar a alternativa 2. O projeto ainda não mede esses valores, então medir é
parte do trabalho:

- a listagem passa a demorar de forma perceptível para a ONG, mesmo com o índice e a paginação;
- o banco começa a recusar conexões nos horários de pico;
- relatórios da coordenação começam a disputar recursos com o uso das ONGs.

## Rastreabilidade

- Regra 2 e risco "condição de corrida no aceite" (`docs/analise.md`): a garantia é mantida.
- História 5 (rastreio): o histórico é preservado.
- ADR 0002: decisão revisada, mantida e complementada.
- Atividade 3 sobre ADRs: ver [atividades-adr.md](atividades-adr.md).
