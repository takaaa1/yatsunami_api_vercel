-- Preferência de app de navegação (Google Maps ou Waze) ao tocar em "Navegar" nas rotas de entrega.
ALTER TABLE "usuarios" ADD COLUMN "app_navegacao_preferido" VARCHAR(20) NOT NULL DEFAULT 'google_maps';
