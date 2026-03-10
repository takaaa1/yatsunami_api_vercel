-- Staging table for legacy clientes_registrados import.
-- Run your INSERT from clientes_registrados_rows.sql after this migration,
-- then run: npx ts-node scripts/import-clientes-legacy.ts
CREATE TABLE IF NOT EXISTS "clientes_registrados" (
    "id" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(255),
    "telefone" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "cpf_cnpj" VARCHAR(20),
    "cep" VARCHAR(20),
    "numero" VARCHAR(20),
    "endereco" TEXT,
    "observacoes" TEXT,
    "password_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6),
    "complemento" VARCHAR(255),
    "receber_notificacoes" VARCHAR(10)
);
