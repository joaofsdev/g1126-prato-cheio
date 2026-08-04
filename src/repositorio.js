// Camada de dados do Prato Cheio — acesso ao banco.
import { query } from './db.js';

/** Insere uma doação e devolve a linha criada. */
export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    'INSERT INTO doacoes (tipo, quantidade, validade) VALUES (?, ?, ?) RETURNING *',
    [tipo, quantidade, validade]
  );
  return rows[0];
}

/** Devolve apenas as doações com status 'disponivel'. */
export async function listarDisponiveis() {
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY criada_em DESC"
  );
  return rows;
}

/** Busca uma doação pelo id (devolve undefined se não existir). */
export async function buscarPorId(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

/** Marca a doação como aceita pela ONG e devolve a linha atualizada.
 *  Garante que apenas doações com status 'disponivel' podem ser aceitas,
 *  impedindo que duas ONGs aceitem a mesma doação. */
export async function aceitar(id, ong) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel' RETURNING *",
    [ong, id]
  );
  return rows[0];
}
