const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: 'postgresql://postgres:progamming01@db.wlouubkubtbitbdhluwb.supabase.co:5432/postgres',
});

async function run() {
    const rlsSql = fs.readFileSync('prisma/rls_policies.sql', 'utf8');

    // 1. Replace auth_id with id
    let fixedRlsSql = rlsSql.replace(/auth_id/g, 'id');

    // 2. Add casting to auth.uid() since id is TEXT in this project
    // We want to replace auth.uid() with auth.uid()::text
    fixedRlsSql = fixedRlsSql.replace(/auth\.uid\(\)/g, 'auth.uid()::text');

    const client = await pool.connect();
    try {
        console.log('Applying FIXED RLS Policies with casting...');
        await client.query('SET search_path TO public, auth, storage, extensions, pg_catalog');

        const lines = fixedRlsSql.split('\n');
        let currentStatement = '';
        let success = 0;
        let failed = 0;

        for (const line of lines) {
            if (line.trim().startsWith('--') || !line.trim()) continue;
            currentStatement += line + '\n';
            if (line.trim().endsWith(';')) {
                try {
                    await client.query(currentStatement);
                    success++;
                } catch (stErr) {
                    console.error('Error in:', currentStatement.trim().slice(0, 50), '->', stErr.message);
                    failed++;
                }
                currentStatement = '';
            }
        }

        console.log(`RLS application done. Success: ${success}, Failed: ${failed}`);
    } catch (e) {
        console.error('Fatal Error:', e);
    } finally {
        client.release();
    }
}

run().finally(() => pool.end());
