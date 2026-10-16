-- Schema inicial no PostgreSQL, equivalente ao da Unidade 1 (SQLite), com os tipos
-- ajustados ao novo dialeto:
--   INTEGER PRIMARY KEY AUTOINCREMENT  ->  INTEGER GENERATED ALWAYS AS IDENTITY
--   validade TEXT                      ->  DATE (a aplicação valida o formato AAAA-MM-DD)
--   criada_em/aceita_em TEXT           ->  TIMESTAMPTZ (instante com fuso)
--   datetime('now')                    ->  now()
--   status TEXT livre                  ->  TEXT com CHECK dos valores possíveis

CREATE TABLE doacoes (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo        TEXT        NOT NULL,
  quantidade  TEXT        NOT NULL,
  validade    DATE        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'disponivel'
                          CHECK (status IN ('disponivel', 'aceita')),
  ong         TEXT,
  criada_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  aceita_em   TIMESTAMPTZ
);

-- A listagem da ONG filtra por status e ordena por validade.
CREATE INDEX idx_doacoes_status_validade ON doacoes (status, validade);
