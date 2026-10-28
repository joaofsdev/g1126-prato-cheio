import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';
import { daquiA } from './ajudantes.js';

const app = criarApp();

const ONG = 'ONG Esperança';
const MOTORISTA = 'João Silva';
const ID_INEXISTENTE = 999999;

// --- Ajudantes ---------------------------------------------------------------

function publicar() {
  return request(app)
    .post('/api/doacoes')
    .send({
      tipo: 'Alimentos não perecíveis',
      quantidade: '10 kg',
      validade: daquiA(10),
    });
}

function aceitar(id) {
  return request(app)
    .post(`/api/doacoes/${id}/aceitar`)
    .send({ ong: ONG });
}

function retirar(id, corpo) {
  return request(app)
    .post(`/api/doacoes/${id}/retirar`)
    .send(corpo);
}

function consultar(id) {
  return request(app).get(`/api/doacoes/${id}`);
}

function listar() {
  return request(app).get('/api/doacoes');
}

// Publica uma doação e a aceita, deixando-a pronta para a retirada.
async function criarDoacaoAceita() {
  const { body: { id } } = await publicar();
  await aceitar(id);
  return id;
}

// --- Testes ------------------------------------------------------------------

describe('História 8 — confirmação de retirada da doação', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  it('[8.1] confirma a retirada de uma doação aceita', async () => {
    const id = await criarDoacaoAceita();

    const res = await retirar(id, { motorista: MOTORISTA });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.status).toBe('retirada');
    expect(res.body.motorista).toBe(MOTORISTA);
    expect(res.body.retirada_em).toBeTruthy();
  });

  it('[8.2] preserva o histórico da doação após a retirada', async () => {
    const id = await criarDoacaoAceita();

    await retirar(id, { motorista: 'Maria Oliveira' });

    const res = await consultar(id);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('retirada');
    expect(res.body.ong).toBe(ONG);
    expect(res.body.motorista).toBe('Maria Oliveira');
    expect(res.body.criada_em).toBeTruthy();
    expect(res.body.aceita_em).toBeTruthy();
    expect(res.body.retirada_em).toBeTruthy();
  });

  it('[8.3] recusa retirada sem identificação do motorista', async () => {
    const id = await criarDoacaoAceita();

    const res = await retirar(id, {});

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/motorista/i);

    const consulta = await consultar(id);
    expect(consulta.body.status).toBe('aceita');
    expect(consulta.body.retirada_em).toBeNull();
  });

  it('[8.4] recusa motorista com mais de 120 caracteres', async () => {
    const id = await criarDoacaoAceita();

    const res = await retirar(id, { motorista: 'A'.repeat(121) });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/120 caracteres/i);
  });

  it.each(['abc', '0', '-1', '2147483648'])(
    '[8.5] recusa ID inválido: %s',
    async (id) => {
      const res = await retirar(id, { motorista: MOTORISTA });

      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/ID de doação inválido/i);
    },
  );

  it('[8.6] retorna 404 para doação inexistente', async () => {
    const res = await retirar(ID_INEXISTENTE, { motorista: MOTORISTA });

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Doação não encontrada');
  });

  it('[8.7] impede retirada antes do aceite da ONG', async () => {
    const { body: { id } } = await publicar();

    const res = await retirar(id, { motorista: MOTORISTA });

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/somente doações aceitas/i);

    const consulta = await consultar(id);
    expect(consulta.body.status).toBe('disponivel');
    expect(consulta.body.motorista).toBeNull();
    expect(consulta.body.retirada_em).toBeNull();
  });

  it('[8.8] impede confirmar duas vezes a mesma retirada', async () => {
    const id = await criarDoacaoAceita();

    const primeira = await retirar(id, { motorista: MOTORISTA });
    const segunda = await retirar(id, { motorista: 'Maria Oliveira' });

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(409);
    expect(segunda.body.erro).toMatch(/já foi retirada/i);

    const consulta = await consultar(id);
    expect(consulta.body.motorista).toBe(MOTORISTA);
    expect(consulta.body.retirada_em).toBe(primeira.body.retirada_em);
  });

  it('[8.9] permite somente uma confirmação simultânea', async () => {
    const id = await criarDoacaoAceita();

    const [resA, resB] = await Promise.all([
      retirar(id, { motorista: 'Motorista A' }),
      retirar(id, { motorista: 'Motorista B' }),
    ]);

    expect([resA.status, resB.status].sort()).toEqual([200, 409]);

    const consulta = await consultar(id);
    expect(consulta.body.status).toBe('retirada');
    expect(['Motorista A', 'Motorista B']).toContain(consulta.body.motorista);
  });

  it('[8.10] não exibe doações retiradas na lista de disponíveis', async () => {
    const id = await criarDoacaoAceita();

    await retirar(id, { motorista: MOTORISTA });

    const res = await listar();

    expect(res.status).toBe(200);
    expect(res.body.some((doacao) => doacao.id === id)).toBe(false);
  });
});
