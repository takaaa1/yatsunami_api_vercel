const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const schemaSql = fs.readFileSync('schema_definition.sql', 'utf8');
    const dataSql = fs.readFileSync('../full_data_migration.sql', 'utf8');

    const client = await pool.connect();
    try {
        console.log('Applying Schema...');
        await client.query('BEGIN');
        await client.query('SET search_path TO public, auth, storage, extensions, pg_catalog');
        await client.query(schemaSql);
        await client.query('COMMIT');
        console.log('Schema applied.');

        console.log('Applying Data Statements...');
        await client.query('SET session_replication_role = replica;');
        await client.query('SET search_path TO public, auth, storage, extensions, pg_catalog');

        const lines = dataSql.split('\n');
        let currentStatement = '';
        let successCount = 0;

        for (const line of lines) {
            if (line.includes('set_config(\'search_path\'')) continue;

            currentStatement += line + '\n';
            if (line.trim().endsWith(';')) {
                try {
                    if (currentStatement.trim() && !currentStatement.includes('CREATE ') && !currentStatement.includes('ALTER ')) {
                        await client.query(currentStatement);
                        successCount++;
                    }
                } catch (err) {
                    if (currentStatement.includes('INSERT INTO')) {
                        console.error('Data Insert Error:', err.message, '| Statement start:', currentStatement.trim().slice(0, 50));
                    }
                }
                currentStatement = '';
            }
        }
        console.log(`Data import completed. Successfully executed ${successCount} statements.`);
    } catch (e) {
        if (client) await client.query('ROLLBACK');
        console.error('Fatal Error:', e);
    } finally {
        if (client) client.release();
    }
}

run().finally(() => pool.end());
