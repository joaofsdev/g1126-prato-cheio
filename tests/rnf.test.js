import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { dbPadrao, migrar, limparBanco, encerrar } from '../src/db.js';
import { criarServicoDoacoes } from '../src/doacoes.js';
import { ErroConflito, ErroNaoEncontrado, ErroValidacao } from '../src/erros.js';

// Requisitos não funcionais (ver docs/projeto.md). Cada teste leva a etiqueta do RNF:
//   [RNF1] Confiabilidade · [RNF2] Manutenibilidade/Testabilidade · [RNF3] Segurança

const VALIDADE = '2099-12-31';
const app = criarApp();

// Banco falso que sempre falha com um erro inesperado (não de conexão).
function dbQueFalha(mensagem) {
  return { query: vi.fn().mockRejectedValue(new Error(mensagem)) };
}

describe('[RNF3] Segurança', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('[RNF3] SQL malicioso no campo é gravado como texto comum (consulta parametrizada)', async () => {
    const tipo = "Pão'); DROP TABLE doacoes; --";

    const res = await request(app).post('/api/doacoes')
      .send({ tipo, quantidade: '1 kg', validade: VALIDADE });

    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe(tipo);
    // A tabela continua existindo e com a doação gravada.
    const { rows } = await dbPadrao().query('SELECT tipo FROM doacoes');
    expect(rows).toEqual([{ tipo }]);
  });

  it('[RNF3] erro inesperado responde 500 sem expor detalhes internos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // o log interno é esperado aqui
    const appComFalha = criarApp({ db: dbQueFalha('relation "doacoes" does not exist') });

    const res = await request(appComFalha).get('/api/doacoes');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ erro: 'Erro interno do servidor.' });
    expect(JSON.stringify(res.body)).not.toMatch(/relation|doacoes/);
    vi.restoreAllMocks();
  });

  it('[RNF3] recusa corpo acima de 100 kb com 413', async () => {
    const res = await request(app).post('/api/doacoes')
      .send({ tipo: 'x'.repeat(110 * 1024), quantidade: '1 kg', validade: VALIDADE });

    expect(res.status).toBe(413);
    expect(res.body.erro).toBe('Corpo da requisição muito grande.');
  });

  it.each([
    ['tipo', { tipo: 'x'.repeat(101), quantidade: '1 kg', validade: VALIDADE }],
    ['quantidade', { tipo: 'Pão', quantidade: '1'.repeat(51), validade: VALIDADE }],
  ])('[RNF3] recusa %s acima do tamanho máximo com 400', async (campo, dados) => {
    const res = await request(app).post('/api/doacoes').send(dados);

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(new RegExp(`${campo} pode ter no máximo`));
  });

  it('[RNF3] recusa nome de ONG acima do tamanho máximo com 400', async () => {
    const criada = await request(app).post('/api/doacoes')
      .send({ tipo: 'Pão', quantidade: '1 kg', validade: VALIDADE });

    const res = await request(app).post(`/api/doacoes/${criada.body.id}/aceitar`)
      .send({ ong: 'O'.repeat(121) });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/ong pode ter no máximo/);
  });

  it('[RNF3] não anuncia o servidor e envia X-Content-Type-Options', async () => {
    const res = await request(app).get('/api/saude');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('[RNF1] Confiabilidade — erros padronizados', () => {
  it('[RNF1] JSON malformado responde 400 no formato { erro }', async () => {
    const res = await request(app).post('/api/doacoes')
      .set('Content-Type', 'application/json')
      .send('{"tipo": "Pão",');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'JSON inválido.' });
  });

  it('[RNF1] rota de API inexistente responde 404 no formato { erro }', async () => {
    const res = await request(app).get('/api/nao-existe');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ erro: 'Rota não encontrada.' });
  });
});

describe('[RNF2] Testabilidade — regras testadas sem banco (repositório falso injetado)', () => {
  function repositorioFalso(sobrescritas = {}) {
    return {
      inserir: vi.fn(async (dados) => ({ id: 1, status: 'disponivel', ...dados })),
      listarDisponiveis: vi.fn(async () => []),
      buscarPorId: vi.fn(async () => ({ id: 1, status: 'disponivel' })),
      marcarComoAceita: vi.fn(async () => true),
      ...sobrescritas
    };
  }

  it('[RNF2] publicar limpa os espaços antes de gravar', async () => {
    const repositorio = repositorioFalso();
    const servico = criarServicoDoacoes(repositorio);

    await servico.criarDoacao({ tipo: '  Sopa ', quantidade: ' 10 porções ', validade: VALIDADE });

    expect(repositorio.inserir).toHaveBeenCalledWith({ tipo: 'Sopa', quantidade: '10 porções', validade: VALIDADE });
  });

  it('[RNF2] dados inválidos não chegam ao repositório', async () => {
    const repositorio = repositorioFalso();
    const servico = criarServicoDoacoes(repositorio);

    await expect(servico.criarDoacao({ tipo: 'Sopa' })).rejects.toBeInstanceOf(ErroValidacao);
    expect(repositorio.inserir).not.toHaveBeenCalled();
  });

  it('[RNF2] aceitar doação inexistente lança ErroNaoEncontrado', async () => {
    const servico = criarServicoDoacoes(repositorioFalso({ buscarPorId: vi.fn(async () => undefined) }));

    await expect(servico.aceitar(1, 'ONG A')).rejects.toBeInstanceOf(ErroNaoEncontrado);
  });

  it('[RNF2] aceite que não altera linha já aceita lança ErroConflito "já foi aceita"', async () => {
    const servico = criarServicoDoacoes(repositorioFalso({
      marcarComoAceita: vi.fn(async () => false),
      buscarPorId: vi.fn(async () => ({ id: 1, status: 'aceita' }))
    }));

    await expect(servico.aceitar(1, 'ONG B')).rejects.toThrow(new ErroConflito('Doação já foi aceita por outra ONG'));
  });
});
