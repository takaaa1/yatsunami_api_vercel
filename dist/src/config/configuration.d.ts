declare const _default: () => {
    port: number;
    nodeEnv: string;
    apiUrl: string;
    supabase: {
        url: string | undefined;
        anonKey: string | undefined;
        serviceKey: string | undefined;
    };
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string;
        expiration: string;
    };
    company: {
        name: string;
        city: string;
        state: string;
    };
    mail: {
        brevoApiKey: string | undefined;
        fromEmail: string;
        fromName: string;
    };
    auth: {
        resetPasswordExpirationMinutes: number;
    };
};
export default _default;
