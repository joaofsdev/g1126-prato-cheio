import * as repositorio from './repositorio.js';

/**
 * Valida os dados obrigatórios de uma doação.
 * @param {{tipo?: string, quantidade?: string|number, validade?: string}} dados
 * @throws {Error} Se algum dado obrigatório estiver ausente ou inválido.
 */
function validarDadosDoacao(dados) {
  const { tipo, quantidade, validade } = dados ?? {};

  if (!tipo || typeof tipo !== 'string' || !tipo.trim()) {
    throw new Error('Dados obrigatórios ausentes: tipo');
  }
  // Quantidade é texto livre ("10 porções", "5 kg"). Se começar com um número,
  // esse número precisa ser maior que zero ("0 kg" e "-3 kg" são recusados).
  const textoQuantidade = String(quantidade ?? '').trim();
  const numeroInicial = Number.parseFloat(textoQuantidade.replace(',', '.'));
  if (!textoQuantidade || (!Number.isNaN(numeroInicial) && numeroInicial <= 0)) {
    throw new Error('Dados obrigatórios ausentes ou inválidos: quantidade');
  }
  if (!validade || typeof validade !== 'string' || !validade.trim()) {
    throw new Error('Dados obrigatórios ausentes: validade');
  }
}

/**
 * Cria uma nova doação disponível.
 * @param {{tipo: string, quantidade: string|number, validade: string}} dados
 * @returns {Promise<object>} A doação criada.
 */
export async function criarDoacao(dados) {
  validarDadosDoacao(dados);
  const { tipo, quantidade, validade } = dados;
  return repositorio.inserir({
    tipo: tipo.trim(),
    quantidade: String(quantidade).trim(),
    validade: validade.trim()
  });
}

/**
 * Lista todas as doações disponíveis para aceite.
 * @returns {Promise<object[]>}
 */
export async function listarDisponiveis() {
  return repositorio.listarDisponiveis();
}

/**
 * Marca uma doação como aceita por uma ONG.
 *
 * A checagem de concorrência ("já foi aceita?") é feita atomicamente
 * dentro do próprio UPDATE em repositorio.marcarComoAceita, evitando
 * condição de corrida entre a leitura (buscarPorId) e a escrita.
 *
 * @param {string|number} id
 * @param {string} ong
 * @returns {Promise<object>} A doação com status atualizado.
 */
export async function aceitar(id, ong) {
  if (!ong || typeof ong !== 'string' || !ong.trim()) {
    throw new Error('ONG é obrigatória para aceitar a doação');
  }

  const doacao = await repositorio.buscarPorId(id);
  if (!doacao) {
    throw new Error('Doação não encontrada');
  }

  const aceita = await repositorio.marcarComoAceita(id, ong.trim());
  if (!aceita) {
    throw new Error('Doação já foi aceita por outra ONG');
  }

  // Relê do banco para devolver o registro real, incluindo aceita_em.
  return repositorio.buscarPorId(id);
}
