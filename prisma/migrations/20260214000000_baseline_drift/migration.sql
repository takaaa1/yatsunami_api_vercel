-- AlterTable
ALTER TABLE "datas_encomenda" ADD COLUMN IF NOT EXISTS "enderecos_especiais" JSONB;

-- AlterTable
ALTER TABLE "pedidos_encomenda" ADD COLUMN IF NOT EXISTS "endereco_especial_nome" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "precisa_talheres" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "itens_pedido_encomenda" ADD COLUMN IF NOT EXISTS "preco_unitario" DECIMAL(10,2);

-- CreateTable (Safety: using IF NOT EXISTS for the table if possible, but Postgres CREATE TABLE doesn't support IF NOT EXISTS in all versions with constraints easily, so I'll just be careful)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'configuracao_formularios') THEN
        CREATE TABLE "configuracao_formularios" (
            "id" INTEGER NOT NULL DEFAULT 1,
            "chave_pix" VARCHAR(255),
            "tipo_chave_pix" VARCHAR(50),
            "nome_recebedor" VARCHAR(25),
            "cidade_recebedor" VARCHAR(15),
            "taxa_entrega_base" DECIMAL(10,2) NOT NULL DEFAULT 12.00,
            "valor_minimo_taxa_reduzida" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
            "taxa_entrega_reduzida" DECIMAL(10,2) NOT NULL DEFAULT 8.00,
            "valor_minimo_isencao" DECIMAL(10,2) NOT NULL DEFAULT 130.00,
            "enderecos_especiais" JSONB NOT NULL DEFAULT '[]',
            "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "configuracao_formularios_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;
