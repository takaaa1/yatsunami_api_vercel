const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: 'postgresql://postgres:progamming01@db.wlouubkubtbitbdhluwb.supabase.co:5432/postgres',
});

async function run() {
    const rlsSql = fs.readFileSync('prisma/rls_policies.sql', 'utf8');

    const client = await pool.connect();
    try {
        console.log('Applying RLS Policies...');
        await client.query('BEGIN');
        await client.query('SET search_path TO public, auth, storage, extensions, pg_catalog');

        // The script has ALTER TABLE ... ENABLE ROW LEVEL SECURITY; and CREATE POLICY ...
        // We should split it and execute pieces.
        const lines = rlsSql.split('\n');
        let currentStatement = '';

        for (const line of lines) {
            if (line.trim().startsWith('--')) continue; // skip comments
            currentStatement += line + '\n';
            if (line.trim().endsWith(';')) {
                if (currentStatement.trim()) {
                    await client.query(currentStatement);
                }
                currentStatement = '';
            }
        }

        await client.query('COMMIT');
        console.log('RLS Policies applied successfully.');
    } catch (e) {
        if (client) await client.query('ROLLBACK');
        console.error('Error applying RLS Policies:', e);
    } finally {
        if (client) client.release();
    }
}

run().finally(() => pool.end());
