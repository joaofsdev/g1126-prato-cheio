import { ErroValidacao, ErroNaoEncontrado, ErroConflito } from './erros.js';
import { hojeNaOperacao } from './datas.js';

/**
 * Diz se o texto é uma data real no formato AAAA-MM-DD (ex.: recusa 2026-02-30).
 * @param {string} texto
 */
function ehDataIso(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const data = new Date(`${texto}T00:00:00Z`);
  // Se o JS "corrigiu" a data (30/02 -> 02/03), ela não existia.
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto;
}

/**
 * Valida os dados obrigatórios de uma doação.
 * @param {{tipo?: string, quantidade?: string|number, validade?: string}} dados
 * @throws {ErroValidacao} Se algum dado obrigatório estiver ausente ou inválido.
 */
function validarDadosDoacao(dados) {
  const { tipo, quantidade, validade } = dados ?? {};

  if (!tipo || typeof tipo !== 'string' || !tipo.trim()) {
    throw new ErroValidacao('Dados obrigatórios ausentes: tipo');
  }
  // Quantidade é texto livre ("10 porções", "5 kg"). Se começar com um número,
  // esse número precisa ser maior que zero ("0 kg" e "-3 kg" são recusados).
  const textoQuantidade = String(quantidade ?? '').trim();
  const numeroInicial = Number.parseFloat(textoQuantidade.replace(',', '.'));
  if (!textoQuantidade || (!Number.isNaN(numeroInicial) && numeroInicial <= 0)) {
    throw new ErroValidacao('Dados obrigatórios ausentes ou inválidos: quantidade');
  }
  if (!validade || typeof validade !== 'string' || !validade.trim()) {
    throw new ErroValidacao('Dados obrigatórios ausentes: validade');
  }
  // No PostgreSQL a coluna é DATE: validamos aqui para responder 400 com uma
  // mensagem clara, em vez de deixar o banco recusar com erro 500.
  if (!ehDataIso(validade.trim())) {
    throw new ErroValidacao('Dados inválidos: validade deve ser uma data no formato AAAA-MM-DD');
  }
  // Regra 1: não faz sentido publicar um alimento que já venceu. Comparar texto
  // funciona porque as duas datas estão no formato AAAA-MM-DD.
  if (validade.trim() < hojeNaOperacao()) {
    throw new ErroValidacao('Dados inválidos: validade já passou');
  }
}

/**
 * Cria as regras de negócio das doações sobre um repositório (ver repositorio.js).
 * @param {ReturnType<import('./repositorio.js').criarRepositorio>} repositorio
 */
export function criarServicoDoacoes(repositorio) {
  /**
   * Cria uma nova doação disponível.
   * @param {{tipo: string, quantidade: string|number, validade: string}} dados
   * @returns {Promise<object>} A doação criada.
   */
  async function criarDoacao(dados) {
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
  async function listarDisponiveis() {
    return repositorio.listarDisponiveis();
  }

  /**
   * Devolve o registro completo de uma doação, em qualquer status (rastreabilidade).
   * @param {number} id
   * @returns {Promise<object>}
   * @throws {ErroNaoEncontrado} Se a doação não existir.
   */
  async function buscarPorId(id) {
    const doacao = await repositorio.buscarPorId(id);
    if (!doacao) {
      throw new ErroNaoEncontrado('Doação não encontrada');
    }
    return doacao;
  }

  /**
   * Marca uma doação como aceita por uma ONG.
   *
   * A checagem de concorrência ("já foi aceita?") é feita atomicamente
   * dentro do próprio UPDATE em repositorio.marcarComoAceita, evitando
   * condição de corrida entre a leitura (buscarPorId) e a escrita.
   *
   * @param {number} id
   * @param {string} ong
   * @returns {Promise<object>} A doação com status atualizado.
   */
  async function aceitar(id, ong) {
    if (!ong || typeof ong !== 'string' || !ong.trim()) {
      throw new ErroValidacao('ONG é obrigatória para aceitar a doação');
    }

    const doacao = await repositorio.buscarPorId(id);
    if (!doacao) {
      throw new ErroNaoEncontrado('Doação não encontrada');
    }

    const aceita = await repositorio.marcarComoAceita(id, ong.trim());
    if (!aceita) {
      // O UPDATE não alterou nada: relemos para dizer à ONG o motivo certo.
      // Se ainda está disponível, só pode ter sido a validade (Regra 1).
      const atual = await repositorio.buscarPorId(id);
      throw new ErroConflito(atual?.status === 'disponivel'
        ? 'Doação vencida não pode ser aceita'
        : 'Doação já foi aceita por outra ONG');
    }

    // Relê do banco para devolver o registro real, incluindo aceita_em.
    return repositorio.buscarPorId(id);
  }

  return { criarDoacao, listarDisponiveis, buscarPorId, aceitar };
}
