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

/**
 Marca a doação como aceita, mas só se ela ainda estiver 'disponivel', evita que duas
 ONGs aceitem a mesma doação em uma condição de corrida.
 Devolve `true` se esta chamada foi quem aceitou, `false` se já estava aceita.
 */
export async function marcarComoAceita(id, ong) {
  const { alteradas } = await query(
    `UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel'`,
    [ong, id]
  );
  return alteradas > 0;
}
