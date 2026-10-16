import { hojeNaOperacao } from '../src/datas.js';

/**
 * Data AAAA-MM-DD a `dias` dias de hoje (negativo = no passado), no fuso da operação.
 * Os testes usam datas relativas para não quebrarem quando o calendário avança.
 */
export function daquiA(dias) {
  const hoje = new Date(`${hojeNaOperacao()}T00:00:00Z`);
  hoje.setUTCDate(hoje.getUTCDate() + dias);
  return hoje.toISOString().slice(0, 10);
}
