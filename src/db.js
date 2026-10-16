// Conexão com o PostgreSQL (driver `pg`).
//
// Este é o único arquivo que conhece o driver. O resto do código recebe um objeto
// `db` com `query(sql, valores)` devolvendo `{ rows, alteradas }` — o mesmo contrato
// da versão SQLite da Unidade 1, por isso as regras de negócio não mudaram na migração.
import pg from 'pg';
import { ErroBancoIndisponivel } from './erros.js';
import { aplicarMigrations } from './migrar.js';

// Colunas DATE (OID 1082) voltam como texto 'AAAA-MM-DD'. Sem isso o `pg` cria um
// Date no fuso do servidor e '2026-12-01' pode virar '2026-11-30T03:00:00Z' no JSON.
pg.types.setTypeParser(1082, (valor) => valor);

// Erros que significam "não deu para falar com o banco" (e não "o SQL está errado").
// Códigos 08xxx = connection exception; 57P01/57P03 = banco desligando/iniciando.
const CODIGOS_DE_CONEXAO = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', '57P01', '57P03']);

function ehFalhaDeConexao(erro) {
  const codigo = String(erro.code ?? '');
  return CODIGOS_DE_CONEXAO.has(codigo) ||
    codigo.startsWith('08') ||
    // O pg não põe `code` no timeout de conexão nem na conexão derrubada.
    /timeout exceeded when trying to connect|Connection terminated/i.test(erro.message ?? '');
}

// Traduz falhas de conexão para ErroBancoIndisponivel (HTTP 503); o resto segue como está.
function traduzirErro(erro) {
  return ehFalhaDeConexao(erro) ? new ErroBancoIndisponivel(erro) : erro;
}

/**
 * Cria um acesso ao banco a partir de uma URL de conexão.
 * O pool só é aberto na primeira consulta e pode ser reaberto depois de `encerrar()`.
 * @param {string} [url] padrão: process.env.DATABASE_URL
 * @param {{ connectionTimeoutMillis?: number }} [opcoes]
 */
export function criarDb(url = process.env.DATABASE_URL, opcoes = {}) {
  if (!url) {
    throw new Error('DATABASE_URL não definida. Copie .env.example para .env (veja o README).');
  }

  let pool = null;

  function obterPool() {
    if (!pool) {
      pool = new pg.Pool({
        connectionString: url,
        connectionTimeoutMillis: opcoes.connectionTimeoutMillis ?? 5000,
        // CURRENT_DATE e now() seguem o fuso da operação (Brasil), não o do servidor.
        options: '-c timezone=America/Sao_Paulo'
      });
      // Uma conexão ociosa que cai (ex.: banco reiniciou) não pode derrubar o processo.
      pool.on('error', (erro) => console.error('Conexão ociosa com o banco falhou:', erro.message));
    }
    return pool;
  }

  return {
    /**
     * Executa uma consulta parametrizada e devolve { rows, alteradas }.
     * Use $1, $2… como marcadores (os valores nunca são concatenados no SQL):
     *   query('SELECT * FROM doacoes WHERE id = $1', [id])
     */
    async query(sql, valores = []) {
      try {
        const resultado = await obterPool().query(sql, valores);
        return { rows: resultado.rows, alteradas: resultado.rowCount };
      } catch (erro) {
        throw traduzirErro(erro);
      }
    },

    /**
     * Executa `funcao` numa transação: COMMIT se ela terminar, ROLLBACK se lançar erro.
     * `funcao` recebe uma `query(sql, valores)` presa à mesma conexão.
     */
    async transacao(funcao) {
      let cliente;
      try {
        cliente = await obterPool().connect();
      } catch (erro) {
        throw traduzirErro(erro);
      }
      try {
        await cliente.query('BEGIN');
        const resultado = await funcao(async (sql, valores = []) => {
          const r = await cliente.query(sql, valores);
          return { rows: r.rows, alteradas: r.rowCount };
        });
        await cliente.query('COMMIT');
        return resultado;
      } catch (erro) {
        await cliente.query('ROLLBACK').catch(() => {});
        throw traduzirErro(erro);
      } finally {
        cliente.release();
      }
    },

    /** Fecha as conexões abertas. Uma consulta depois disso abre um pool novo. */
    async encerrar() {
      if (pool) {
        const antigo = pool;
        pool = null;
        await antigo.end();
      }
    }
  };
}

// Instância padrão (DATABASE_URL), criada só quando alguém precisa dela.
let padrao;
export function dbPadrao() {
  if (!padrao) padrao = criarDb();
  return padrao;
}

/** Aplica as migrations pendentes no banco padrão. Rodado ao subir o servidor e pelos testes. */
export async function migrar() {
  return aplicarMigrations(dbPadrao());
}

/** Apaga todos os dados e reinicia a numeração dos ids. Usado pelos testes. */
export async function limparBanco() {
  await dbPadrao().query('TRUNCATE doacoes RESTART IDENTITY');
}

export async function encerrar() {
  if (padrao) await padrao.encerrar();
}
