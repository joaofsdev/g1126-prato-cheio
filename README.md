# Prato Cheio — Code4Food

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Joao Francisco da Silva — @joaofsdev
- William Vodzinsky — @vodzinskylila
- Pedro Israel — @p33drinho
- Caio Rosa — @caiorosa31
- Iago Koch — @iagokoch

## Como rodar

Requisito: **Node.js 22.13 ou superior**. Mais nada — o banco da Unidade 1 é SQLite, embutido no próprio Node.

> Esta é a **stack preferencial** da disciplina. Se o seu grupo optar por outra, registre o ADR de justificativa e garanta os mesmos compromissos: repositório público com CI verde, rota de saúde, testes por um comando, os três comandos documentados aqui no README e banco relacional migrado para PostgreSQL na Unidade 3.

```bash
npm install       # só na primeira vez
npm run db:migrar # cria o schema (arquivo dados.sqlite)
npm start         # sobe em http://localhost:3000
npm test          # roda os testes
npm run dev       # sobe recarregando a cada alteração
```

Os testes usam SQLite **em memória**, então não sujam o banco de desenvolvimento.

> Ao rodar `npm test` o Node imprime `ExperimentalWarning: SQLite is an experimental feature`.
> É esperado — o módulo embutido `node:sqlite` ainda é marcado como experimental. Não é erro e não reprova o CI.

> **Atenção:** não deixe o repositório dentro de uma pasta sincronizada (OneDrive, Google Drive, Dropbox) nem em disco de rede. O SQLite precisa de trava de arquivo e nesses lugares falha com `disk I/O error`. Clone em uma pasta local comum, por exemplo `~/dev/`.

## O banco: SQLite agora, PostgreSQL depois

| Unidade | Banco | O que precisa instalar |
|---|---|---|
| 1 — Análise | **SQLite** (`node:sqlite`, embutido) | nada além do Node |
| 2 — Projeto | SQLite | nada |
| 3 — Construção | **PostgreSQL** (após refatorar) | um PostgreSQL acessível — o caminho é escolha do grupo |

A troca não é acidente de percurso: na Unidade 2 vocês registram a decisão em um **ADR** (alternativas, consequências, riscos) e na Unidade 3 executam a **refatoração** — com os testes existentes provando que o comportamento se manteve.

O `src/db.js` foi desenhado para isso: ele expõe `query()` devolvendo `{ rows }`, então a troca do banco fica contida nele e não vaza para as regras de negócio.

**Como o PostgreSQL vai subir é decisão do grupo**, comparada no mesmo ADR: instalar o PostgreSQL na máquina, subir um contêiner, ou usar um serviço gerenciado gratuito (Neon, Supabase, Render). A disciplina não impõe o caminho — exige o banco alcançável por `DATABASE_URL`, o schema migrado e o CI verde. Cada opção tem custo e risco diferentes, e reconhecê-los é parte da decisão.

## Estrutura

```
src/server.js        entrypoint (npm start)
src/db.js            conexão e schema do banco (pronto)
src/app.js           rotas da API
src/doacoes.js       regras de negócio      <- implementar (U1)
src/repositorio.js   acesso ao banco (SQL)  <- implementar (U1)
public/index.html    interface (funciona no celular)
tests/               testes automatizados
docs/analise.md      documento de análise   (Trabalho 1)
docs/projeto.md      documento de projeto   (Trabalho 2)
docs/adr/            decisões arquiteturais (Trabalho 2)
docs/validacao.md    validação e testes     (Trabalho 3)
docs/refatoracoes.md refatorações feitas    (Trabalho 3)
docs/demo.md         roteiro da demo        (Trabalho 3)
docs/retrospectivas/ retrospectiva de cada iteração
.github/workflows/   pipeline de CI
```

## Como trabalhar (fluxo de Pull Request)

A partir da Unidade 2, **nada entra direto na `main`**:

```bash
git checkout -b historia/ong-aceita-doacao
# ... implementa, escreve o teste, roda npm test ...
git commit -m "ONG aceita uma doação e ela sai da lista"
git push -u origin historia/ong-aceita-doacao
```

Abra o Pull Request no GitHub, preencha o template, espere o **CI ficar verde** e
peça a revisão de **outro integrante**. Só então faça o merge.

## Stakeholders, objetivos e conflitos

Pontos Teóricos Abordados
Quem é Stakeholder e Tipos:

Usuário:
- Doador de Alimentos (Restaurante/Mercado): Cadastra alimentos excedentes no sistema.
- ONG / Entidade Receptora: Navega pelas doações disponíveis e aceita os itens para redistribuição.

Patrocinador (Sponsor):
- Equipe de Desenvolvimento (Code4Food / Alunos) e Professor/Avaliações: Definem o escopo, garantem as entregas ágeis por unidade (U1, U2, U3) e sustentam a plataforma.

Operação:
- Desenvolvedores / Mantenedores do CI (GitHub Actions): Garantem que a aplicação suba no npm start, o banco de dados (SQLite/PostgreSQL) rode e os testes fiquem "verdes".

Regulador:
- Vigilância Sanitária (Anvisa) / Legislação Local de Doação de Alimentos: Exigem parâmetros mínimos de validade e condições de conservação para o alimento doado.

Objetivos de Negócio vs. Necessidades do Usuário:

- Objetivo do Produto (Negócio): Conectar doadores a ONGs em tempo hábil para evitar o desperdício de alimentos excedentes antes do vencimento.
- Necessidade do Doador: Anunciar lotes de alimentos de forma ultra-rápida (interface simples via mobile no public/index.html).
- Necessidade da ONG: Ver doações disponíveis perto de sua localização e poder aceitá-las para que o item saia da lista pública de pendentes.

Regras de Negócio Implícitas vs. Explícitas:

- No código inicial, há regras implícitas no fluxo de negócio (ex: "A partir do momento que uma ONG aceita, a comida não pode mais aparecer para as outras").
- Precisam ser escritas como regras explícitas e verificáveis, cobrindo validações e critérios de aceite no src/doacoes.js e em tests/doacoes.test.js.


Conflitos de Prioridade:
- Surgem entre o time de desenvolvimento (prazos e simplicidade da U1) e as exigências do produto/reguladores (segurança do alimento vs. agilidade no cadastro).

## Mapa de Stakeholders:
<img width="2720" height="2800" alt="mapa_stakeholders_circulos_concentricos (1)" src="https://github.com/user-attachments/assets/9657bf71-c3f4-4c43-b8bb-35712d838cdb" />

## Resolução de Conflito entre Stakeholders
Fala do Stakeholder A (Doador - Restaurante):

"Preciso publicar um lote de refeições em menos de 10 segundos pelo celular sem ter que preencher formulários longos, senão acabo jogando fora no lixo comum."

Fala do Stakeholder B (Representante da ONG / Vigilância Sanitária):

"Precisamos que cada doação informe o horário do preparo, a forma de conservação e fotos do lote, pois não podemos aceitar comida sem rastreabilidade de segurança alimentar."

Descrição do Conflito:
Conflito entre Facilidade/Velocidade no Cadastro (Interesse do Doador para não desperdiçar) e Garantia de Qualidade/Segurança Alimentar (Interesse da ONG e Regulador para evitar contaminação).

Critério de Decisão Proposto:
Adotar um Formulário Dinâmico em 2 Passos com Padrões Padrão (Defaults):

O doador precisa informar obrigatoriamente apenas Nome do Alimento, Quantidade e Validade/Horário de Coleta (campos vitais para a ONG).

Campos sanitários (como Condição de Armazenamento) vêm pré-selecionados com opções simples (ex: "Sob refrigeração" ou "Temperatura ambiente") e um termo de responsabilidade de aceite rápido na interface do index.html

## Tradução de 3 Regras de Negócio Implícitas do Caso em Enunciados Explícitos
Com base na lógica de domínio do projeto (src/doacoes.js e na "História Zero"):

Regra 1 (Exclusividade de Aceite / Remoção da Lista Pública)

Implícita: "Quando a ONG pega a comida, ela não pode mais aparecer na tela."

Explícita e Verificável: [RN01] Quando o status de uma doação é alterado para "ACEITA", o sistema deve atualizar seu registro no repositório e excluí-la imediatamente do resultado da consulta de doações disponíveis (GET /doacoes?status=PENDENTE).

Regra 2 (Bloqueio de Aceites Duplicados)

Implícita: "Duas ONGs não podem aceitar a mesma doação ao mesmo tempo."

Explícita e Verificável: [RN02] A operação de aceite (POST /doacoes/:id/aceitar) deve lançar um erro de conflito e manter o aceite original caso a doação informada já possua um id_ong_receptora associado.

Regra 3 (Obrigatoriedade de Dados do Doador na Publicação)

Implícita: "Não dá para publicar doação fantasma."

Explícita e Verificável: [RN03] A criação de uma doação requer obrigatoriamente a presença dos atributos id_doador, descricao e quantidade no corpo da requisição; caso contrário, o módulo src/doacoes.js deve rejeitar o cadastro lançando um erro de validação antes de persistir no banco de dados.

## O que já está pronto e o que falta

Pronto: estrutura do projeto, interface básica, rota de saúde, **conexão com o banco e o schema** (`src/db.js`), CI configurado e um teste passando (prova que a aplicação sobe).

Falta (Trabalho 1 — walking skeleton): implementar `src/doacoes.js` (regras) e
`src/repositorio.js` (SQL) para que a história zero funcione ponta a ponta —
**um doador publica uma doação → uma ONG vê a doação → a ONG a aceita e ela sai da lista.**
Os critérios de aceite estão em `tests/doacoes.test.js` como `it.todo`: troque cada um
por um teste de verdade conforme implementa.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
