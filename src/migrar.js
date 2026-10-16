// Runner de migrations: aplica, em ordem alfabética, os arquivos .sql de migrations/
// que ainda não constam na tabela schema_migrations. Cada arquivo roda numa transação
// própria: se falhar no meio, nada dele fica aplicado.
//
// Regra do time: migration já integrada na main nunca é editada — mudança no schema
// vira um arquivo novo (002_..., 003_...).
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PASTA_MIGRATIONS = fileURLToPath(new URL('../migrations/', import.meta.url));

/**
 * @param {{ query: Function, transacao: Function }} db
 * @returns {Promise<string[]>} nomes das migrations aplicadas nesta execução
 */
export async function aplicarMigrations(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      versao      TEXT PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await db.query('SELECT versao FROM schema_migrations');
  const jaAplicadas = new Set(rows.map((r) => r.versao));

  const arquivos = (await readdir(PASTA_MIGRATIONS))
    .filter((nome) => nome.endsWith('.sql'))
    .sort();

  const aplicadasAgora = [];
  for (const arquivo of arquivos) {
    if (jaAplicadas.has(arquivo)) continue;

    const sql = await readFile(path.join(PASTA_MIGRATIONS, arquivo), 'utf8');
    await db.transacao(async (query) => {
      await query(sql);
      await query('INSERT INTO schema_migrations (versao) VALUES ($1)', [arquivo]);
    });
    aplicadasAgora.push(arquivo);
  }
  return aplicadasAgora;
}
