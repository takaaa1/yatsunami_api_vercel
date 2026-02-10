import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly apiKey: string;
    private readonly fromEmail: string;
    private readonly fromName: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('mail.brevoApiKey') || '';
        this.fromEmail = this.configService.get<string>('mail.fromEmail') || 'no-reply@yatsunami.com.br';
        this.fromName = this.configService.get<string>('mail.fromName') || 'Yatsunami';
    }

    async sendResetCode(email: string, code: string): Promise<boolean> {
        this.logger.log(`[TESTE] Código de recuperação para ${email}: ${code}`);

        // Skip Brevo API for now as requested
        return true;

        /* Original logic commented for future use
        if (!this.apiKey) {
            this.logger.error('BREVO_API_KEY is not defined. Email skip.');
            return false;
        }

        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': this.apiKey,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    sender: {
                        name: this.fromName,
                        email: this.fromEmail,
                    },
                    to: [{ email }],
                    subject: 'Seu código de recuperação de senha',
                    htmlContent: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2>Recuperação de Senha</h2>
                            <p>Olá,</p>
                            <p>Você solicitou a recuperação de senha para sua conta no Yatsunami.</p>
                            <p>Seu código de verificação é:</p>
                            <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 8px; margin: 20px 0;">
                                ${code}
                            </div>
                            <p>Este código expira em ${this.configService.get('auth.resetPasswordExpirationMinutes')} minutos.</p>
                            <p>Se você não solicitou isso, por favor ignore este e-mail.</p>
                            <br>
                            <p>Atenciosamente,<br>Equipe Yatsunami</p>
                        </div>
                    `,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                this.logger.error(`Error sending email via Brevo: ${JSON.stringify(errorData)}`);
                return false;
            }

            return true;
        } catch (error: any) {
            this.logger.error(`Failed to send email: ${error.message}`);
            return false;
        }
        */
    }
}
