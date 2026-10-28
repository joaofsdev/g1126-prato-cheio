import { hojeNaOperacao } from '../src/datas.js';

/**
 * Retorna a data (AAAA-MM-DD) a `dias` dias de hoje, no fuso da operação.
 * Use valores negativos para datas no passado.
 *
 * Os testes usam datas relativas para não quebrarem quando o calendário avança.
 *
 * @param {number} [dias=0] Quantidade de dias a somar (negativo = passado).
 * @returns {string} Data no formato AAAA-MM-DD.
 *
 * @exemplo
 * daquiA(0);  // hoje
 * daquiA(7);  // daqui a uma semana
 * daquiA(-1); // ontem
 */
export function daquiA(dias = 0) {
  // Meia-noite em UTC evita que o horário de verão ou o fuso do ambiente
  const data = new Date(`${hojeNaOperacao()}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}
