import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Testes do walking skeleton — fluxo ponta a ponta.
// Usam SQLite em memória (configurado em vitest.config.js).
// ---------------------------------------------------------------------------

describe('publicar e listar doações', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
    expect(res.body[0].status).toBe('disponivel');
  });

  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz' }); // falta quantidade e validade

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/i);
  });
});

describe('aceitar uma doação', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('marca a doação como aceita pela ONG', async () => {
    const criada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Frutas', quantidade: '5 kg', validade: '2026-08-10' });

    const id = criada.body.id;
    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Esperança');
  });

  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const criada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão', quantidade: '20 unidades', validade: '2026-08-05' });

    const id = criada.body.id;
    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Alimento Solidário' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const criada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Leite', quantidade: '10 litros', validade: '2026-08-07' });

    const id = criada.body.id;
    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG A' });

    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG B' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/já foi aceita|não encontrada/i);
  });
});
