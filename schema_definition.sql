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
    "tema" VARCHAR(20) NOT NULL DEFAULT 'system',
    "idioma" VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
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

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_encomenda_data_encomenda_id_produto_id_variedade_i_key" ON "produtos_encomenda"("data_encomenda_id", "produto_id", "variedade_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_encomenda_usuario_id_data_encomenda_id_key" ON "pedidos_encomenda"("usuario_id", "data_encomenda_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_pedido_direto_usuario_id_key" ON "clientes_pedido_direto"("usuario_id");

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

