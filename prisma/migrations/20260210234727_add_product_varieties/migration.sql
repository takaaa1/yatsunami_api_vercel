-- AlterTable
ALTER TABLE "itens_pedido_direto" ADD COLUMN     "variedade_id" INTEGER;

-- AlterTable
ALTER TABLE "itens_pedido_encomenda" ADD COLUMN     "preco_unitario" DECIMAL(10,2),
ADD COLUMN     "variedade_id" INTEGER;

-- AlterTable
ALTER TABLE "itens_venda" ADD COLUMN     "variedade_id" INTEGER;

-- CreateTable
CREATE TABLE "variedades_produto" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "nome" JSON NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variedades_produto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "variedades_produto" ADD CONSTRAINT "variedades_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_variedade_id_fkey" FOREIGN KEY ("variedade_id") REFERENCES "variedades_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_encomenda" ADD CONSTRAINT "itens_pedido_encomenda_variedade_id_fkey" FOREIGN KEY ("variedade_id") REFERENCES "variedades_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_direto" ADD CONSTRAINT "itens_pedido_direto_variedade_id_fkey" FOREIGN KEY ("variedade_id") REFERENCES "variedades_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
