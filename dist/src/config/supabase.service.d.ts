import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService implements OnModuleInit {
    private configService;
    private supabase;
    private supabaseAdmin;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    getClient(): SupabaseClient;
    getAdminClient(): SupabaseClient;
    getPublicUrl(bucket: string, path: string): string;
    uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<{
        id: string;
        path: string;
        fullPath: string;
    }>;
    deleteFile(bucket: string, paths: string[]): Promise<import("@supabase/storage-js").FileObject[]>;
}
