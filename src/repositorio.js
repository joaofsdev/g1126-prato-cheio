import { query } from './db.js';

const COLUNAS = 'id, tipo, quantidade, validade, status, ong';

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

export async function marcarComoAceita(id, ong) {
  const { alteradas } = await query(
    `UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel'`,
    [ong, id]
  );
  return alteradas > 0;
}
