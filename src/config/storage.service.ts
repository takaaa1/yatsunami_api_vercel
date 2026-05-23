import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { R2StorageService } from '../infra/storage/r2-storage.service';
import { contentTypeFromKey, resolveObjectKeyFromUrl } from '../common/utils/storage-url.util';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private uploadsRoot: string;
    private uploadsPublicBase: string;
    private uploadsPublicPrefix: string;
    private apiUrl: string;
    private useR2Storage = false;

    constructor(
        private configService: ConfigService,
        private r2Storage: R2StorageService,
    ) { }

    onModuleInit() {
        this.apiUrl = (this.configService.get<string>('apiUrl') || 'http://localhost:3000').replace(/\/$/, '');
        this.uploadsRoot = this.configService.get<string>('storage.uploadsPath')
            || path.join(process.cwd(), 'uploads');

        const explicit = this.configService.get<string | null>('assetsPublicUrl');
        this.uploadsPublicBase = (explicit && explicit.length > 0)
            ? explicit.replace(/\/$/, '')
            : this.stripApiSuffixFromBase(this.apiUrl);

        const prefix = this.configService.get<string>('uploadsPublicPrefix') || '/uploads';
        this.uploadsPublicPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;

        const backend = (process.env.STORAGE_BACKEND || '').trim().toLowerCase();
        this.useR2Storage =
            backend === 'r2' || (backend !== 'local' && this.r2Storage.isConfigured());

        fs.mkdirSync(this.uploadsRoot, { recursive: true });

        if (this.useR2Storage) {
            this.logger.log(`Storage: Cloudflare R2 (bucket ${process.env.R2_BUCKET || 'yatsunami'})`);
            this.logger.log(`R2 public base: ${process.env.R2_PUBLIC_BASE_URL}`);
        } else {
            this.logger.log(`Storage: local disk ${this.uploadsRoot}`);
            this.logger.log(`Uploads public base: ${this.uploadsPublicBase}${this.uploadsPublicPrefix}`);
        }
    }

    private stripApiSuffixFromBase(url: string): string {
        const u = url.replace(/\/$/, '');
        return u.endsWith('/api') ? u.slice(0, -4) : u;
    }

    /** Chave R2: `{bucket}/{relativePath}` (ex.: `produtos/uuid.png`). */
    objectKey(bucket: string, filePath: string): string {
        const rel = this.normalizeRelativeWithinBucket(bucket, filePath);
        const dir = this.uploadDirAliases(bucket)[0];
        return `${dir}/${rel}`;
    }

    getPublicUrl(bucket: string, filePath: string): string {
        if (this.useR2Storage) {
            return this.r2Storage.getPublicUrlForKey(this.objectKey(bucket, filePath));
        }
        const rel = this.normalizeRelativeWithinBucket(bucket, filePath);
        return `${this.uploadsPublicBase}${this.uploadsPublicPrefix}/${bucket}/${rel}`;
    }

    private normalizeRelativeWithinBucket(bucket: string, filePath: string): string {
        let rel = filePath.split('?')[0].replace(/^\/+/, '');
        const prefix = `${bucket}/`;
        if (rel.startsWith(prefix)) {
            rel = rel.slice(prefix.length);
        }
        for (const alias of this.uploadDirAliases(bucket)) {
            const aliasPrefix = `${alias}/`;
            if (rel.startsWith(aliasPrefix)) {
                rel = rel.slice(aliasPrefix.length);
            }
        }
        return rel;
    }

    private uploadDirAliases(bucket: string): string[] {
        if (bucket === 'produtos' || bucket === 'products') {
            return ['produtos', 'products'];
        }
        return [bucket];
    }

    private uploadsPathMarkers(): string[] {
        const p = this.uploadsPublicPrefix;
        const markers = new Set<string>();
        markers.add(`${p}/`);
        if (p === '/uploads') {
            markers.add('/api/uploads/');
        } else if (p === '/api/uploads') {
            markers.add('/uploads/');
        }
        return [...markers];
    }

    async uploadFile(bucket: string, filePath: string, buffer: Buffer, contentType: string): Promise<void> {
        if (this.useR2Storage) {
            const key = this.objectKey(bucket, filePath);
            await this.r2Storage.putObject(key, buffer, contentType || contentTypeFromKey(key));
            return;
        }

        const rel = this.normalizeRelativeWithinBucket(bucket, filePath);
        const bucketDir = path.join(this.uploadsRoot, bucket, path.dirname(rel));
        fs.mkdirSync(bucketDir, { recursive: true });
        const fullPath = path.join(this.uploadsRoot, bucket, rel);
        await fs.promises.writeFile(fullPath, buffer);
    }

    async deleteFile(bucket: string, filePaths: string[]): Promise<void> {
        if (this.useR2Storage) {
            for (const raw of filePaths) {
                const key = raw.includes('/') ? raw.replace(/^\//, '') : this.objectKey(bucket, raw);
                await this.r2Storage.deleteObjectByKey(key);
            }
            return;
        }

        const dirs = this.uploadDirAliases(bucket);
        for (const raw of filePaths) {
            const rel = this.normalizeRelativeWithinBucket(bucket, raw);
            for (const dir of dirs) {
                const fullPath = path.join(this.uploadsRoot, dir, rel);
                try {
                    await fs.promises.unlink(fullPath);
                    break;
                } catch {
                    /* tenta próximo alias */
                }
            }
        }
    }

    async deleteByUrl(url: string | null | undefined): Promise<void> {
        if (!url?.trim()) return;
        if (this.useR2Storage) {
            await this.r2Storage.deleteStoredAsset(url);
            return;
        }
        const key = resolveObjectKeyFromUrl(url);
        if (!key) return;
        const bucket = key.split('/')[0];
        if (!bucket) return;
        const rel = key.slice(bucket.length + 1);
        await this.deleteFile(bucket, [rel]);
    }

    extractPathFromUrl(url: string, bucket: string): string | null {
        if (!url) return null;

        if (this.useR2Storage) {
            const key = resolveObjectKeyFromUrl(url);
            if (!key) return null;
            for (const seg of this.uploadDirAliases(bucket)) {
                const prefix = `${seg}/`;
                if (key.startsWith(prefix)) {
                    return this.normalizeRelativeWithinBucket(bucket, key.slice(prefix.length));
                }
            }
            return null;
        }

        const cleanUrl = url.split('?')[0];
        const segments = this.uploadDirAliases(bucket);
        const pathMarkers = this.uploadsPathMarkers();
        const bases = [...new Set([this.uploadsPublicBase, this.stripApiSuffixFromBase(this.apiUrl), this.apiUrl])];

        for (const base of bases) {
            for (const pm of pathMarkers) {
                for (const seg of segments) {
                    const prefix = `${base}${pm}${seg}/`;
                    if (cleanUrl.startsWith(prefix)) {
                        return this.normalizeRelativeWithinBucket(bucket, cleanUrl.slice(prefix.length));
                    }
                }
            }
        }

        for (const pm of pathMarkers) {
            for (const seg of segments) {
                const marker = `${pm}${seg}/`;
                const idx = cleanUrl.indexOf(marker);
                if (idx !== -1) {
                    return this.normalizeRelativeWithinBucket(bucket, cleanUrl.slice(idx + marker.length));
                }
            }
        }

        return null;
    }
}
