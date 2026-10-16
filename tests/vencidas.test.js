import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { dbPadrao, migrar, limparBanco, encerrar } from '../src/db.js';
import { hojeNaOperacao } from '../src/datas.js';
import { daquiA } from './ajudantes.js';

// História 6 / Regra 1 — doação vencida não fica disponível.
// Cada teste cita o critério de aceite (6a–6d) que comprova; ver docs/projeto.md.

const app = criarApp();

function publicar(dados) {
  return request(app).post('/api/doacoes').send(dados);
}

function listar() {
  return request(app).get('/api/doacoes');
}

// A API recusa publicar com validade no passado (6d). Para ter uma doação vencida,
// gravamos direto no banco — é o caso de uma doação publicada dias atrás que venceu.
async function criarDoacaoVencida(tipo, diasAtras = 1) {
  const { rows } = await dbPadrao().query(
    `INSERT INTO doacoes (tipo, quantidade, validade) VALUES ($1, '5 kg', $2) RETURNING id`,
    [tipo, daquiA(-diasAtras)]
  );
  return rows[0].id;
}

describe('História 6 — ONG vê só doações dentro da validade', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('[6a] mostra as doações que vencem hoje e as que vencem no futuro', async () => {
    await publicar({ tipo: 'Pão', quantidade: '20 unidades', validade: daquiA(0) });
    await publicar({ tipo: 'Sopa', quantidade: '10 porções', validade: daquiA(3) });

    const res = await listar();

    expect(res.status).toBe(200);
    expect(res.body.map((d) => d.tipo)).toEqual(['Pão', 'Sopa']); // a que vence antes vem primeiro
  });

  it('[6b] não mostra a doação cuja validade já passou', async () => {
    await criarDoacaoVencida('Leite vencido');
    await publicar({ tipo: 'Frutas', quantidade: '5 kg', validade: daquiA(2) });

    const res = await listar();

    expect(res.status).toBe(200);
    expect(res.body.map((d) => d.tipo)).toEqual(['Frutas']);
  });

  it('[6c] recusa com 409 o aceite de uma doação vencida', async () => {
    const id = await criarDoacaoVencida('Iogurte');

    const res = await request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG A' });

    expect(res.status).toBe(409);
    expect(res.body.erro).toBe('Doação vencida não pode ser aceita');
  });

  it('[6c] a doação vencida continua sem ONG depois do aceite recusado', async () => {
    const id = await criarDoacaoVencida('Iogurte');

    await request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG A' });

    const { rows } = await dbPadrao().query('SELECT status, ong, aceita_em FROM doacoes WHERE id = $1', [id]);
    expect(rows[0]).toEqual({ status: 'disponivel', ong: null, aceita_em: null });
  });

  it('[6c] doação já aceita continua respondendo "já foi aceita", não "vencida"', async () => {
    const criada = await publicar({ tipo: 'Arroz', quantidade: '8 kg', validade: daquiA(1) });
    await request(app).post(`/api/doacoes/${criada.body.id}/aceitar`).send({ ong: 'ONG A' });

    const res = await request(app).post(`/api/doacoes/${criada.body.id}/aceitar`).send({ ong: 'ONG B' });

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/já foi aceita/);
  });

  it('[6d] recusa com 400 publicar uma doação com validade no passado', async () => {
    const res = await publicar({ tipo: 'Pão', quantidade: '20 unidades', validade: daquiA(-1) });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/validade já passou/);
  });

  it('[6d] não grava nada quando a validade está no passado', async () => {
    await publicar({ tipo: 'Pão', quantidade: '20 unidades', validade: daquiA(-1) });

    const { rows } = await dbPadrao().query('SELECT count(*)::int AS total FROM doacoes');
    expect(rows[0].total).toBe(0);
  });
});

describe('História 6 — "hoje" no fuso da operação', () => {
  afterAll(async () => { await encerrar(); });

  it('às 23h de São Paulo ainda é o mesmo dia (em UTC já seria amanhã)', () => {
    // 2026-10-17T02:00Z = 16/10 às 23h em São Paulo.
    expect(hojeNaOperacao(new Date('2026-10-17T02:00:00Z'))).toBe('2026-10-16');
    expect(hojeNaOperacao(new Date('2026-10-17T03:00:00Z'))).toBe('2026-10-17');
  });

  it('o CURRENT_DATE do PostgreSQL concorda com o "hoje" da aplicação', async () => {
    const { rows } = await dbPadrao().query('SELECT CURRENT_DATE AS hoje');

    expect(rows[0].hoje).toBe(hojeNaOperacao());
  });
});
