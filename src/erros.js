// Erros conhecidos da aplicação. Cada um carrega o status HTTP que o representa,
// então o middleware de erros em app.js não precisa adivinhar pelo texto da mensagem.

export class ErroAplicacao extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.name = new.target.name;
    this.status = status;
  }
}

/** 400 — dados de entrada ausentes ou inválidos. */
export class ErroValidacao extends ErroAplicacao {
  constructor(mensagem) {
    super(mensagem, 400);
  }
}

/** 404 — o recurso pedido não existe. */
export class ErroNaoEncontrado extends ErroAplicacao {
  constructor(mensagem) {
    super(mensagem, 404);
  }
}

/** 409 — a operação conflita com o estado atual (ex.: doação já aceita). */
export class ErroConflito extends ErroAplicacao {
  constructor(mensagem) {
    super(mensagem, 409);
  }
}

/** 503 — o banco de dados está fora do ar ou inalcançável. A causa original fica em `cause` (só no log). */
export class ErroBancoIndisponivel extends ErroAplicacao {
  constructor(causa) {
    super('Banco de dados indisponível. Tente novamente em instantes.', 503);
    this.cause = causa;
  }
}
