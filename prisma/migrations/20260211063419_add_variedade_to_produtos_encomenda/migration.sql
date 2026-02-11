/*
  Warnings:

  - A unique constraint covering the columns `[data_encomenda_id,produto_id,variedade_id]` on the table `produtos_encomenda` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "produtos_encomenda_data_encomenda_id_produto_id_key";

-- AlterTable
ALTER TABLE "produtos_encomenda" ADD COLUMN     "variedade_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "produtos_encomenda_data_encomenda_id_produto_id_variedade_i_key" ON "produtos_encomenda"("data_encomenda_id", "produto_id", "variedade_id");

-- AddForeignKey
ALTER TABLE "produtos_encomenda" ADD CONSTRAINT "produtos_encomenda_variedade_id_fkey" FOREIGN KEY ("variedade_id") REFERENCES "variedades_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
