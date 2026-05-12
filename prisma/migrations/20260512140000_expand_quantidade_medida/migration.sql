-- Expandir enum de medida da quantidade (UNIDADES/GRAMAS -> UNIDADE/GRAMA + novos valores)

CREATE TYPE "QuantidadeMedida_new" AS ENUM ('UNIDADE', 'GRAMA', 'FATIA', 'PEDACO', 'PORCAO', 'PRATO');

ALTER TABLE "produtos" ALTER COLUMN "quantidade_medida" DROP DEFAULT;
ALTER TABLE "variedades_produto" ALTER COLUMN "quantidade_medida" DROP DEFAULT;

ALTER TABLE "produtos"
  ALTER COLUMN "quantidade_medida" TYPE "QuantidadeMedida_new"
  USING (
    CASE "quantidade_medida"::text
      WHEN 'UNIDADES' THEN 'UNIDADE'::"QuantidadeMedida_new"
      WHEN 'GRAMAS' THEN 'GRAMA'::"QuantidadeMedida_new"
      ELSE 'UNIDADE'::"QuantidadeMedida_new"
    END
  );

ALTER TABLE "variedades_produto"
  ALTER COLUMN "quantidade_medida" TYPE "QuantidadeMedida_new"
  USING (
    CASE "quantidade_medida"::text
      WHEN 'UNIDADES' THEN 'UNIDADE'::"QuantidadeMedida_new"
      WHEN 'GRAMAS' THEN 'GRAMA'::"QuantidadeMedida_new"
      ELSE 'UNIDADE'::"QuantidadeMedida_new"
    END
  );

ALTER TABLE "produtos" ALTER COLUMN "quantidade_medida" SET DEFAULT 'UNIDADE'::"QuantidadeMedida_new";
ALTER TABLE "variedades_produto" ALTER COLUMN "quantidade_medida" SET DEFAULT 'UNIDADE'::"QuantidadeMedida_new";

DROP TYPE "QuantidadeMedida";
ALTER TYPE "QuantidadeMedida_new" RENAME TO "QuantidadeMedida";
