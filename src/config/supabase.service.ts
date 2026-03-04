import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
    private supabase!: SupabaseClient;
    private supabaseAdmin!: SupabaseClient;
    private hasServiceKey = false;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const supabaseUrl = this.configService.get<string>('supabase.url');
        const supabaseAnonKey = this.configService.get<string>('supabase.anonKey');
        const supabaseServiceKey = this.configService.get<string>('supabase.serviceKey');

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration is missing');
        }

        // Client for public operations
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Admin client for server-side operations (upload/delete Storage requer service key para bypass RLS)
        if (supabaseServiceKey) {
            this.hasServiceKey = true;
            this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
        } else {
            console.warn('SUPABASE_SERVICE_KEY não configurada - upload/delete no Storage falharão com RLS. Configure para foto de perfil.');
            this.supabaseAdmin = this.supabase;
        }
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }

    getAdminClient(): SupabaseClient {
        return this.supabaseAdmin;
    }

    // Storage helpers
    getPublicUrl(bucket: string, path: string): string {
        const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }

    async uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
        if (!this.hasServiceKey) {
            throw new Error(
                'SUPABASE_SERVICE_KEY não está configurada. Upload no Storage (ex.: foto de perfil) exige a chave service role para contornar RLS. Configure a variável de ambiente no servidor.',
            );
        }
        const { data, error } = await this.supabaseAdmin.storage
            .from(bucket)
            .upload(path, file, { contentType, upsert: true });

        if (error) throw error;
        return data;
    }

    async deleteFile(bucket: string, paths: string[]) {
        if (!this.hasServiceKey) {
            throw new Error(
                'SUPABASE_SERVICE_KEY não está configurada. Exclusão no Storage exige a chave service role. Configure a variável de ambiente no servidor.',
            );
        }
        const { data, error } = await this.supabaseAdmin.storage
            .from(bucket)
            .remove(paths);

        if (error) throw error;
        return data;
    }
}
