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
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "usuarios_update_own" ON usuarios
    FOR UPDATE USING (auth.uid() = auth_id)
    WITH CHECK (auth.uid() = auth_id);

-- CATEGORIAS: leitura para autenticados
CREATE POLICY "categorias_select_authenticated" ON categorias
    FOR SELECT USING (auth.role() = 'authenticated');

-- PRODUTOS: leitura para autenticados
CREATE POLICY "produtos_select_authenticated" ON produtos
    FOR SELECT USING (auth.role() = 'authenticated');

-- VENDAS: admin only
CREATE POLICY "vendas_admin_all" ON vendas
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "itens_venda_admin_all" ON itens_venda
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- ENCOMENDAS: datas e produtos para autenticados, pedidos para próprio usuário
CREATE POLICY "datas_encomenda_select" ON datas_encomenda
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "produtos_encomenda_select" ON produtos_encomenda
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pedidos_encomenda_select_own" ON pedidos_encomenda
    FOR SELECT USING (
        usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "pedidos_encomenda_insert_own" ON pedidos_encomenda
    FOR INSERT WITH CHECK (
        usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "pedidos_encomenda_update_own" ON pedidos_encomenda
    FOR UPDATE USING (
        usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "itens_pedido_encomenda_select_own" ON itens_pedido_encomenda
    FOR SELECT USING (
        pedido_id IN (
            SELECT id FROM pedidos_encomenda 
            WHERE usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY "itens_pedido_encomenda_insert_own" ON itens_pedido_encomenda
    FOR INSERT WITH CHECK (
        pedido_id IN (
            SELECT id FROM pedidos_encomenda 
            WHERE usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
        )
    );

-- PEDIDO DIRETO
CREATE POLICY "clientes_pd_select_own" ON clientes_pedido_direto
    FOR SELECT USING (
        usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "produtos_pd_select" ON produtos_pedido_direto
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pedidos_diretos_select_own" ON pedidos_diretos
    FOR SELECT USING (
        usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "pedidos_diretos_insert_own" ON pedidos_diretos
    FOR INSERT WITH CHECK (
        usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "itens_pd_select_own" ON itens_pedido_direto
    FOR SELECT USING (
        pedido_id IN (
            SELECT id FROM pedidos_diretos 
            WHERE usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY "itens_pd_insert_own" ON itens_pedido_direto
    FOR INSERT WITH CHECK (
        pedido_id IN (
            SELECT id FROM pedidos_diretos 
            WHERE usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
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
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "itens_despesa_admin" ON itens_despesa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- LOGS: admin only
CREATE POLICY "email_logs_admin" ON email_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "activity_logs_admin" ON activity_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND role = 'admin')
    );
