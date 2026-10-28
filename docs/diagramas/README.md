
# Diagramas do Prato Cheio — Atividade "Projeto" (N2)

**Ferramenta de IA utilizada na geração inicial:** Claude (Anthropic).

**Ferramenta de IA utilizada na revisão posterior da História 8:** ChatGPT (OpenAI).

**Ferramenta de diagramação:** Mermaid (arquivos `.md`, renderizados pelo GitHub).

**Diagramas escolhidos:** Estados (UML) e Sequência (UML).

## Onde encontrar cada item da entrega

| Item pedido | Arquivo |
|---|---|
| Dois tipos de diagramas e justificativa | [`01-justificativa.md`](01-justificativa.md) |
| Versões iniciais produzidas pela IA, preservadas sem correção | [`ia-versao-inicial/estados.md`](ia-versao-inicial/estados.md) e [`ia-versao-inicial/sequencia.md`](ia-versao-inicial/sequencia.md) |
| Registro dos problemas, justificativas e correções | [`problemas.md`](problemas.md) |
| Diagrama de Estados revisado | [`final/estados.md`](final/estados.md) |
| Diagrama de Sequência revisado | [`final/sequencia.md`](final/sequencia.md) |
| Reflexão sobre a utilidade dos diagramas | [`problemas.md`](problemas.md#reflexão-sobre-os-diagramas) |

## Como foi feito

1. **Entrada para a IA:** foram utilizadas as histórias de usuário, regras de negócio, conflitos, riscos e decisões documentadas em [`docs/analise.md`](../analise.md) e [`docs/projeto.md`](../projeto.md), sem o código-fonte.

2. **Versões iniciais:** os diagramas gerados pela IA foram salvos em `ia-versao-inicial/`, preservando o resultado original antes das correções.

3. **Avaliação crítica:** as versões iniciais foram comparadas com os requisitos, as decisões arquiteturais, o esquema do banco (`migrations/001_cria_tabela_doacoes.sql`) e a implementação em `src/`. Foram documentados quatro problemas, acompanhados de suas justificativas e correções.

4. **Primeira revisão:** os diagramas corrigidos foram armazenados em `final/`, representando as funcionalidades implementadas naquele momento, principalmente a publicação e o aceite de doações.

5. **Evolução da História 8:** após a implementação da confirmação de retirada por motorista voluntário, foi realizada uma nova revisão dos diagramas finais, considerando as alterações desenvolvidas na branch `feat/confirmar-retirada-doacao`.

6. **Atualização dos diagramas:** o Diagrama de Estados passou a representar a transição `aceita → retirada`. O Diagrama de Sequência foi ampliado para documentar o endpoint de confirmação, suas validações, os retornos HTTP e a proteção contra confirmações simultâneas.

7. **Atualização da análise crítica:** o arquivo `problemas.md` foi complementado com uma seção sobre a evolução da História 8, distinguindo os problemas da geração inicial pela IA das mudanças posteriores na implementação.

## Evolução documentada — História 8

A História 8 implementa a confirmação de retirada de uma doação previamente aceita por uma ONG.

A operação é realizada por meio do endpoint:

`POST /api/doacoes/:id/retirar`

A confirmação exige a identificação do motorista voluntário e somente pode ser realizada quando a doação estiver no estado `aceita`.

Após a confirmação, o registro passa ao estado `retirada`, armazenando os campos `motorista` e `retirada_em`.

A implementação utiliza uma atualização condicional no PostgreSQL para impedir confirmações duplicadas, inclusive em tentativas simultâneas.

### Situação de integração

A funcionalidade foi desenvolvida na branch `feat/confirmar-retirada-doacao`.

Enquanto sua PR estiver pendente de aprovação, os diagramas atualizados representam a evolução implementada nessa branch, e não uma funcionalidade já integrada à `main`.

A integração da História 8 deverá ser considerada na revisão da PR de documentação, para manter a consistência entre os diagramas e o código da branch principal.

## Contribuição por integrante

A atividade exige que cada integrante do grupo possua ao menos um commit próprio relacionado à entrega.

As contribuições podem ser verificadas pelo histórico do Git:

```bash
git log --oneline -- docs/diagramas
```

A revisão posterior da História 8 foi desenvolvida na branch `docs/atualizacao-diagramas-n2`, contemplando:

- Atualização do Diagrama de Estados.
- Ampliação do Diagrama de Sequência.
- Complementação da análise crítica.
- Atualização da documentação da entrega.

As alterações devem ser submetidas por Pull Request para revisão de outro integrante do grupo.

## Reflexão final

**Qual dos dois diagramas foi mais útil para compreender ou questionar uma decisão do projeto? Por quê?**

O **Diagrama de Estados** foi o mais útil para compreender e questionar as decisões do projeto Prato Cheio, pois permitiu visualizar o ciclo de vida de uma doação e identificar quais transições realmente estão implementadas no sistema.

Durante a análise, percebemos a importância de diferenciar estados persistidos no banco de dados de condições derivadas, como uma doação vencida, que continua registrada como `disponivel`, mas deixa de aparecer na listagem e não pode mais ser aceita. Também identificamos que o retorno de uma doação aceita para disponível depende de uma regra de negócio ainda não definida.

Além disso, a implementação da História 8 acrescentou a transição de `aceita` para `retirada`, demonstrando como a evolução dos requisitos modifica o comportamento do sistema.

Dessa forma, o diagrama não serviu apenas para documentar o funcionamento da aplicação, mas também para questionar decisões, identificar regras pendentes e verificar a consistência entre requisitos, código e modelo de dados.