import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private uploadsRoot: string;
    /** Origem usada em URLs públicas de ficheiros em `/uploads` (nunca com sufixo `/api`). */
    private uploadsPublicBase: string;
    private apiUrl: string;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.apiUrl = (this.configService.get<string>('apiUrl') || 'http://localhost:3000').replace(/\/$/, '');
        this.uploadsRoot = this.configService.get<string>('storage.uploadsPath')
            || path.join(process.cwd(), 'uploads');

        const explicit = this.configService.get<string | null>('assetsPublicUrl');
        this.uploadsPublicBase = (explicit && explicit.length > 0)
            ? explicit.replace(/\/$/, '')
            : this.stripApiSuffixFromBase(this.apiUrl);

        fs.mkdirSync(this.uploadsRoot, { recursive: true });
        this.logger.log(`Storage root: ${this.uploadsRoot}`);
        this.logger.log(`Uploads public base: ${this.uploadsPublicBase}`);
    }

    /** API_URL costuma incluir `/api` (Ex.: app Expo); ficheiros estáticos ficam em `/uploads`, não em `/api/uploads`. */
    private stripApiSuffixFromBase(url: string): string {
        const u = url.replace(/\/$/, '');
        return u.endsWith('/api') ? u.slice(0, -4) : u;
    }

    getPublicUrl(bucket: string, filePath: string): string {
        const rel = this.normalizeRelativeWithinBucket(bucket, filePath);
        return `${this.uploadsPublicBase}/uploads/${bucket}/${rel}`;
    }

    /** Evita `bucket` duplicado no path (ex.: bucket `avatars` + filePath `avatars/x.png`). */
    private normalizeRelativeWithinBucket(bucket: string, filePath: string): string {
        let rel = filePath.split('?')[0].replace(/^\/+/, '');
        const prefix = `${bucket}/`;
        if (rel.startsWith(prefix)) {
            rel = rel.slice(prefix.length);
        }
        return rel;
    }

    private uploadDirAliases(bucket: string): string[] {
        if (bucket === 'produtos' || bucket === 'products') {
            return ['produtos', 'products'];
        }
        return [bucket];
    }

    async uploadFile(bucket: string, filePath: string, buffer: Buffer, _contentType: string): Promise<void> {
        const rel = this.normalizeRelativeWithinBucket(bucket, filePath);
        const bucketDir = path.join(this.uploadsRoot, bucket, path.dirname(rel));
        fs.mkdirSync(bucketDir, { recursive: true });

        const fullPath = path.join(this.uploadsRoot, bucket, rel);
        await fs.promises.writeFile(fullPath, buffer);
    }

    async deleteFile(bucket: string, filePaths: string[]): Promise<void> {
        const dirs = this.uploadDirAliases(bucket);
        for (const raw of filePaths) {
            const rel = this.normalizeRelativeWithinBucket(bucket, raw);
            for (const dir of dirs) {
                const fullPath = path.join(this.uploadsRoot, dir, rel);
                try {
                    await fs.promises.unlink(fullPath);
                    break;
                } catch {
                    // tenta próximo alias ou ignora
                }
            }
        }
    }

    extractPathFromUrl(url: string, bucket: string): string | null {
        if (!url) return null;
        const cleanUrl = url.split('?')[0];
        const segments = this.uploadDirAliases(bucket);
        const bases = [...new Set([this.uploadsPublicBase, this.stripApiSuffixFromBase(this.apiUrl), this.apiUrl])];

        for (const base of bases) {
            for (const seg of segments) {
                const prefix = `${base}/uploads/${seg}/`;
                if (cleanUrl.startsWith(prefix)) {
                    return this.normalizeRelativeWithinBucket(bucket, cleanUrl.slice(prefix.length));
                }
            }
        }

        for (const seg of segments) {
            const marker = `/uploads/${seg}/`;
            const idx = cleanUrl.indexOf(marker);
            if (idx !== -1) {
                return this.normalizeRelativeWithinBucket(bucket, cleanUrl.slice(idx + marker.length));
            }
        }

        return null;
    }
}
