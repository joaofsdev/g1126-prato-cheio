
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dbPadrao } from './db.js';
import { criarRepositorio } from './repositorio.js';
import { criarServicoDoacoes } from './doacoes.js';
import { ErroAplicacao, ErroValidacao } from './erros.js';

// Define o caminho absoluto da pasta que contém a interface.
const pastaPublica = fileURLToPath(
  new URL('../public/', import.meta.url)
);

// Maior valor da coluna INTEGER do PostgreSQL. Um id acima disso nem chega ao banco
// (que recusaria com erro 500 "out of range").
const MAIOR_ID = 2_147_483_647;

// Lê o :id da rota. Id inválido (texto, zero, negativo, grande demais) é recusado
// com 400 aqui mesmo, sem chegar ao banco.
function lerId(req) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || id > MAIOR_ID) {
    throw new ErroValidacao('ID de doação inválido.');
  }
  return id;
}

// Encaminha erros de funções assíncronas ao middleware de erros.
function rotaAssincrona(funcao) {
  return (req, res, next) =>
    Promise.resolve(funcao(req, res)).catch(next);
}

/**
 * Cria e configura a aplicação Express.
 *
 * Injeção de dependência: o banco é recebido por parâmetro. Em produção usa o banco
 * de DATABASE_URL; nos testes dá para passar outro (ex.: um banco fora do ar).
 * @param {{ db?: { query: Function } }} [dependencias]
 */
export function criarApp({ db = dbPadrao() } = {}) {
  const doacoes = criarServicoDoacoes(criarRepositorio(db));
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

  // ROTA 4: Consulta uma doação pelo id, em qualquer status (História 5 —
  // rastreabilidade para a Vigilância Sanitária).
  app.get('/api/doacoes/:id', rotaAssincrona(async (req, res) => {
    const doacao = await doacoes.buscarPorId(lerId(req));

    res.json(doacao);
  }));

  // ROTA 5: Registra o aceite de uma doação por uma ONG.
  app.post(
    '/api/doacoes/:id/aceitar',
    rotaAssincrona(async (req, res) => {
      const id = lerId(req);

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
  // 400 dados inválidos · 404 não existe · 409 já aceita (Regra 2) · 503 banco fora do ar
  // (ver src/erros.js) · 500 qualquer outro erro inesperado.
  app.use((erro, req, res, next) => {
    if (res.headersSent) return next(erro);

    // Erros da aplicação (src/erros.js) e do express.json (400 JSON inválido,
    // 413 corpo grande demais) já trazem o status HTTP.
    const status = Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 600
      ? erro.status
      : 500;

    // Registra no terminal os erros do servidor, com a causa original.
    if (status >= 500) {
      console.error('Erro interno:', erro.cause ?? erro);
    }

    // Define a mensagem que será enviada ao usuário. Erros inesperados nunca expõem
    // detalhes internos (SQL, nomes de tabelas, stack trace).
    let resposta;
    if (erro instanceof ErroAplicacao) resposta = erro.message;
    else if (status >= 500) resposta = 'Erro interno do servidor.';
    else if (erro.type === 'entity.parse.failed') resposta = 'JSON inválido.';
    else if (erro.type === 'entity.too.large') resposta = 'Corpo da requisição muito grande.';
    else resposta = 'Requisição inválida.';

    // Envia a resposta padronizada em JSON.
    res.status(status).json({
      erro: resposta
    });
  });

  // Devolve a aplicação configurada.
  return app;
}
