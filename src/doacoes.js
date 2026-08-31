import * as repositorio from './repositorio.js';

export async function criarDoacao(dados) {
  const { tipo, quantidade, validade } = dados ?? {};
  if (!tipo || !quantidade || !validade) {
    throw new Error('Dados obrigatórios ausentes: tipo, quantidade, validade');
  }
  return repositorio.inserir({ tipo, quantidade, validade });
}

export async function listarDisponiveis() {
  return repositorio.listarDisponiveis();
}

export async function aceitar(id, ong) {
  const doacao = await repositorio.buscarPorId(id);
  if (!doacao) {
    throw new Error('Doação não encontrada');
  }
  if (doacao.status !== 'disponivel') {
    throw new Error('Doação já foi aceita por outra ONG');
  }
  await repositorio.marcarComoAceita(id, ong);
  return { ...doacao, status: 'aceita', ong };
}
