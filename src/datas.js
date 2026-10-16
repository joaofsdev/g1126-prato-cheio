// "Hoje" para as regras de validade (Regra 1). A operação do Prato Cheio é no Brasil:
// usamos sempre o fuso de São Paulo, tanto aqui quanto na conexão com o banco
// (src/db.js), para que o JavaScript e o CURRENT_DATE do PostgreSQL concordem
// sobre que dia é hoje — inclusive entre 21h e meia-noite, quando em UTC já é amanhã.
export const FUSO_DA_OPERACAO = 'America/Sao_Paulo';

// 'en-CA' formata datas como AAAA-MM-DD, o mesmo formato da coluna validade.
const formatoIso = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_DA_OPERACAO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

/**
 * Data de hoje no fuso da operação, no formato AAAA-MM-DD.
 * @param {Date} [agora] permite fixar o instante nos testes
 */
export function hojeNaOperacao(agora = new Date()) {
  return formatoIso.format(agora);
}
