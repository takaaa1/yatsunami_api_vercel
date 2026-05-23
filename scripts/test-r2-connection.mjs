/**
 * Diagnóstico R2 — correr na VPS:
 *   cd /var/www/yatsunami/api && node scripts/test-r2-connection.mjs
 */
import { ListBucketsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(envPath) {
    if (!existsSync(envPath)) return;
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        if (process.env[key] !== undefined) continue;
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        process.env[key] = val;
    }
}

loadEnvFile(join(root, '.env'));

const endpoint = (process.env.CLOUDFLARE_S3_URL ?? '').replace(/\/+$/, '');
const accessKeyId = (process.env.CLOUDFLARE_ACCESS_KEY ?? '').trim();
const secretAccessKey = (process.env.CLOUDFLARE_SECRET_KEY ?? '').trim();
const bucket = (process.env.R2_BUCKET ?? 'yatsunami').trim();
const publicBase = (process.env.R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');

console.log('endpoint', endpoint);
console.log('bucket', bucket);
console.log('publicBase', publicBase);
console.log('accessKey prefix', accessKeyId.slice(0, 8), 'len', accessKeyId.length);

if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error('ERRO: variáveis R2 em falta no .env');
    process.exit(1);
}

const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
});

try {
    const lb = await client.send(new ListBucketsCommand({}));
    console.log('ListBuckets OK:', (lb.Buckets ?? []).map((b) => b.Name).join(', '));
} catch (e) {
    console.error('ListBuckets FAIL:', e.Code ?? e.name, e.message);
}

try {
    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: 'test/r2-connection.txt',
            Body: 'ok',
            ContentType: 'text/plain',
        }),
    );
    console.log('PutObject OK');
} catch (e) {
    console.error('PutObject FAIL:', e.Code ?? e.name, e.message);
    process.exit(1);
}
