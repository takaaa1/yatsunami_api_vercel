-- AlterTable
ALTER TABLE "pedidos_diretos" ADD COLUMN "codigo" VARCHAR(10);

-- AlterTable
ALTER TABLE "pedidos_encomenda" ADD COLUMN "codigo" VARCHAR(10);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_diretos_codigo_key" ON "pedidos_diretos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_encomenda_codigo_key" ON "pedidos_encomenda"("codigo");
