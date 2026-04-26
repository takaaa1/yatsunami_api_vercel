import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private uploadsRoot: string;
    private apiUrl: string;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.apiUrl = this.configService.get<string>('apiUrl') || 'http://localhost:3000';
        this.uploadsRoot = this.configService.get<string>('storage.uploadsPath')
            || path.join(process.cwd(), 'uploads');

        // Ensure base upload directory exists
        fs.mkdirSync(this.uploadsRoot, { recursive: true });
        this.logger.log(`Storage root: ${this.uploadsRoot}`);
    }

    getPublicUrl(bucket: string, filePath: string): string {
        return `${this.apiUrl}/uploads/${bucket}/${filePath}`;
    }

    async uploadFile(bucket: string, filePath: string, buffer: Buffer, _contentType: string): Promise<void> {
        const bucketDir = path.join(this.uploadsRoot, bucket, path.dirname(filePath));
        fs.mkdirSync(bucketDir, { recursive: true });

        const fullPath = path.join(this.uploadsRoot, bucket, filePath);
        await fs.promises.writeFile(fullPath, buffer);
    }

    async deleteFile(bucket: string, filePaths: string[]): Promise<void> {
        for (const filePath of filePaths) {
            const fullPath = path.join(this.uploadsRoot, bucket, filePath);
            try {
                await fs.promises.unlink(fullPath);
            } catch {
                // Silently ignore missing files
            }
        }
    }

    // Extract relative path from a full public URL produced by this service
    extractPathFromUrl(url: string, bucket: string): string | null {
        const prefix = `${this.apiUrl}/uploads/${bucket}/`;
        if (!url.startsWith(prefix)) return null;
        return url.slice(prefix.length);
    }
}
