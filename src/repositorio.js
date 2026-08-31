import { query } from './db.js';

export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade) VALUES (?, ?, ?) RETURNING *`,
    [tipo, quantidade, validade]
  );
  return rows[0];
}

export async function listarDisponiveis() {
  const { rows } = await query(`SELECT * FROM doacoes WHERE status = 'disponivel'`);
  return rows;
}

export async function buscarPorId(id) {
  const { rows } = await query(`SELECT * FROM doacoes WHERE id = ?`, [id]);
  return rows[0];
}

export async function marcarComoAceita(id, ong) {
  await query(`UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ?`, [ong, id]);
}
