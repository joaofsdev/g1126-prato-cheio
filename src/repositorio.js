// Acesso aos dados das doações. Todo o SQL do projeto fica aqui: rotas e regras de
// negócio não conhecem SQL. O `db` é recebido por parâmetro (injeção de dependência),
// o que permite trocar o banco nos testes — por exemplo, por um que está fora do ar.

// criada_em e aceita_em permitem medir o tempo entre a publicação e o aceite
// (hipótese e experimento em docs/analise.md).
const COLUNAS = 'id, tipo, quantidade, validade, status, ong, criada_em, aceita_em';

/** @param {{ query: (sql: string, valores?: unknown[]) => Promise<{ rows: object[], alteradas: number }> }} db */
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

    // Regra 1: doação vencida (validade antes de hoje) não aparece como disponível.
    // A validade é o último dia em que o alimento pode ser retirado, então "hoje" ainda vale.
    // Ordena pela validade: o que vence primeiro aparece primeiro para a ONG.
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

    // UPDATE atômico: só altera se a doação ainda estiver disponível e dentro da validade.
    // Se nenhuma linha for alterada, outra ONG aceitou antes (Regra 2) ou ela venceu (Regra 1).
    async marcarComoAceita(id, ong) {
      const { alteradas } = await db.query(
        `UPDATE doacoes
            SET status = 'aceita', ong = $1, aceita_em = now()
          WHERE id = $2 AND status = 'disponivel' AND validade >= CURRENT_DATE`,
        [ong, id]
      );
      return alteradas > 0;
    }
  };
}
