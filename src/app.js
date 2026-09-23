
import express from 'express';
import { fileURLToPath } from 'node:url';
import * as doacoes from './doacoes.js';

// Define o caminho absoluto da pasta que contém a interface.
const pastaPublica = fileURLToPath(
  new URL('../public/', import.meta.url)
);

// Encaminha erros de funções assíncronas ao middleware de erros.
function rotaAssincrona(funcao) {
  return (req, res, next) =>
    Promise.resolve(funcao(req, res)).catch(next);
}

// Cria e configura a aplicação Express.
export function criarApp() {
  const app = express();

  // Permite receber dados JSON com limite de tamanho.
  app.use(express.json({ limit: '100kb' }));

  // Disponibiliza os arquivos da interface.
  app.use(express.static(pastaPublica));

  // ROTA 1: Verifica se a API está respondendo.
  app.get('/api/saude', (req, res) => {
    res.json({ ok: true });
  });

  // ROTA 2: Lista somente as doações disponíveis.
  app.get('/api/doacoes', rotaAssincrona(async (req, res) => {
    const lista = await doacoes.listarDisponiveis();

    res.json(lista);
  }));

  // ROTA 3: Cadastra uma nova doação.
  app.post('/api/doacoes', rotaAssincrona(async (req, res) => {
    const novaDoacao = await doacoes.criarDoacao(req.body);

    res.status(201).json(novaDoacao);
  }));

  // ROTA 4: Registra o aceite de uma doação por uma ONG.
  app.post(
    '/api/doacoes/:id/aceitar',
    rotaAssincrona(async (req, res) => {
      const id = Number(req.params.id);

      // Verifica se o identificador informado é válido.
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          erro: 'ID de doação inválido.'
        });
      }

      // Sem valor padrão: a ONG precisa ser informada (critério 0.3).
      const doacaoAceita = await doacoes.aceitar(id, req.body?.ong);

      res.json(doacaoAceita);
    })
  );

  // Retorna 404 para endereços de API inexistentes.
  app.use('/api', (req, res) => {
    res.status(404).json({
      erro: 'Rota não encontrada.'
    });
  });

  // Centraliza o tratamento de erros da aplicação.
  app.use((erro, req, res, next) => {
    if (res.headersSent) return next(erro);

    const mensagem = erro.message ?? '';

    // Identifica erros conhecidos das regras de negócio.
    const erroDeValidacao =
      /^(Dados obrigatórios|ONG é obrigatória)/.test(mensagem);
    const erroDeConflito = /^Doação já foi aceita/.test(mensagem);

    // Define o código HTTP correspondente ao erro.
    // 404: não existe · 409: já aceita por outra ONG (Regra 2) · 400: dados inválidos
    const status = mensagem === 'Doação não encontrada'
      ? 404
      : erroDeConflito
        ? 409
        : erroDeValidacao
          ? 400
          : Number.isInteger(erro.status) &&
              erro.status >= 400 &&
              erro.status < 500
            ? erro.status
            : 500;

    // Registra erros internos no terminal.
    if (status === 500) {
      console.error('Erro interno:', erro);
    }

    // Define a mensagem que será enviada ao usuário.
    const resposta = status === 500
      ? 'Erro interno do servidor.'
      : erro instanceof SyntaxError && status === 400
        ? 'JSON inválido.'
        : mensagem;

    // Envia a resposta padronizada em JSON.
    res.status(status).json({
      erro: resposta
    });
  });

  // Devolve a aplicação configurada.
  return app;
}
