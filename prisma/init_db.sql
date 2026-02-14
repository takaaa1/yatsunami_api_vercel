-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "cpf_cnpj" VARCHAR(20),
    "observacoes" TEXT,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "tema" VARCHAR(20) NOT NULL,
    "idioma" VARCHAR(10) NOT NULL,
    "endereco" JSONB NOT NULL DEFAULT '[]',
    "receber_notificacoes" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar_url" VARCHAR(500),
    "senha_hash" VARCHAR(255),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" JSON NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" SERIAL NOT NULL,
    "nome" JSON NOT NULL,
    "preco" DECIMAL(10,2),
    "ingredientes" JSON,
    "quantidade" INTEGER DEFAULT 1,
    "categoria" JSON NOT NULL,
    "observacoes" JSON,
    "imagem" VARCHAR(500),
    "abreviacao" VARCHAR(50),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variedades_produto" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "nome" JSON NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "ingredientes" JSON,
    "quantidade" INTEGER DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "imagem" VARCHAR(500),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variedades_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" SERIAL NOT NULL,
    "usuario_id" TEXT,
    "data" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "criado_por" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_venda" (
    "id" SERIAL NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "variedade_id" INTEGER,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "tipo_desconto" VARCHAR(20),
    "valor_desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "itens_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datas_encomenda" (
    "id" SERIAL NOT NULL,
    "data_entrega" DATE NOT NULL,
    "data_limite_pedido" TIMESTAMPTZ(6) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enderecos_especiais" JSONB,

    CONSTRAINT "datas_encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos_encomenda" (
    "id" SERIAL NOT NULL,
    "data_encomenda_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "variedade_id" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "produtos_encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_encomenda" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(10),
    "usuario_id" TEXT NOT NULL,
    "data_encomenda_id" INTEGER NOT NULL,
    "data_pedido" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "talheres" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "forma_pagamento" VARCHAR(50),
    "tipo_entrega" VARCHAR(20),
    "taxa_entrega" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_valor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status_pagamento" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "status_pagamento_anterior" VARCHAR(20),
    "data_pagamento" TIMESTAMPTZ(6),
    "confirmado_por" TEXT,
    "email_confirmacao_enviado" BOOLEAN NOT NULL DEFAULT false,
    "horario_estimado_entrega" VARCHAR(10),
    "endereco_entrega" JSONB,
    "endereco_especial_nome" VARCHAR(255),
    "precisa_talheres" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pedidos_encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_encomenda" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "variedade_id" INTEGER,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2),

    CONSTRAINT "itens_pedido_encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes_pedido_direto" (
    "id" SERIAL NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pedido_direto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos_pedido_direto" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "usuario_id" TEXT,
    "habilitado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produtos_pedido_direto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_diretos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(10),
    "usuario_id" TEXT NOT NULL,
    "data_pedido" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_entrega" DATE NOT NULL,
    "observacoes" TEXT,
    "total_valor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "confirmado_em" TIMESTAMPTZ(6),
    "confirmado_por" TEXT,
    "entregue_em" TIMESTAMPTZ(6),
    "entregue_por" TEXT,
    "venda_id" INTEGER,

    CONSTRAINT "pedidos_diretos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_direto" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "variedade_id" INTEGER,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_pedido_direto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotas_entrega" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "links" JSONB NOT NULL DEFAULT '[]',
    "horarios_chegada" JSONB,
    "nomes_paradas" JSONB,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rotas_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregador_localizacao" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entregador_localizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas_concluidas" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "parada_idx" INTEGER NOT NULL,
    "concluida_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entregas_concluidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_despesa" (
    "id" SERIAL NOT NULL,
    "nome_estabelecimento" VARCHAR(255),
    "data_compra" DATE,
    "valor_total" DECIMAL(10,2),
    "valor_total_sem_desconto" DECIMAL(10,2),
    "valor_desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "foi_editada" BOOLEAN NOT NULL DEFAULT false,
    "url_qrcode" VARCHAR(1000),
    "xml_raw" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_despesa" (
    "id" SERIAL NOT NULL,
    "nota_id" INTEGER NOT NULL,
    "descricao" VARCHAR(500),
    "quantidade" DECIMAL(10,3),
    "valor" DECIMAL(10,2),

    CONSTRAINT "itens_despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "destinatario" VARCHAR(255) NOT NULL,
    "assunto" VARCHAR(500) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "erro" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviado_em" TIMESTAMPTZ(6),
    "tipo_email" VARCHAR(50),
    "corpo_html" TEXT,
    "corpo_texto" TEXT,
    "dados_template" JSONB,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "usuario_id" TEXT,
    "nome_usuario" VARCHAR(255),
    "email_usuario" VARCHAR(255),
    "atividade" VARCHAR(100) NOT NULL,
    "detalhes" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigos_recuperacao" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "codigo" VARCHAR(6) NOT NULL,
    "expira_em" TIMESTAMPTZ(6) NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigos_recuperacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_encomenda_data_encomenda_id_produto_id_variedade_i_key" ON "produtos_encomenda"("data_encomenda_id", "produto_id", "variedade_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_encomenda_codigo_key" ON "pedidos_encomenda"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_encomenda_usuario_id_data_encomenda_id_key" ON "pedidos_encomenda"("usuario_id", "data_encomenda_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_pedido_direto_usuario_id_key" ON "clientes_pedido_direto"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_diretos_codigo_key" ON "pedidos_diretos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "rotas_entrega_form_id_key" ON "rotas_entrega"("form_id");

-- CreateIndex
CREATE UNIQUE INDEX "entregas_concluidas_form_id_parada_idx_key" ON "entregas_concluidas"("form_id", "parada_idx");

-- CreateIndex
CREATE INDEX "codigos_recuperacao_email_idx" ON "codigos_recuperacao"("email");

-- AddForeignKey
ALTER TABLE "variedades_produto" ADD CONSTRAINT "variedades_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_variedade_id_fkey" FOREIGN KEY ("variedade_id") REFERENCES "variedades_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_encomenda" ADD CONSTRAINT "produtos_encomenda_data_encomenda_id_fkey" FOREIGN KEY ("data_encomenda_id") REFERENCES "datas_encomenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_encomenda" ADD CONSTRAINT "produtos_encomenda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_encomenda" ADD CONSTRAINT "produtos_encomenda_variedade_id_fkey" FOREIGN KEY ("variedade_id") REFERENCES "variedades_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_encomenda" ADD CONSTRAINT "pedidos_encomenda_data_encomenda_id_fkey" FOREIGN KEY ("data_encomenda_id") REFERENCES "datas_encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_encomenda" ADD CONSTRAINT "pedidos_encomenda_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_encomenda" ADD CONSTRAINT "itens_pedido_encomenda_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_encomenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_encomenda" ADD CONSTRAINT "itens_pedido_encomenda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_encomenda" ADD CONSTRAINT "itens_pedido_encomenda_variedade_id_fkey" FOREIGN KEY ("variedade_id") REFERENCES "variedades_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_pedido_direto" ADD CONSTRAINT "clientes_pedido_direto_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_pedido_direto" ADD CONSTRAINT "produtos_pedido_direto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_diretos" ADD CONSTRAINT "pedidos_diretos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_diretos" ADD CONSTRAINT "pedidos_diretos_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_direto" ADD CONSTRAINT "itens_pedido_direto_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_diretos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_direto" ADD CONSTRAINT "itens_pedido_direto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_direto" ADD CONSTRAINT "itens_pedido_direto_variedade_id_fkey" FOREIGN KEY ("variedade_id") REFERENCES "variedades_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotas_entrega" ADD CONSTRAINT "rotas_entrega_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "datas_encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregador_localizacao" ADD CONSTRAINT "entregador_localizacao_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "datas_encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas_concluidas" ADD CONSTRAINT "entregas_concluidas_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "datas_encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_despesa" ADD CONSTRAINT "itens_despesa_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "notas_despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- Row Level Security (RLS) Configuration
-- Yatsunami - Supabase PostgreSQL
-- =====================================================

-- HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE IF EXISTS usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS datas_encomenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS produtos_encomenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedidos_encomenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS itens_pedido_encomenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes_pedido_direto ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS produtos_pedido_direto ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedidos_diretos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS itens_pedido_direto ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rotas_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregador_localizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregas_concluidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notas_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS itens_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;

-- USUARIOS: ver/editar próprio registro
CREATE POLICY "usuarios_select_own" ON usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuarios_update_own" ON usuarios
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- CATEGORIAS: leitura para autenticados
CREATE POLICY "categorias_select_authenticated" ON categorias
    FOR SELECT USING (auth.role() = 'authenticated');

-- PRODUTOS: leitura para autenticados
CREATE POLICY "produtos_select_authenticated" ON produtos
    FOR SELECT USING (auth.role() = 'authenticated');

-- VENDAS: admin only
CREATE POLICY "vendas_admin_all" ON vendas
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "itens_venda_admin_all" ON itens_venda
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    );

-- ENCOMENDAS: datas e produtos para autenticados, pedidos para próprio usuário
CREATE POLICY "datas_encomenda_select" ON datas_encomenda
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "produtos_encomenda_select" ON produtos_encomenda
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pedidos_encomenda_select_own" ON pedidos_encomenda
    FOR SELECT USING (
        usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
    );

CREATE POLICY "pedidos_encomenda_insert_own" ON pedidos_encomenda
    FOR INSERT WITH CHECK (
        usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
    );

CREATE POLICY "pedidos_encomenda_update_own" ON pedidos_encomenda
    FOR UPDATE USING (
        usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
    );

CREATE POLICY "itens_pedido_encomenda_select_own" ON itens_pedido_encomenda
    FOR SELECT USING (
        pedido_id IN (
            SELECT id FROM pedidos_encomenda 
            WHERE usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
        )
    );

CREATE POLICY "itens_pedido_encomenda_insert_own" ON itens_pedido_encomenda
    FOR INSERT WITH CHECK (
        pedido_id IN (
            SELECT id FROM pedidos_encomenda 
            WHERE usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
        )
    );

-- PEDIDO DIRETO
CREATE POLICY "clientes_pd_select_own" ON clientes_pedido_direto
    FOR SELECT USING (
        usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
    );

CREATE POLICY "produtos_pd_select" ON produtos_pedido_direto
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pedidos_diretos_select_own" ON pedidos_diretos
    FOR SELECT USING (
        usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
    );

CREATE POLICY "pedidos_diretos_insert_own" ON pedidos_diretos
    FOR INSERT WITH CHECK (
        usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
    );

CREATE POLICY "itens_pd_select_own" ON itens_pedido_direto
    FOR SELECT USING (
        pedido_id IN (
            SELECT id FROM pedidos_diretos 
            WHERE usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
        )
    );

CREATE POLICY "itens_pd_insert_own" ON itens_pedido_direto
    FOR INSERT WITH CHECK (
        pedido_id IN (
            SELECT id FROM pedidos_diretos 
            WHERE usuario_id IN (SELECT id FROM usuarios WHERE id = auth.uid())
        )
    );

-- ENTREGA: leitura para autenticados
CREATE POLICY "rotas_select" ON rotas_entrega
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "entregador_loc_select" ON entregador_localizacao
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "entregas_concluidas_select" ON entregas_concluidas
    FOR SELECT USING (auth.role() = 'authenticated');

-- DESPESAS: admin only
CREATE POLICY "notas_despesa_admin" ON notas_despesa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "itens_despesa_admin" ON itens_despesa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    );

-- LOGS: admin only
CREATE POLICY "email_logs_admin" ON email_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "activity_logs_admin" ON activity_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    );

-- CONFIGURACOES: leitura para todos autenticados, escrita para admin
ALTER TABLE IF EXISTS configuracao_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracoes_select_all" ON configuracao_formularios
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "configuracoes_admin_all" ON configuracao_formularios
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    );

-- Insert base categories

-- =====================================================
-- CATALOG SEED DATA (Generated from current DB)
-- =====================================================

-- 1. CATEGORIAS
INSERT INTO "categorias" ("id", "nome", "ordem") VALUES (6, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', 1) ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "ordem" = EXCLUDED."ordem";
INSERT INTO "categorias" ("id", "nome", "ordem") VALUES (7, '{"pt-BR":"Congelados","ja-JP":"冷凍品"}', 2) ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "ordem" = EXCLUDED."ordem";
INSERT INTO "categorias" ("id", "nome", "ordem") VALUES (8, '{"pt-BR":"Sobremesas","ja-JP":"デザート"}', 3) ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "ordem" = EXCLUDED."ordem";
INSERT INTO "categorias" ("id", "nome", "ordem") VALUES (9, '{"pt-BR":"Outros","ja-JP":"その他"}', 4) ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "ordem" = EXCLUDED."ordem";
SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));

-- 2. PRODUTOS
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (3, '{"pt-BR":"ANPAN","ja-JP":"あんパン"}', 5, '{"pt-BR":"farinha, açúcar, sal, fermento, leite em pó, feijão de azuki, ovo, gergelim","ja-JP":"小麦粉、砂糖、塩、イースト、脱脂粉乳、あんこ、卵、ごま"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/49849d0f-23f9-4316-8909-b2e52ee4eb79.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (4, '{"pt-BR":"BENTO","ja-JP":"弁当"}', 40, '{"pt-BR":"arroz, carne empanado, omelete, salmão grelhado, kinpira, alface, tomate, shirumono","ja-JP":"ご飯、とんかつ、オムレツ、焼き鮭、きんぴら、レタス、トマト、お吸い物"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/bf846a06-1c88-4edf-99ab-72674926c4c1.jpeg', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (5, '{"pt-BR":"BOLONHESA","ja-JP":"ボロネーゼ"}', 21, '{"pt-BR":"carne moída, molho de tomate, cebola, alho, ketchup, molho inglês, açúcar, folha de louro","ja-JP":"挽き肉、トマトソース、玉ねぎ、にんにく、ケチャップ、ウスターソース、砂糖、ローリエ"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/2abc62f9-c924-4724-ac85-0ff38828d0c8.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (6, '{"pt-BR":"BUTAJIRU","ja-JP":"豚汁"}', 20, '{"pt-BR":"carne de porco, miso, batata, cebola, cenoura, konnyaku, inhame, cebolinha, miso","ja-JP":"豚肉、味噌、じゃがいも、玉ねぎ、にんじん、こんにゃく、山芋、ねぎ、味噌"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/ee80203f-b9dd-4137-9ca3-da3251784893.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (7, '{"pt-BR":"CHAASHUU DONBURI","ja-JP":"チャーシュー丼"}', 32, '{"pt-BR":"arroz, chaashuu (porco), cebolinha, molho tare","ja-JP":"ご飯、チャーシュー、ねぎ、タレ"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/d4a716c7-b7e6-40fc-b8c3-ee0799ea5816.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (8, '{"pt-BR":"CROISSANT","ja-JP":"クロワッサン"}', 0, '{"pt-BR":"farinha, água, sal, leite, manteiga, fermento, presunto, queijo, gema de ovo, orégano","ja-JP":"小麦粉、水、塩、牛乳、バター、イースト、ハム、チーズ、卵黄、オレガノ"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', '{"pt-BR":"4 unidades","ja-JP":"４個"}', 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/cfaf8c3a-3bda-4e09-93f1-b8617ca92dc8.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (11, '{"pt-BR":"DRY KARÊ","ja-JP":"ドライカレー"}', 16, '{"pt-BR":"carne moída, tomate, cebola, pó de karê, molho de tomatê, molho inglês, pimentão, sal","ja-JP":"挽き肉、トマト、玉ねぎ、カレー粉、トマトソース、ウスターソース、ピーマン、塩"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/769ba5e9-e7fe-41f8-a88b-8c498e015959.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (12, '{"pt-BR":"ECLAIR","ja-JP":"エクレア"}', 6.5, '{"pt-BR":"farinha, margarina, ovo, água, leite, açúcar, baunilha, chocolate meio amargo","ja-JP":"小麦粉、マーガリン、卵、水、牛乳、砂糖、バニラ、ビターチョコレート"}', 1, '{"pt-BR":"Sobremesas","ja-JP":"デザート"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/2195d67e-105f-4c2d-a590-6ed557f77b56.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (13, '{"pt-BR":"ESPETINHO","ja-JP":"串焼き"}', 0, NULL, 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, NULL, NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (16, '{"pt-BR":"GYUDON","ja-JP":"牛丼"}', 22, '{"pt-BR":"carne bovina fatiada, cebola, caldo dashi, shoyu, mirin, açúcar, saque, gengibre","ja-JP":"薄切り牛肉、玉ねぎ、だし、醤油、みりん、砂糖、酒、生姜"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/1ed048db-c38e-4723-838a-75e251662d6c.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (17, '{"pt-BR":"HAMBURGUER","ja-JP":"ハンバーガー"}', 19, '{"pt-BR":"carne moída, cebola, pão com leite, molho de hamburguer, queijo, sal, pimenta do reino","ja-JP":"挽き肉、玉ねぎ、牛乳を吸わせたパン、ハンバーグソース、チーズ、塩、胡椒"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/563b86cf-65c9-4119-9b7c-e2517f40adbc.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (18, '{"pt-BR":"HIASHI CHUUKA","ja-JP":"冷やし中華"}', 29, '{"pt-BR":"macarrão de lámen, pepino, omelete, presunto, broto de feijão, tomate, molho de hiashi chuuka","ja-JP":"ラーメン麺、きゅうり、薄焼き卵、ハム、もやし、トマト、冷やし中華のタレ"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/2eda294e-6cd8-4081-83cf-c16f5ccf5663.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (19, '{"pt-BR":"KARAAGE","ja-JP":"唐揚げ"}', 22, '{"pt-BR":"frango em pedaços, gengibre, amido de milho, sal, aginomoto, clara de ovo, óleo","ja-JP":"鶏肉、生姜、片栗粉、塩、味の素、卵白、油"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/2c7001b5-96da-4630-be21-34ddb5ad34d7.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (20, '{"pt-BR":"KARE","ja-JP":"カレー (単品）"}', 24, '{"pt-BR":"carne bovina, batata, cenoura, cebola, roux de curry japonês, maçã ralado, alho","ja-JP":"牛肉、じゃがいも、にんじん、玉ねぎ、日本のカレールウ、すりおろしりんご、にんにく"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/687849d2-06dc-4f90-bfaf-b5845eccbb81.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (21, '{"pt-BR":"KINPIRA","ja-JP":"金平ごぼう"}', 15, '{"pt-BR":"gobo, dashi, shoyu, açúcar","ja-JP":"ごぼう、だし、醤油、砂糖"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/123603ee-6a2c-4384-8fc0-91c60c1c9b4f.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (22, '{"pt-BR":"KITSUNE UDON","ja-JP":"きつねうどん"}', 24, '{"pt-BR":"macarrão udon, aburaage (tofu frito), caldo dashi, shoyu, cebolinha","ja-JP":"うどん、油揚げ、だし、醤油、ねぎ"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/fd212317-cd1c-460e-8507-4634476f0804.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (23, '{"pt-BR":"KONNYAKU","ja-JP":"こんにゃく"}', 8, '{"pt-BR":"batata de konyaku, dashi, shoyu, açúcar","ja-JP":"こんにゃく芋、だし、醤油、砂糖"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/a4c682cc-e327-42fa-bbaa-d289e0c8edb5.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (24, '{"pt-BR":"KUROMAME","ja-JP":"黒豆"}', 10, '{"pt-BR":"feijão de soja preto, açúcar, bicarbonato de sódio","ja-JP":"黒豆、砂糖、重曹"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/c6b6c14d-daac-4d0a-a7ca-cc7c947408c6.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (25, '{"pt-BR":"LAMEN SOPA","ja-JP":"ラーメンスープ"}', 0, '{"pt-BR":"água, frango, shoyu, alho, sal","ja-JP":"水、鶏肉、醤油、にんにく、塩"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/60a0bccc-1221-4967-bb6e-f7f82f5ad3b8.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (27, '{"pt-BR":"MACARRÃO LAMEN","ja-JP":"ラーメン麺"}', 0, '{"pt-BR":"farinha, aratuta, sal, água, corante, bicarbonato de sódio","ja-JP":"小麦粉、アラルート、塩、水、着色料、重曹"}', 1, '{"pt-BR":"Congelados","ja-JP":"冷凍品"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/15152979-ccbb-4e6f-9620-491217536377.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (29, '{"pt-BR":"MACARRÃO YAKISOBA","ja-JP":"焼きそば麺"}', 2, '{"pt-BR":"farinha, sal, araruta, água, corante, bicarbonato de sódio","ja-JP":"小麦粉、塩、アラルート、水、着色料、重曹"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', '{"pt-BR":"240g","ja-JP":"240g"}', 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/1b711a81-b007-4992-a8fc-eef95f82b114.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (30, '{"pt-BR":"MADELEINE","ja-JP":"マドレーヌ"}', 16, '{"pt-BR":"farinha de trigo, manteiga, ovo, açúcar, fermento","ja-JP":"小麦粉、バター、卵、砂糖、ベーキングパウダー"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/2f86eec2-942f-419a-aefc-a23c8d9d860b.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (31, '{"pt-BR":"MELON PAN","ja-JP":"メロンパン"}', 13, '{"pt-BR":"farinha, açúçar, sal, fermento, manteiga, ovo, baunilha, açúcar cristal","ja-JP":"小麦粉、砂糖、塩、イースト、バター、卵、バニラ、グラニュー糖"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/c5ca2102-abe1-4c7b-9d3f-7572297f1162.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (32, '{"pt-BR":"MOLHO SÔSU","ja-JP":"ソース"}', 2, '{"pt-BR":"shoyu, molho inglês, dashi, açúcar, água","ja-JP":"醤油、ウスターソース、だし、砂糖、水"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, NULL, NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (33, '{"pt-BR":"NABO EM CONSERVA","ja-JP":"大根の漬け物"}', 7, '{"pt-BR":"nabo, sal, vinagre, açúcar","ja-JP":"大根、塩、酢、砂糖"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/c34e6793-17a8-4328-b6ee-3f425cbad5b0.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (34, '{"pt-BR":"NATTOU","ja-JP":"納豆"}', 13, '{"pt-BR":"soja, nattou kim","ja-JP":"大豆、納豆菌"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/74139182-dd5e-40d7-a783-5cbb6c7e1273.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (35, '{"pt-BR":"NIKUJYAGA","ja-JP":"肉じゃが"}', 20, '{"pt-BR":"carne bovina, batata, cebola, shoyu, açúcar","ja-JP":"牛肉、じゃがいも、玉ねぎ、醤油、砂糖"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/bcce9849-abe1-43f5-b57d-801be6953f32.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (36, '{"pt-BR":"ODEN","ja-JP":"おでん"}', 42, '{"pt-BR":"daikon, konnyaku, ovo cozido, goboten, chikuwa, kombu, molho dashi, shoyu, inhame, bolinha de sardinha, atsuague, ague com moti","ja-JP":"大根、こんにゃく、ゆで卵、ごぼう天、ちくわ、昆布、だし、醤油、山芋、いわし団子、厚揚げ、餅入りあげ"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/dfffd710-3d94-4f23-aca9-95c6daf0ad90.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (37, '{"pt-BR":"OKONOMIYAKI","ja-JP":"お好み焼き"}', 0, NULL, 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/25eca0cd-c6de-497d-bde6-40350d40d48b.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (39, '{"pt-BR":"POUNDCAKE","ja-JP":"パウンドケーキ"}', 0, '{"pt-BR":"farinha de trigo, manteiga, açúcar, ovo, passas ao rum","ja-JP":"小麦粉、バター、砂糖、卵、ラム酒漬けレーズン"}', 1, '{"pt-BR":"Sobremesas","ja-JP":"デザート"}', NULL, NULL, NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (41, '{"pt-BR":"RISOLES","ja-JP":"リソール"}', 13, NULL, 1, '{"pt-BR":"Congelados","ja-JP":"冷凍品"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/d44e92f9-c60f-4a6a-a3ea-9091bd216db0.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (44, '{"pt-BR":"SALMÃO","ja-JP":"サーモン"}', 14, '{"pt-BR":"salmão fresco, sal","ja-JP":"生鮭、塩"}', 1, '{"pt-BR":"Congelados","ja-JP":"冷凍品"}', '{"pt-BR":"100g a unidade","ja-JP":"1個 100g"}', 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/1dca45d9-fe80-4159-9e9f-9a01562ae648.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (45, '{"pt-BR":"SANSHOKU","ja-JP":"三色丼"}', 30, '{"pt-BR":"arroz, carne moída, ovo, vagem, nori, açúcar, shoyu","ja-JP":"ご飯、挽き肉、卵、いんげん、のり、砂糖、醤油"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/72f1b051-1fe1-4699-a0bd-94667546ab8a.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (46, '{"pt-BR":"SHOKUPAN","ja-JP":"食パン"}', 0, NULL, 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/2e400a90-0c94-483c-a62a-84c805c02d76.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (48, '{"pt-BR":"SHOOGAYAKI","ja-JP":"生姜焼き"}', 20, '{"pt-BR":"carne de porco fatiada, gengibre ralado, shoyu, mirin, açúcar, cebola","ja-JP":"薄切り豚肉、おろし生姜、醤油、みりん、砂糖、玉ねぎ"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/e13767a4-9f7d-4288-8f93-2e1232f46c9e.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (49, '{"pt-BR":"SHOU CREAM","ja-JP":"シュークリーム"}', 6, '{"pt-BR":"farinha, margarina, ovo, água, leite, açúcar, baunilha","ja-JP":"小麦粉、マーガリン、卵、水、牛乳、砂糖、バニラ"}', 1, '{"pt-BR":"Sobremesas","ja-JP":"デザート"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/da011a5e-23f8-4989-95ba-3e5f5b3a94cf.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (50, '{"pt-BR":"SOPA MILHO","ja-JP":"コーンスープ"}', 6, '{"pt-BR":"milho, leite, caldo de galinha, sal, salsinha","ja-JP":"トウモロコシ、牛乳、チキンスープの素、塩, パセリ"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/74d83dff-f5ed-4f79-9248-dcfc6a636c42.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (51, '{"pt-BR":"SOSU KATSUDON","ja-JP":"ソースカツ丼"}', 30, '{"pt-BR":"arroz, carne de porco empanada, tonkatsu sôsu, ketchup, shoyu, mirin","ja-JP":"ご飯、豚カツ、トンカツソース、ケチャップ、醤油、みりん"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/e95dd00e-a943-4bb7-8f58-2dbda998fd43.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (52, '{"pt-BR":"SOSU YAKISOBA","ja-JP":"ソース焼きそば"}', 29, '{"pt-BR":"macarrão de lámen, carne bovina, repolho, cenoura, cebolinha, molho yakissoba","ja-JP":"ラーメン麺、牛肉、キャベツ、にんじん、ねぎ、焼きそばソース"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/38207bd9-13a3-42f7-861b-7f1293b1d8be.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (53, '{"pt-BR":"SUSHI DONBURI","ja-JP":"寿司丼"}', 35, NULL, 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, NULL, NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (55, '{"pt-BR":"TCHANPON","ja-JP":"チャンポン"}', 0, NULL, 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/80b70d5c-3093-4ebf-a0ca-1b632039377a.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (57, '{"pt-BR":"TCHANPON SOPA","ja-JP":"チャンポンスープ"}', 6, '{"pt-BR":"alho, frango, água, sal, shoyu, leite","ja-JP":"にんにく、鶏肉、水、塩、醤油、牛乳"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', '{"pt-BR":"150g","ja-JP":"150g"}', NULL, NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (58, '{"pt-BR":"TOFU","ja-JP":"豆腐"}', 15, '{"pt-BR":"soja, sal amargo","ja-JP":"大豆、にがり"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/295c800d-fd0c-47ca-b3f0-8a4dca681b13.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (59, '{"pt-BR":"TONKATSU","ja-JP":"とんかつ （単品）"}', 13, '{"pt-BR":"carne de porco empanada","ja-JP":"豚カツ"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, NULL, NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (60, '{"pt-BR":"UDON","ja-JP":"うどん"}', 0, '{"pt-BR":"farinha de trigo, água, sal, ovo, araruta, óleo","ja-JP":"小麦粉、水、塩、卵、アラルート、油"}', 1, '{"pt-BR":"Outros","ja-JP":"その他"}', '{"pt-BR":"PRÉ-COZIDO: 500g / CONGELADO: 600g","ja-JP":"半調理: 500g / 冷凍: 600g"}', NULL, NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (63, '{"pt-BR":"Cookies","ja-JP":"クッキー"}', NULL, NULL, 1, '{"pt-BR":"Sobremesas","ja-JP":"デザート"}', '{"pt-BR":"com pedaços de chocolate","ja-JP":"チョコチップ入り"}', 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/a310af2d-8e47-4c0e-91ee-be645511e8de.jpeg', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
INSERT INTO "produtos" ("id", "nome", "preco", "ingredientes", "quantidade", "categoria", "observacoes", "imagem", "abreviacao", "ativo") 
VALUES (64, '{"pt-BR":"CARNE COM PIMENTÃO","ja-JP":"チンジャオロース"}', 25, '{"pt-BR":"Carne Bovina, Pimentão Verde, Pimentão Amarelo, Pimentão Vermelho, Batata, Óleo de Gergelim, Maisena, Sal, Shoyu, Sopa de Galinha, Mirim, Saque, Açúcar","ja-JP":"牛肉、ピーマン、黄ピーマン、赤ピーマン、じゃがいも、ごま油、片栗粉、塩、醤油、鶏ガラスープ、みりん、酒、砂糖"}', 1, '{"pt-BR":"Prato Principal","ja-JP":"メイン料理"}', NULL, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/0dfd1a2a-081e-4684-bf3e-8fc4f7d86edc.png', NULL, true) 
ON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "categoria" = EXCLUDED."categoria", "imagem" = EXCLUDED."imagem", "ativo" = EXCLUDED."ativo";
SELECT setval('produtos_id_seq', (SELECT MAX(id) FROM produtos));

-- 3. VARIEDADES
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (16, 8, '{"pt-BR":"MEIO A MEIO","ja-JP":"ハーフ・ハーフ"}', 17, '{"pt-BR":"farinha, água, sal, leite, manteiga, fermento, presunto, queijo, gema de ovo, orégano","ja-JP":"小麦粉、水、塩、牛乳、バター、イースト、ハム、チーズ、卵黄、オレガノ"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (17, 8, '{"pt-BR":"PRESUNTO E QUEIJO","ja-JP":"ハム・チーズ"}', 18, '{"pt-BR":"farinha, água, sal, leite, manteiga, fermento, presunto, queijo, gema de ovo, orégano","ja-JP":"小麦粉、水、塩、牛乳、バター、イースト、ハム、チーズ、卵黄、オレガノ"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (18, 8, '{"pt-BR":"SEM RECHEIO","ja-JP":"プレーン"}', 16, '{"pt-BR":"farinha, água, sal, leite, manteiga, fermento, gema de ovo","ja-JP":"小麦粉、水、塩、牛乳、バター、イースト、卵黄"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (25, 63, '{"pt-BR":"Pack 25","ja-JP":"パック 25"}', 25, '{"pt-BR":"Ingredientes: farinha de trigo, açúcar, manteiga, ovo, chocolate ao leite","ja-JP":"材料: 小麦粉、砂糖、バター、卵、チョコレート"}', 25, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (26, 63, '{"pt-BR":"Pack 50","ja-JP":"パック 50"}', 45, '{"pt-BR":"Ingredientes: farinha de trigo, açúcar, manteiga, ovo, chocolate ao leite","ja-JP":"材料: 小麦粉、砂糖、バター、卵、チョコレート"}', 50, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (29, 27, '{"pt-BR":"130g","ja-JP":"130g"}', 3.8, NULL, 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (30, 27, '{"pt-BR":"150g","ja-JP":"150g"}', 4.3, NULL, 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (31, 27, '{"pt-BR":"200g","ja-JP":"200g"}', 5.6, NULL, 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (34, 25, '{"pt-BR":"150g","ja-JP":"150g"}', 6, NULL, 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (35, 25, '{"pt-BR":"200g","ja-JP":"200g"}', 7.5, NULL, 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (38, 39, '{"pt-BR":"CORTE","ja-JP":"スライス"}', 4, NULL, 1, true, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/b11d2fb5-43dc-43be-8d91-694af346095e.png') 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (39, 39, '{"pt-BR":"INTEIRO","ja-JP":"ホール"}', 8, NULL, 1, true, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/7f1b51fa-fb0d-4334-9339-77dfeccbc7ee.png') 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (42, 37, '{"pt-BR":"NORMAL","ja-JP":"普通"}', 16, '{"pt-BR":"farinha, repolho, ovo, ketchup, shoyu, dashi, aginomoto, açúcar, batata cará, bacon","ja-JP":"小麦粉、キャベツ、卵、ケチャップ、醤油、だし、味の素、砂糖、山芋、ベーコン"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (43, 37, '{"pt-BR":"CAMARÃO E LULA","ja-JP":"エビ・イカ"}', 22, '{"pt-BR":"farinha, repolho, ovo, ketchup, shoyu, dashi, aginomoto, açúcar, batata cará, camarão, lula","ja-JP":"小麦粉、キャベツ、卵、ケチャップ、醤油、だし、味の素、砂糖、山芋、えび、いか"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (47, 41, '{"pt-BR":"CARNE","ja-JP":"ミート"}', 0, '{"pt-BR":"farinha, leite, margarina, sal, óleo, água, carne moída, milho, ervilha, molho de tomate, farina de rosca","ja-JP":"小麦粉、牛乳、マーガリン、塩、油、水、挽き肉、コーン、グリーンピース、トマトソース、パン粉"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (48, 41, '{"pt-BR":"MEIO A MEIO","ja-JP":"ハーフ・ハーフ"}', 0, '{"pt-BR":"farinha, leite, margarina, sal, óleo, água, carne moída, milho, ervilha, molho de tomate, farina de rosca, presunto e queijo","ja-JP":"小麦粉、牛乳、マーガリン、塩、油、水、挽き肉、コーン、グリーンピース、トマトソース、パン粉、ハムとチーズ"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (49, 41, '{"pt-BR":"PRESUNTO E QUEIJO","ja-JP":"ハム・チーズ"}', 0, '{"pt-BR":"farinha, leite, margarina, sal, óleo, água, presunto e queijo, farina de rosca","ja-JP":"小麦粉、牛乳、マーガリン、塩、油、水、ハムとチーズ、パン粉"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (50, 46, '{"pt-BR":"NORMAL","ja-JP":"普通"}', 11, '{"pt-BR":"farinha de trigo, leite, ovo, manteiga, açúcar, sal, fermento","ja-JP":"小麦粉、牛乳、卵、バター、砂糖、塩、イースト"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (51, 46, '{"pt-BR":"SEM LACTOSE","ja-JP":"無乳"}', 12, '{"pt-BR":"farinha de trigo, leite sem lactose, ovo, manteiga, açúcar, sal, fermento","ja-JP":"小麦粉、乳糖不使用牛乳、卵、バター、砂糖、塩、イースト"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (54, 53, '{"pt-BR":"SUSHI CRU","ja-JP":"生寿司"}', 0, '{"pt-BR":"arroz, peixe cru (salmão), ovo, kanikama, shoyu, gergelim, pepino, vinagre, açúcar","ja-JP":"ご飯、生魚（サーモン）、卵、カニカマ、醤油、ごま、きゅうり、酢、砂糖"}', 1, true, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/6f8050fa-1c8f-4abc-b431-de812fb51887.png') 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (55, 53, '{"pt-BR":"SUSHI GRELHADO","ja-JP":"焼き寿司"}', 0, '{"pt-BR":"arroz, peixe grelhado(salmão), ovo, kanikama, shoyu, gergelim, pepino, vinagre, açúcar","ja-JP":"ご飯、焼き魚（サーモン）、卵、カニカマ、醤油、ごま、きゅうり、酢、砂糖"}', 1, true, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/01bd1272-b35a-4d5d-b500-c32c631aa83b.png') 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (56, 55, '{"pt-BR":"NORMAL","ja-JP":"普通"}', 32, '{"pt-BR":"macarrão de lámen, carne bovina, repolho, cebolinha, cenoura, broto de feijão, kamaboko, óleo de gergelim, alho, caldo de frango, molho shoyu, sal, leite","ja-JP":"ラーメン麺、牛肉、キャベツ、ねぎ、にんじん、もやし、かまぼこ、ごま油、にんにく、鶏ガラスープ、醤油ダレ、塩、牛乳"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (57, 55, '{"pt-BR":"COM FRUTOS DO MAR","ja-JP":"海鮮"}', 38, '{"pt-BR":"macarrão de lámen, carne bovina, camarão, lula, repolho, cebolinha, cenoura, broto de feijão, kamaboko, óleo de gergelim, alho, caldo de frango, molho shoyu, sal, leite","ja-JP":"ラーメン麺、牛肉、えび、いか、キャベツ、ねぎ、にんじん、もやし、かまぼこ、ごま油、にんにく、鶏ガラスープ、醤油ダレ、塩、牛乳"}', 1, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (58, 60, '{"pt-BR":"PRÉ-COZIDO","ja-JP":"半調理"}', 10, NULL, 1, true, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/a17c9230-fada-409a-bf8a-f7f1fdcc3e29.png') 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (59, 60, '{"pt-BR":"CONGELADO","ja-JP":"冷凍"}', 17, NULL, 1, true, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/9e0e92bd-952e-4c20-8b50-3598338f7d01.png') 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (60, 13, '{"pt-BR":"CAMARÃO","ja-JP":"エビ"}', 27, '{"pt-BR":"camarão, sal, pimenta, queijo, panko, farinha","ja-JP":"えび、塩、胡椒、チーズ、パン粉、小麦粉"}', 3, true, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/79644860-5318-4d20-afbe-dbe11759802a.png') 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (61, 13, '{"pt-BR":"LULA","ja-JP":"イカ"}', 30, '{"pt-BR":"lula, sal, pimenta","ja-JP":"いか、塩、胡椒"}', 5, true, NULL) 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (62, 13, '{"pt-BR":"PANCETA","ja-JP":"豚バラ"}', 32, '{"pt-BR":"panceta de porco, sal, pimenta","ja-JP":"豚バラ肉、塩、胡椒"}', 5, true, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/e653e72e-93c2-46f9-94c6-db6dd874df6a.png') 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
INSERT INTO "variedades_produto" ("id", "produto_id", "nome", "preco", "ingredientes", "quantidade", "ativo", "imagem") 
VALUES (63, 13, '{"pt-BR":"FRANGO","ja-JP":"鳥"}', 32, '{"pt-BR":"frango em cubos, molho tare (shoyu, mirin, açúcar)","ja-JP":"鶏肉の角切り、照り焼きソース（醤油、みりん、砂糖）"}', 1, true, 'https://wlouubkubtbitbdhluwb.supabase.co/storage/v1/object/public/products/products/bcb5b7b3-42b8-4a29-a309-ed9cf647a99b.png') 
ON CONFLICT ("id") DO UPDATE SET "produto_id" = EXCLUDED."produto_id", "nome" = EXCLUDED."nome", "preco" = EXCLUDED."preco", "ingredientes" = EXCLUDED."ingredientes", "ativo" = EXCLUDED."ativo", "imagem" = EXCLUDED."imagem";
SELECT setval('variedades_produto_id_seq', (SELECT MAX(id) FROM variedades_produto));

-- Insert default form configuration
INSERT INTO "configuracao_formularios" ("id", "taxa_entrega_base", "valor_minimo_taxa_reduzida", "taxa_entrega_reduzida", "valor_minimo_isencao")
VALUES (1, 12.00, 100.00, 8.00, 130.00)
ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- USAGE INSTRUCTIONS
-- 1. Create a new PostgreSQL database.
-- 2. Run this script completely.
-- 3. In the API module, update the .env with the new DATABASE_URL.
-- =====================================================
