// `npm run db:migrar-dados-sqlite [-- caminho/dados.sqlite]`
//
// Copia as doações de um arquivo SQLite da Unidade 1 para o PostgreSQL de DATABASE_URL,
// preservando ids, status, ONG e os instantes de publicação/aceite.
// Só roda num banco PostgreSQL sem doações e é tudo-ou-nada (uma transação).
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { criarDb } from '../src/db.js';
import { aplicarMigrations } from '../src/migrar.js';

// node:sqlite carregado via createRequire, como era em src/db.js na Unidade 1.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

const arquivo = process.argv[2] ?? process.env.DATABASE_FILE ?? 'dados.sqlite';
if (!existsSync(arquivo)) {
  console.error(`Arquivo SQLite não encontrado: ${arquivo}`);
  process.exit(1);
}

const sqlite = new DatabaseSync(arquivo, { readOnly: true });
const linhas = sqlite.prepare('SELECT * FROM doacoes ORDER BY id').all();
sqlite.close();

if (linhas.length === 0) {
  console.log('Nenhuma doação no SQLite; nada a copiar.');
  process.exit(0);
}

// validade era TEXT livre no SQLite e agora é DATE: avisamos antes de tentar.
const invalidas = linhas.filter((l) => !/^\d{4}-\d{2}-\d{2}$/.test(String(l.validade)));
if (invalidas.length) {
  console.error('Doações com validade fora do formato AAAA-MM-DD (corrija no SQLite e rode de novo):');
  for (const l of invalidas) console.error(`  id ${l.id}: "${l.validade}"`);
  process.exit(1);
}

const db = criarDb();
try {
  await aplicarMigrations(db);

  await db.transacao(async (query) => {
    const { rows } = await query('SELECT count(*)::int AS total FROM doacoes');
    if (rows[0].total > 0) {
      throw new Error('A tabela doacoes no PostgreSQL já tem dados; a cópia só roda num banco vazio.');
    }

    for (const l of linhas) {
      // datetime('now') do SQLite grava 'AAAA-MM-DD HH:MM:SS' em UTC, sem fuso.
      // OVERRIDING SYSTEM VALUE permite gravar o id original numa coluna IDENTITY.
      await query(
        `INSERT INTO doacoes (id, tipo, quantidade, validade, status, ong, criada_em, aceita_em)
         OVERRIDING SYSTEM VALUE
         VALUES ($1, $2, $3, $4, $5, $6,
                 $7::timestamp AT TIME ZONE 'UTC',
                 $8::timestamp AT TIME ZONE 'UTC')`,
        [l.id, l.tipo, l.quantidade, l.validade, l.status, l.ong ?? null,
          l.criada_em, l.aceita_em ?? null]
      );
    }

    // A numeração automática precisa continuar depois do maior id copiado.
    await query(`SELECT setval(pg_get_serial_sequence('doacoes', 'id'), (SELECT max(id) FROM doacoes))`);
  });

  console.log(`${linhas.length} doações copiadas de ${arquivo} para o PostgreSQL.`);
} catch (erro) {
  console.error('Falha ao copiar os dados:', erro.cause?.message ?? erro.message);
  process.exitCode = 1;
} finally {
  await db.encerrar();
}
