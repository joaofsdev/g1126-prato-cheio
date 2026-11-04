import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const caminho = fileURLToPath(new URL('../public/index.html', import.meta.url));
const html = readFileSync(caminho, 'utf8');

function filtrar(doacoes, filtro) {
  const document = {
    getElementById: () => ({ value: filtro })
  };

  const inicio = html.indexOf('const filtro =', html.indexOf('async function carregar()'));
  const fim = html.indexOf('lista.innerHTML = doacoesFiltradas.length', inicio);

  if (inicio === -1 || fim === -1) {
    throw new Error('Lógica de filtragem não encontrada no index.html');
  }

  const codigo = html.slice(inicio, fim);

  return new Function('document', 'doacoes', `${codigo}\nreturn doacoesFiltradas;`)(
    document,
    doacoes
  );
}

describe('História 9 - Filtrar doações por tipo de alimento', () => {
  const doacoes = [
    { id: 1, tipo: 'Arroz' },
    { id: 2, tipo: 'Feijão' },
    { id: 3, tipo: 'Arroz integral' }
  ];

  it('filtra as doações pelo tipo de alimento', () => {
    const resultado = filtrar(doacoes, 'arroz');

    expect(resultado.map((d) => d.id)).toEqual([1, 3]);
  });

  it('ignora diferenças entre letras maiúsculas e minúsculas', () => {
    const resultado = filtrar(doacoes, 'ARROZ');

    expect(resultado.map((d) => d.id)).toEqual([1, 3]);
  });

  it('retorna todas as doações quando o filtro está vazio', () => {
    const resultado = filtrar(doacoes, '');

    expect(resultado).toEqual(doacoes);
  });

  it('retorna uma lista vazia quando não encontra alimentos', () => {
    const resultado = filtrar(doacoes, 'banana');

    expect(resultado).toEqual([]);
  });

  it('ignora espaços antes e depois do termo pesquisado', () => {
    const resultado = filtrar(doacoes, '  feijão  ');

    expect(resultado.map((d) => d.id)).toEqual([2]);
  });
});