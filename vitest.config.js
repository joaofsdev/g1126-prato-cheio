export default {
  test: {
    // Os testes rodam contra o PostgreSQL de teste (serviço `db-teste` do
    // docker-compose.yml), nunca contra o banco de desenvolvimento.
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ??
        'postgres://pratocheio:pratocheio@localhost:5433/pratocheio_teste'
    },
    // Todos os arquivos de teste usam o mesmo banco e o limpam antes de cada teste:
    // rodar arquivos em paralelo faria um apagar os dados do outro.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text', 'html']
    }
  }
};
