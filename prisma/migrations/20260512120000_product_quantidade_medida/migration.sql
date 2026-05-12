-- CreateEnum
CREATE TYPE "QuantidadeMedida" AS ENUM ('UNIDADES', 'GRAMAS');

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN "quantidade_medida" "QuantidadeMedida" NOT NULL DEFAULT 'UNIDADES';

-- AlterTable
ALTER TABLE "variedades_produto" ADD COLUMN "quantidade_medida" "QuantidadeMedida" NOT NULL DEFAULT 'UNIDADES';
