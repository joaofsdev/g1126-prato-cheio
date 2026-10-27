
import { ErroValidacao, ErroNaoEncontrado, ErroConflito } from './erros.js';
import { hojeNaOperacao } from './datas.js';

export const TAMANHO_MAXIMO = {
  tipo: 100,
  quantidade: 50,
  ong: 120,
  motorista: 120
};

function exigirTamanhoMaximo(campo, texto) {
  if (texto.length > TAMANHO_MAXIMO[campo]) {
    throw new ErroValidacao(`Dados inválidos: ${campo} pode ter no máximo ${TAMANHO_MAXIMO[campo]} caracteres`);
  }
}

function ehDataIso(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;

  const data = new Date(`${texto}T00:00:00Z`);

  return !Number.isNaN(data.getTime()) &&
    data.toISOString().slice(0, 10) === texto;
}

function validarDadosDoacao(dados) {
  const { tipo, quantidade, validade } = dados ?? {};

  if (!tipo || typeof tipo !== 'string' || !tipo.trim()) {
    throw new ErroValidacao('Dados obrigatórios ausentes: tipo');
  }

  exigirTamanhoMaximo('tipo', tipo.trim());

  const textoQuantidade = String(quantidade ?? '').trim();
  const numeroInicial = Number.parseFloat(
    textoQuantidade.replace(',', '.')
  );

  if (
    !textoQuantidade ||
    (!Number.isNaN(numeroInicial) && numeroInicial <= 0)
  ) {
    throw new ErroValidacao(
      'Dados obrigatórios ausentes ou inválidos: quantidade'
    );
  }

  exigirTamanhoMaximo('quantidade', textoQuantidade);

  if (!validade || typeof validade !== 'string' || !validade.trim()) {
    throw new ErroValidacao('Dados obrigatórios ausentes: validade');
  }

  if (!ehDataIso(validade.trim())) {
    throw new ErroValidacao(
      'Dados inválidos: validade deve ser uma data no formato AAAA-MM-DD'
    );
  }

  if (validade.trim() < hojeNaOperacao()) {
    throw new ErroValidacao('Dados inválidos: validade já passou');
  }
}

export function criarServicoDoacoes(repositorio) {
  async function criarDoacao(dados) {
    validarDadosDoacao(dados);

    const { tipo, quantidade, validade } = dados;

    return repositorio.inserir({
      tipo: tipo.trim(),
      quantidade: String(quantidade).trim(),
      validade: validade.trim()
    });
  }

  async function listarDisponiveis() {
    return repositorio.listarDisponiveis();
  }

  async function buscarPorId(id) {
    const doacao = await repositorio.buscarPorId(id);

    if (!doacao) {
      throw new ErroNaoEncontrado('Doação não encontrada');
    }

    return doacao;
  }

  async function aceitar(id, ong) {
    if (!ong || typeof ong !== 'string' || !ong.trim()) {
      throw new ErroValidacao(
        'ONG é obrigatória para aceitar a doação'
      );
    }

    exigirTamanhoMaximo('ong', ong.trim());

    const doacao = await repositorio.buscarPorId(id);

    if (!doacao) {
      throw new ErroNaoEncontrado('Doação não encontrada');
    }

    const aceita = await repositorio.marcarComoAceita(
      id,
      ong.trim()
    );

    if (!aceita) {
      const atual = await repositorio.buscarPorId(id);

      throw new ErroConflito(
        atual?.status === 'disponivel'
          ? 'Doação vencida não pode ser aceita'
          : 'Doação já foi aceita por outra ONG'
      );
    }

    return repositorio.buscarPorId(id);
  }

  async function confirmarRetirada(id, motorista) {
    if (
      !motorista ||
      typeof motorista !== 'string' ||
      !motorista.trim()
    ) {
      throw new ErroValidacao(
        'Motorista é obrigatório para confirmar a retirada'
      );
    }

    exigirTamanhoMaximo('motorista', motorista.trim());

    const doacao = await repositorio.buscarPorId(id);

    if (!doacao) {
      throw new ErroNaoEncontrado('Doação não encontrada');
    }

    if (doacao.status !== 'aceita') {
      throw new ErroConflito(
        doacao.status === 'retirada'
          ? 'Doação já foi retirada'
          : 'Somente doações aceitas podem ter a retirada confirmada'
      );
    }

    const retirada = await repositorio.marcarComoRetirada(
      id,
      motorista.trim()
    );

    if (!retirada) {
      throw new ErroConflito(
        'Doação já foi retirada ou não está mais disponível para confirmação'
      );
    }

    return repositorio.buscarPorId(id);
  }

  return {
    criarDoacao,
    listarDisponiveis,
    buscarPorId,
    aceitar,
    confirmarRetirada
  };
}