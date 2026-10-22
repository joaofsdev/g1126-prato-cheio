# Roteiro de commits: diagramas do Prato Cheio

Objetivo: cada integrante com pelo menos 1 commit na mesma branch/PR, **na ordem abaixo** (a versão original
da IA precisa entrar no histórico antes das versões corrigidas).

Antes de começar: leiam o arquivo que vão commitar e conferiram com o código (`src/`). O trabalho é do
grupo, então quem commita deve conseguir explicar o que está no arquivo.

## Preparação (todos)

1. Baixar o `docs-diagramas.zip` e descompactar **fora** do repositório (ex.: `~/Downloads/diagramas`).
2. Conferir que o e-mail do git é o mesmo da conta do GitHub, senão o commit não conta como seu:
   ```bash
   git config user.name
   git config user.email
   ```
3. Antes de cada commit, atualizar a branch:
   ```bash
   git fetch origin
   git checkout diagramas-ia
   git pull origin diagramas-ia
   ```

## Ordem e responsabilidades

| # | Integrante | Arquivo(s) | Mensagem de commit |
|---|---|---|---|
| 1 | _____ (cria a branch) | `docs/diagramas/01-justificativa.md` | `docs: justifica a escolha dos diagramas de estados e sequência` |
| 2 | _____ | `docs/diagramas/ia-versao-inicial/estados.md` | `docs: versão inicial da IA do diagrama de estados` |
| 3 | _____ | `docs/diagramas/ia-versao-inicial/sequencia.md` | `docs: versão inicial da IA do diagrama de sequência` |
| 4 | _____ | `docs/diagramas/problemas.md` | `docs: registra os problemas encontrados nos diagramas da IA` |
| 5 | _____ | `docs/diagramas/final/estados.md` | `docs: versão final do diagrama de estados` |
| 6 | _____ | `docs/diagramas/final/sequencia.md` | `docs: versão final do diagrama de sequência` |
| 7 | quem abre a PR | `docs/diagramas/README.md` e `docs/projeto.md` | `docs: índice dos diagramas e link em projeto.md` |

Se o grupo tiver mais de 7 pessoas ou menos de 6, dividam do jeito que preferirem: o importante é todo
mundo ter ao menos um commit. Quem ficar sem arquivo pode fazer a revisão da PR (comentários e eventuais
correções viram commit dele).

## Comandos do integrante 1 (cria a branch)

```bash
git checkout main && git pull origin main
git checkout -b diagramas-ia
mkdir -p docs/diagramas
cp ~/Downloads/diagramas/docs/diagramas/01-justificativa.md docs/diagramas/
git add docs/diagramas/01-justificativa.md
git commit -m "docs: justifica a escolha dos diagramas de estados e sequência"
git push -u origin diagramas-ia
```

## Comandos dos integrantes 2 a 6 (um de cada vez, na ordem)

Troquem `ARQUIVO` e a mensagem pela linha da tabela:

```bash
git fetch origin
git checkout diagramas-ia
git pull origin diagramas-ia
mkdir -p docs/diagramas/ia-versao-inicial docs/diagramas/final
cp ~/Downloads/diagramas/docs/diagramas/ARQUIVO docs/diagramas/ARQUIVO
git add docs/diagramas/ARQUIVO
git commit -m "MENSAGEM DA TABELA"
git push origin diagramas-ia
```

Exemplo (integrante 2):

```bash
cp ~/Downloads/diagramas/docs/diagramas/ia-versao-inicial/estados.md docs/diagramas/ia-versao-inicial/
git add docs/diagramas/ia-versao-inicial/estados.md
git commit -m "docs: versão inicial da IA do diagrama de estados"
git push origin diagramas-ia
```

Se o push for recusado ("rejected, non-fast-forward"), outra pessoa subiu antes: rodem `git pull origin diagramas-ia` e `git push` de novo.

## Integrante 7 (índice, link e PR)

`docs/projeto.md` **não deve ser copiado por cima** se alguém alterou o arquivo desde ontem. Adicionem só
este trecho, antes de `### Componentes (estado atual do código)`:

```markdown
### Estados e sequência (atividade "Projeto" com apoio de IA)

Diagrama de estados da doação e de sequência do aceite, com a versão inicial da IA, os problemas
encontrados e as versões finais: [`docs/diagramas/`](diagramas/README.md).
```

```bash
git pull origin diagramas-ia
cp ~/Downloads/diagramas/docs/diagramas/README.md docs/diagramas/
# editar docs/projeto.md com o trecho acima
git add docs/diagramas/README.md docs/projeto.md
git commit -m "docs: índice dos diagramas e link em projeto.md"
git push origin diagramas-ia
```

Depois abram a PR de `diagramas-ia` para `main` (ou para `entrega-2`, conforme o grupo está usando),
preenchendo o template em `.github/pull_request_template.md`. **Outro integrante deve revisar e aprovar.**

## Conferência final (antes de enviar no Teams)

```bash
git log --format='%an | %s' -- docs/diagramas
```

Devem aparecer todos os nomes do grupo. Se faltar alguém, essa pessoa faz um commit pequeno e real
(ex.: corrigir um erro encontrado ao revisar os diagramas contra o código).

No Teams: link do repositório, link da PR, os dois tipos (Estados e Sequência) com a justificativa, a
ferramenta de IA (Claude) e a indicação de que tudo está em `docs/diagramas/README.md`.

## Antes de enviar: ajustar o README

O `docs/diagramas/README.md` afirma que "cada integrante possui commit próprio". Só mantenham a frase se
for verdade no `git log` acima.
