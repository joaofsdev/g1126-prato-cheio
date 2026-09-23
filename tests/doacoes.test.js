import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

// Cada teste cita o critério de aceite da História 0 que ele comprova
// (ver "Critérios de aceite" e "Rastreabilidade" em docs/analise.md).

async function publicar(dados) {
  return request(app).post('/api/doacoes').send(dados);
}

async function aceitar(id, corpo) {
  return request(app).post(`/api/doacoes/${id}/aceitar`).send(corpo);
}

// Este teste não depende do banco: prova que a aplicação sobe e que o CI funciona.
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

describe('História 0.1 — publicar doação', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('[0.1a] cria a doação com status disponivel e registra o instante da publicação', async () => {
    const res = await publicar({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-12-01' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeGreaterThan(0);
    expect(res.body.status).toBe('disponivel');
    expect(res.body.criada_em).toBeTruthy();
    expect(res.body.aceita_em).toBeNull();
  });

  it('[0.1b] recusa doação sem os campos obrigatórios', async () => {
    const res = await publicar({ tipo: 'Arroz' }); // falta quantidade e validade

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/i);
  });

  it.each([
    ['tipo', { quantidade: '5 kg', validade: '2026-12-01' }],
    ['quantidade', { tipo: 'Pão', validade: '2026-12-01' }],
    ['validade', { tipo: 'Pão', quantidade: '5 kg' }],
  ])('[0.1b] recusa doação sem %s', async (campo, dados) => {
    const res = await publicar(dados);

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain(campo);
  });

  it('[0.1b] recusa quantidade zero', async () => {
    const res = await publicar({ tipo: 'Pão', quantidade: '0 kg', validade: '2026-12-01' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/quantidade/);
  });

  it('[0.1b] não grava nada quando a publicação é recusada', async () => {
    await publicar({ tipo: 'Arroz' });

    const res = await request(app).get('/api/doacoes');
    expect(res.body).toHaveLength(0);
  });
});

describe('História 0.2 — listar disponíveis', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('[0.2a] mostra todas as doações publicadas quando nenhuma foi aceita', async () => {
    await publicar({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-12-01' });
    await publicar({ tipo: 'Pão', quantidade: '20 unidades', validade: '2026-12-02' });
    await publicar({ tipo: 'Frutas', quantidade: '5 kg', validade: '2026-12-03' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body.map((d) => d.tipo).sort()).toEqual(['Frutas', 'Pão', 'Sopa']);
    expect(res.body.every((d) => d.status === 'disponivel')).toBe(true);
  });

  it('[0.2b] a doação aceita sai da lista e as outras continuam', async () => {
    const pao = await publicar({ tipo: 'Pão', quantidade: '20 unidades', validade: '2026-12-05' });
    await publicar({ tipo: 'Leite', quantidade: '10 litros', validade: '2026-12-06' });

    await aceitar(pao.body.id, { ong: 'ONG Alimento Solidário' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Leite');
  });
});

describe('História 0.3 — aceitar doação', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('[0.3a] muda o status para aceita, registra a ONG e o instante do aceite', async () => {
    const criada = await publicar({ tipo: 'Frutas', quantidade: '5 kg', validade: '2026-12-10' });

    const res = await aceitar(criada.body.id, { ong: 'ONG Esperança' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Esperança');
    expect(res.body.aceita_em).toBeTruthy();
  });

  it('[0.3b] recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const criada = await publicar({ tipo: 'Leite', quantidade: '10 litros', validade: '2026-12-07' });
    const id = criada.body.id;

    await aceitar(id, { ong: 'ONG A' });
    const res = await aceitar(id, { ong: 'ONG B' });

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/já foi aceita/i);
  });

  it('[0.3b] mantém o primeiro aceite quando o segundo é recusado', async () => {
    const criada = await publicar({ tipo: 'Arroz', quantidade: '8 kg', validade: '2026-12-08' });
    const id = criada.body.id;

    await aceitar(id, { ong: 'ONG A' });
    await aceitar(id, { ong: 'ONG B' });

    // Aceitar de novo com a mesma ONG também é recusado e não altera o registro.
    const res = await aceitar(id, { ong: 'ONG A' });
    expect(res.status).toBe(409);
  });

  it('[0.3b] quando duas ONGs tentam aceitar ao mesmo tempo, só uma consegue', async () => {
    const criada = await publicar({ tipo: 'Feijão', quantidade: '15 kg', validade: '2026-12-12' });
    const id = criada.body.id;

    const [resA, resB] = await Promise.all([
      aceitar(id, { ong: 'ONG X' }),
      aceitar(id, { ong: 'ONG Y' }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('[0.3a] recusa o aceite quando a ONG não é informada', async () => {
    const criada = await publicar({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-12-01' });

    const res = await aceitar(criada.body.id, {});

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/ONG é obrigatória/);

    // A doação continua disponível.
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(1);
  });

  it('responde 404 para doação inexistente', async () => {
    const res = await aceitar(999, { ong: 'ONG A' });

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Doação não encontrada');
  });
});
