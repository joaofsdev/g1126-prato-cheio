import { query } from './db.js';

// criada_em e aceita_em permitem medir o tempo entre a publicação e o aceite
// (hipótese e experimento em docs/analise.md).
const COLUNAS = 'id, tipo, quantidade, validade, status, ong, criada_em, aceita_em';

export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade, status)
     VALUES (?, ?, ?, 'disponivel') RETURNING ${COLUNAS}`,
    [tipo, quantidade, validade]
  );
  return rows[0];
}

export async function listarDisponiveis() {
  const { rows } = await query(
    `SELECT ${COLUNAS} FROM doacoes WHERE status = 'disponivel'`
  );
  return rows;
}

export async function buscarPorId(id) {
  const { rows } = await query(
    `SELECT ${COLUNAS} FROM doacoes WHERE id = ?`,
    [id]
  );
  return rows[0];
}

// UPDATE atômico: só altera se a doação ainda estiver disponível.
// Se nenhuma linha for alterada, outra ONG aceitou antes (Regra 2).
export async function marcarComoAceita(id, ong) {
  const { alteradas } = await query(
    `UPDATE doacoes
        SET status = 'aceita', ong = ?, aceita_em = datetime('now')
      WHERE id = ? AND status = 'disponivel'`,
    [ong, id]
  );
  return alteradas > 0;
}
