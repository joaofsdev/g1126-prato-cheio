
const COLUNAS = 'id, tipo, quantidade, validade, status, ong, criada_em, aceita_em, retirada_em, motorista';

export function criarRepositorio(db) {
  return {
    async inserir({ tipo, quantidade, validade }) {
      const { rows } = await db.query(
        `INSERT INTO doacoes (tipo, quantidade, validade, status)
         VALUES ($1, $2, $3, 'disponivel') RETURNING ${COLUNAS}`,
        [tipo, quantidade, validade]
      );
      return rows[0];
    },

    async listarDisponiveis() {
      const { rows } = await db.query(
        `SELECT ${COLUNAS} FROM doacoes
          WHERE status = 'disponivel' AND validade >= CURRENT_DATE
          ORDER BY validade, id`
      );
      return rows;
    },

    async buscarPorId(id) {
      const { rows } = await db.query(
        `SELECT ${COLUNAS} FROM doacoes WHERE id = $1`,
        [id]
      );
      return rows[0];
    },

    async marcarComoAceita(id, ong) {
      const { alteradas } = await db.query(
        `UPDATE doacoes
            SET status = 'aceita', ong = $1, aceita_em = now()
          WHERE id = $2 AND status = 'disponivel' AND validade >= CURRENT_DATE`,
        [ong, id]
      );
      return alteradas > 0;
    },

    async marcarComoRetirada(id, motorista) {
      const { alteradas } = await db.query(
        `UPDATE doacoes
            SET status = 'retirada',
                motorista = $1,
                retirada_em = now()
          WHERE id = $2 AND status = 'aceita'`,
        [motorista, id]
      );
      return alteradas > 0;
    }
  };
}