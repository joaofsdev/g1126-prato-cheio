
ALTER TABLE doacoes
    DROP CONSTRAINT doacoes_status_check;

ALTER TABLE doacoes
    ADD CONSTRAINT doacoes_status_check
    CHECK (status IN ('disponivel', 'aceita', 'retirada'));

ALTER TABLE doacoes
    ADD COLUMN retirada_em TIMESTAMPTZ,
    ADD COLUMN motorista TEXT;