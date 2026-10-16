import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { criarDb, dbPadrao, migrar, limparBanco, encerrar } from '../src/db.js';
import { aplicarMigrations } from '../src/migrar.js';

// Testes da migração SQLite -> PostgreSQL: diferenças de dialeto que a aplicação
// precisa tratar e o comportamento quando o banco está fora do ar.

const app = criarApp();

function publicar(dados) {
  return request(app).post('/api/doacoes').send(dados);
}

describe('Migração para PostgreSQL — tipos e dialeto', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('devolve a validade (DATE) como AAAA-MM-DD, sem deslocamento de fuso', async () => {
    const res = await publicar({ tipo: 'Pão', quantidade: '20 unidades', validade: '2026-12-01' });

    expect(res.status).toBe(201);
    expect(res.body.validade).toBe('2026-12-01');
  });

  it('devolve criada_em (TIMESTAMPTZ) como instante ISO 8601', async () => {
    const res = await publicar({ tipo: 'Pão', quantidade: '20 unidades', validade: '2026-12-01' });

    expect(new Date(res.body.criada_em).toISOString()).toBe(res.body.criada_em);
  });

  it.each([
    ['formato brasileiro', '01/12/2026'],
    ['texto livre', 'amanhã'],
    ['data que não existe', '2026-02-30'],
  ])('[0.1b] recusa validade em %s com 400 (e não 500 do banco)', async (_caso, validade) => {
    const res = await publicar({ tipo: 'Pão', quantidade: '5 kg', validade });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/validade/);
  });

  it('recusa id acima do limite do INTEGER do PostgreSQL com 400', async () => {
    const res = await request(app)
      .post('/api/doacoes/99999999999/aceitar')
      .send({ ong: 'ONG A' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('ID de doação inválido.');
  });

  it('não reaplica migrations que já constam em schema_migrations', async () => {
    const aplicadasAgora = await aplicarMigrations(dbPadrao());

    expect(aplicadasAgora).toEqual([]);
  });
});

describe('Falha de banco', () => {
  // Banco inalcançável de verdade (porta fechada), injetado no app.
  const dbForaDoAr = criarDb('postgres://ninguem:senha@127.0.0.1:1/nenhum', {
    connectionTimeoutMillis: 2000
  });
  const appSemBanco = criarApp({ db: dbForaDoAr });

  afterAll(async () => { await dbForaDoAr.encerrar(); });

  it('responde 503 ao listar quando o banco está fora do ar', async () => {
    const res = await request(appSemBanco).get('/api/doacoes');

    expect(res.status).toBe(503);
    expect(res.body.erro).toMatch(/Banco de dados indisponível/);
  });

  it('responde 503 ao publicar quando o banco está fora do ar', async () => {
    const res = await request(appSemBanco)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-12-01' });

    expect(res.status).toBe(503);
  });

  it('a verificação de saúde continua respondendo sem banco', async () => {
    const res = await request(appSemBanco).get('/api/saude');

    expect(res.status).toBe(200);
  });

  it('exige DATABASE_URL para criar a conexão', () => {
    expect(() => criarDb('')).toThrow(/DATABASE_URL/);
  });
});
