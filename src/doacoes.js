// Regras de negócio das doações.
import * as repo from './repositorio.js';

/**
 * História zero — "um doador publica uma doação".
 * Critério: tipo, quantidade e validade são obrigatórios.
 */
export async function criarDoacao({ tipo, quantidade, validade }) {
  if (!tipo || !quantidade || !validade) {
    throw new Error('Campos obrigatórios: tipo, quantidade, validade');
  }
  return repo.inserir({ tipo, quantidade, validade });
}

/** História zero — "uma ONG vê as doações disponíveis". */
export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}

/**
 * História zero — "uma ONG aceita uma doação".
 * Regra: uma doação aceita não fica disponível para outra ONG.
 */
export async function aceitar(id, ong) {
  if (!ong) {
    throw new Error('Nome da ONG é obrigatório');
  }
  const doacao = await repo.aceitar(id, ong);
  if (!doacao) {
    throw new Error('Doação não encontrada ou já foi aceita');
  }
  return doacao;
}
