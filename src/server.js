
import { criarApp } from './app.js';
import { migrar, encerrar } from './db.js';

// Define a porta do servidor.
const porta = Number(process.env.PORT ?? 3000);

// Inicializa o servidor e prepara o banco de dados.
async function iniciarServidor() {
  // Verifica se a porta informada é válida.
  if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
    throw new Error('PORT deve ser um número entre 1 e 65535.');
  }

  // Prepara o banco antes de aceitar requisições.
  await migrar();
  console.log('Banco de dados pronto.');

  // Cria a aplicação e inicia o servidor.
  const servidor = criarApp().listen(porta, () => {
    console.log(`Prato Cheio rodando em http://localhost:${porta}`);
  });

  // Trata, por exemplo, o caso em que a porta já está ocupada.
  servidor.on('error', (erro) => {
    console.error('Erro no servidor:', erro);
    process.exitCode = 1;
  });

  // Evita executar o encerramento mais de uma vez.
  let encerrando = false;

  // Encerra o servidor e fecha a conexão com o banco.
  function finalizar(sinal) {
    if (encerrando) return;

    encerrando = true;

    console.log(`Sinal ${sinal} recebido. Encerrando o servidor...`);

    servidor.close(async (erro) => {
      try {
        if (erro) throw erro;

        await encerrar();

        console.log('Servidor e conexão com o banco encerrados.');
      } catch (falha) {
        console.error('Falha ao encerrar:', falha);
        process.exitCode = 1;
      }
    });
  }

  // Trata sinais de encerramento do processo.
  process.once('SIGINT', () => finalizar('SIGINT'));
  process.once('SIGTERM', () => finalizar('SIGTERM'));
}

// Inicia a aplicação e trata possíveis falhas.
iniciarServidor().catch((erro) => {
  console.error('Não foi possível iniciar o Prato Cheio:', erro);
  process.exitCode = 1;
});
