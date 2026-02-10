"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
    },
    database: {
        url: process.env.DATABASE_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        expiration: process.env.JWT_EXPIRATION || '7d',
    },
    company: {
        name: process.env.COMPANY_NAME || 'Yatsunami',
        city: process.env.COMPANY_CITY || 'Curitiba',
        state: process.env.COMPANY_STATE || 'PR',
    },
    mail: {
        brevoApiKey: process.env.BREVO_API_KEY,
        fromEmail: process.env.MAIL_FROM_EMAIL || 'nao-responda@yatsunami.com.br',
        fromName: process.env.MAIL_FROM_NAME || 'Yatsunami',
    },
    auth: {
        resetPasswordExpirationMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRATION_MINUTES || '15', 10),
    },
});
//# sourceMappingURL=configuration.js.map