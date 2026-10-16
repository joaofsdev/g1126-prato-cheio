import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

// História 5 — Vigilância Sanitária consulta a rastreabilidade de uma doação.
// Cada teste cita o critério de aceite (5a–5d) que comprova; ver docs/projeto.md.

const app = criarApp();

// Data bem no futuro: estes testes não dependem do dia em que rodam.
const VALIDADE = '2099-12-31';

function publicar(dados) {
  return request(app).post('/api/doacoes').send(dados);
}

function consultar(id, aplicacao = app) {
  return request(aplicacao).get(`/api/doacoes/${id}`);
}

describe('História 5 — consultar rastreio de uma doação', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('[5a] devolve tipo, quantidade, validade, status e instante da publicação', async () => {
    const criada = await publicar({ tipo: 'Sopa', quantidade: '10 porções', validade: VALIDADE });

    const res = await consultar(criada.body.id);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: criada.body.id,
      tipo: 'Sopa',
      quantidade: '10 porções',
      validade: VALIDADE,
      status: 'disponivel',
      ong: null,
      aceita_em: null
    });
    expect(res.body.criada_em).toBe(criada.body.criada_em);
  });

  it('[5b] uma doação aceita mostra a ONG e o instante do aceite', async () => {
    const criada = await publicar({ tipo: 'Pão', quantidade: '20 unidades', validade: VALIDADE });
    await request(app).post(`/api/doacoes/${criada.body.id}/aceitar`).send({ ong: 'ONG Esperança' });

    const res = await consultar(criada.body.id);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Esperança');
    expect(new Date(res.body.aceita_em).getTime())
      .toBeGreaterThanOrEqual(new Date(res.body.criada_em).getTime());
  });

  it('[5b] a doação aceita sai da lista, mas continua consultável pelo id', async () => {
    const criada = await publicar({ tipo: 'Leite', quantidade: '10 litros', validade: VALIDADE });
    await request(app).post(`/api/doacoes/${criada.body.id}/aceitar`).send({ ong: 'ONG A' });

    const lista = await request(app).get('/api/doacoes');
    const res = await consultar(criada.body.id);

    expect(lista.body).toHaveLength(0);
    expect(res.status).toBe(200);
  });

  it('[5c] responde 404 para doação inexistente', async () => {
    const res = await consultar(999);

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Doação não encontrada');
  });

  it.each(['abc', '0', '-1', '1.5', '99999999999'])(
    '[5d] responde 400 para id inválido "%s"',
    async (id) => {
      const res = await consultar(id);

      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('ID de doação inválido.');
    }
  );

  it('[5d] id inválido é recusado sem consultar o banco', async () => {
    // Injeção de dependência: um banco "espião" que registra se foi chamado.
    const dbEspiao = { query: vi.fn() };
    const appComEspiao = criarApp({ db: dbEspiao });

    const res = await consultar('abc', appComEspiao);

    expect(res.status).toBe(400);
    expect(dbEspiao.query).not.toHaveBeenCalled();
  });
});
