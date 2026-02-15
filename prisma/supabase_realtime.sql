-- Phase 5.2: Enable Supabase Realtime for Delivery Tracking
-- This script enables database replication for real-time updates on the following tables:
-- 1. entregador_localizacao (GPS position updates)
-- 2. entregas_concluidas (Stop completion status updates)

-- Instruction: Execute this script in the Supabase SQL Editor (Dashboard > SQL Editor)

-- Ensure the 'supabase_realtime' publication exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to the publication. 
-- Note: If these tables are already in the publication, these commands might fail.
-- You can check current tables with: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

ALTER PUBLICATION supabase_realtime ADD TABLE entregador_localizacao;
ALTER PUBLICATION supabase_realtime ADD TABLE entregas_concluidas;
