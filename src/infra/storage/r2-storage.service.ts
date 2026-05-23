import { Injectable, Logger } from '@nestjs/common';
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class R2StorageService {
    private readonly logger = new Logger(R2StorageService.name);
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly publicBase: string;

    constructor() {
        const endpoint = (process.env.CLOUDFLARE_S3_URL ?? '').replace(/\/+$/, '');
        const accessKeyId = (process.env.CLOUDFLARE_ACCESS_KEY ?? '').trim();
        const secretAccessKey = (process.env.CLOUDFLARE_SECRET_KEY ?? '').trim();
        this.bucket = (process.env.R2_BUCKET ?? 'yatsunami').trim();
        this.publicBase = (process.env.R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');

        if (!endpoint || !accessKeyId || !secretAccessKey) {
            this.logger.warn(
                'R2: defina CLOUDFLARE_S3_URL, CLOUDFLARE_ACCESS_KEY e CLOUDFLARE_SECRET_KEY.',
            );
        }

        this.client = new S3Client({
            region: 'auto',
            endpoint: endpoint || undefined,
            credentials:
                accessKeyId && secretAccessKey
                    ? { accessKeyId, secretAccessKey }
                    : { accessKeyId: 'missing', secretAccessKey: 'missing' },
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        });
    }

    isConfigured(): boolean {
        return !!(
            process.env.CLOUDFLARE_S3_URL?.trim() &&
            process.env.CLOUDFLARE_ACCESS_KEY?.trim() &&
            process.env.CLOUDFLARE_SECRET_KEY?.trim() &&
            this.publicBase
        );
    }

    getPublicUrlForKey(key: string): string {
        const k = key.replace(/^\//, '');
        if (!this.publicBase) {
            return k;
        }
        return `${this.publicBase}/${k}`;
    }

    async putObject(
        key: string,
        body: Buffer,
        contentType: string,
    ): Promise<{ key: string; publicUrl: string }> {
        if (!this.publicBase) {
            throw new Error('R2_PUBLIC_BASE_URL é obrigatório para uploads.');
        }
        const Key = key.replace(/^\//, '');
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key,
                Body: body,
                ContentType: contentType,
            }),
        );
        return { key: Key, publicUrl: this.getPublicUrlForKey(Key) };
    }

    async deleteObjectByKey(key: string): Promise<void> {
        const Key = key.replace(/^\//, '');
        try {
            await this.client.send(
                new DeleteObjectCommand({ Bucket: this.bucket, Key }),
            );
        } catch (e) {
            this.logger.warn(`R2 deleteObject falhou: ${Key}`, e);
        }
    }

    async deleteObjectByPublicUrl(url: string | null | undefined): Promise<void> {
        if (!url?.trim() || !this.publicBase) return;
        const u = url.trim();
        if (!u.startsWith(this.publicBase)) return;
        const rest = u.slice(this.publicBase.length).replace(/^\//, '');
        const key = rest.split('?')[0];
        if (key) await this.deleteObjectByKey(key);
    }

    async deleteStoredAsset(urlOrKey: string | null | undefined): Promise<void> {
        const trimmed = urlOrKey?.trim();
        if (!trimmed) return;
        if (trimmed.includes('://')) {
            await this.deleteObjectByPublicUrl(trimmed);
            return;
        }
        await this.deleteObjectByKey(trimmed);
    }

    async copyObject(sourceKey: string, destKey: string): Promise<void> {
        const Source = sourceKey.replace(/^\//, '');
        const Key = destKey.replace(/^\//, '');
        await this.client.send(
            new CopyObjectCommand({
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${Source}`,
                Key,
            }),
        );
    }
}
