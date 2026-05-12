-- Separa quantidade_medida (enum legado) em unidade_medida + tipo_produto

CREATE TYPE "UnidadeMedida" AS ENUM ('UN', 'G', 'KG', 'ML', 'L', 'FATIA', 'PEDACO');
CREATE TYPE "TipoProduto" AS ENUM ('ITEM', 'PRATO', 'PORCAO', 'COMBO', 'BEBIDA');

ALTER TABLE "produtos" ADD COLUMN "unidade_medida" "UnidadeMedida" NOT NULL DEFAULT 'UN';
ALTER TABLE "produtos" ADD COLUMN "tipo_produto" "TipoProduto" NOT NULL DEFAULT 'ITEM';

ALTER TABLE "variedades_produto" ADD COLUMN "unidade_medida" "UnidadeMedida" NOT NULL DEFAULT 'UN';
ALTER TABLE "variedades_produto" ADD COLUMN "tipo_produto" "TipoProduto" NOT NULL DEFAULT 'ITEM';

UPDATE "produtos" SET
  "unidade_medida" = CASE "quantidade_medida"::text
    WHEN 'GRAMA' THEN 'G'::"UnidadeMedida"
    WHEN 'GRAMAS' THEN 'G'::"UnidadeMedida"
    WHEN 'FATIA' THEN 'FATIA'::"UnidadeMedida"
    WHEN 'PEDACO' THEN 'PEDACO'::"UnidadeMedida"
    WHEN 'UNIDADE' THEN 'UN'::"UnidadeMedida"
    WHEN 'UNIDADES' THEN 'UN'::"UnidadeMedida"
    ELSE 'UN'::"UnidadeMedida"
  END,
  "tipo_produto" = CASE "quantidade_medida"::text
    WHEN 'PRATO' THEN 'PRATO'::"TipoProduto"
    WHEN 'PORCAO' THEN 'PORCAO'::"TipoProduto"
    ELSE 'ITEM'::"TipoProduto"
  END;

UPDATE "variedades_produto" SET
  "unidade_medida" = CASE "quantidade_medida"::text
    WHEN 'GRAMA' THEN 'G'::"UnidadeMedida"
    WHEN 'GRAMAS' THEN 'G'::"UnidadeMedida"
    WHEN 'FATIA' THEN 'FATIA'::"UnidadeMedida"
    WHEN 'PEDACO' THEN 'PEDACO'::"UnidadeMedida"
    WHEN 'UNIDADE' THEN 'UN'::"UnidadeMedida"
    WHEN 'UNIDADES' THEN 'UN'::"UnidadeMedida"
    ELSE 'UN'::"UnidadeMedida"
  END,
  "tipo_produto" = CASE "quantidade_medida"::text
    WHEN 'PRATO' THEN 'PRATO'::"TipoProduto"
    WHEN 'PORCAO' THEN 'PORCAO'::"TipoProduto"
    ELSE 'ITEM'::"TipoProduto"
  END;

ALTER TABLE "produtos" DROP COLUMN "quantidade_medida";
ALTER TABLE "variedades_produto" DROP COLUMN "quantidade_medida";

DROP TYPE "QuantidadeMedida";
