// `npm run db:migrar` — aplica as migrations pendentes no banco de DATABASE_URL.
import { criarDb } from '../src/db.js';
import { aplicarMigrations } from '../src/migrar.js';

const db = criarDb();
try {
  const aplicadas = await aplicarMigrations(db);
  console.log(aplicadas.length
    ? `Migrations aplicadas: ${aplicadas.join(', ')}`
    : 'Schema já está atualizado.');
} catch (erro) {
  console.error('Falha ao migrar o banco:', erro.cause?.message ?? erro.message);
  process.exitCode = 1;
} finally {
  await db.encerrar();
}
