# Diagramas do Prato Cheio — Atividade "Projeto" (N2)

**Ferramenta de IA utilizada:** Claude (Anthropic).
**Ferramenta de diagramação:** Mermaid (arquivos `.md`, renderizados pelo GitHub).
**Diagramas escolhidos:** Estados (UML) e Sequência (UML).

## Onde encontrar cada item da entrega

| Item pedido | Arquivo |
|---|---|
| Dois tipos de diagramas e justificativa | [`01-justificativa.md`](01-justificativa.md) |
| Versões iniciais produzidas pela IA (sem correção) | [`ia-versao-inicial/estados.md`](ia-versao-inicial/estados.md) · [`ia-versao-inicial/sequencia.md`](ia-versao-inicial/sequencia.md) |
| Registro dos problemas, justificativas e correções | [`problemas.md`](problemas.md) |
| Versões finais | [`final/estados.md`](final/estados.md) · [`final/sequencia.md`](final/sequencia.md) |

## Como foi feito

1. **Entrada para a IA:** histórias de usuário, regras de negócio, conflitos, riscos e decisões de
   [`docs/analise.md`](../analise.md) e [`docs/projeto.md`](../projeto.md), sem o código-fonte.
2. **Versão inicial** salva em `ia-versao-inicial/` antes de qualquer correção.
3. **Avaliação crítica:** a IA foi confrontada com as histórias, regras, ADRs, o schema
   (`migrations/001_cria_tabela_doacoes.sql`) e o código (`src/`), o que resultou em 4 problemas.
4. **Versões finais** em `final/`, com as correções.

## Contribuição por integrante

Cada integrante possui commit próprio neste PR (ver `git log -- docs/diagramas`).
