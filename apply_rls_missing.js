const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:progamming01@db.wlouubkubtbitbdhluwb.supabase.co:5432/postgres',
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Applying MISSING RLS Policies (variedades_produto, codigos_recuperacao)...');
        await client.query('SET search_path TO public, auth, storage, extensions, pg_catalog');

        const statements = [
            // 1. Enable RLS
            'ALTER TABLE IF EXISTS variedades_produto ENABLE ROW LEVEL SECURITY;',
            'ALTER TABLE IF EXISTS codigos_recuperacao ENABLE ROW LEVEL SECURITY;',

            // 2. Variedades Produto Policies
            'DROP POLICY IF EXISTS "variedades_select_authenticated" ON variedades_produto;',
            "CREATE POLICY \"variedades_select_authenticated\" ON variedades_produto FOR SELECT USING (auth.role() = 'authenticated');",

            'DROP POLICY IF EXISTS "variedades_admin_all" ON variedades_produto;',
            "CREATE POLICY \"variedades_admin_all\" ON variedades_produto FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::text AND role = 'admin'));",

            // 3. Codigos Recuperacao Policies
            'DROP POLICY IF EXISTS "codigos_admin_all" ON codigos_recuperacao;',
            "CREATE POLICY \"codigos_admin_all\" ON codigos_recuperacao FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::text AND role = 'admin'));"
        ];

        for (const sql of statements) {
            try {
                await client.query(sql);
                console.log(`Executed: ${sql.slice(0, 50)}...`);
            } catch (err) {
                console.error(`Error executing statement: ${err.message}`);
            }
        }

        console.log('Missing RLS Policies application finished.');
    } catch (e) {
        console.error('Fatal Error:', e);
    } finally {
        client.release();
    }
}

run().finally(() => pool.end());
