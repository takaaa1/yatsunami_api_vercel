import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;
    private readonly fromEmail: string;
    private readonly fromName: string;

    constructor(private configService: ConfigService) {
        this.fromEmail = this.configService.get<string>('mail.fromEmail') || 'no-reply@yatsunami.com.br';
        this.fromName = this.configService.get<string>('mail.fromName') || 'Yatsunami';

        const mailUser = this.configService.get<string>('mail.user');
        const mailPass = this.configService.get<string>('mail.password');
        const mailHost = this.configService.get<string>('mail.host');
        const mailPort = this.configService.get<number>('mail.port');

        this.logger.log(`SMTP Config - Host: ${mailHost}, Port: ${mailPort}, User: ${mailUser}, Pass: ${mailPass ? '******' : 'MISSING'}`);

        this.transporter = nodemailer.createTransport({
            host: mailHost,
            port: mailPort,
            secure: false, // true for 465, false for other ports
            auth: {
                user: mailUser,
                pass: mailPass,
            },
        });
    }

    async sendResetCode(email: string, code: string): Promise<boolean> {
        const expiration = this.configService.get('auth.resetPasswordExpirationMinutes');

        try {
            const info = await this.transporter.sendMail({
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: email,
                subject: 'Yatsunami - Recuperação de Senha',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Recuperação de Senha</h2>
                        <p>Olá,</p>
                        <p>Você solicitou a recuperação de senha para sua conta no Yatsunami.</p>
                        <p>Seu código de verificação é:</p>
                        <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 8px; margin: 20px 0;">
                            ${code}
                        </div>
                        <p>Este código expira em ${expiration} minutos.</p>
                        <p>Se você não solicitou isso, por favor ignore este e-mail.</p>
                        <br>
                        <p>Atenciosamente,<br>Equipe Yatsunami</p>
                    </div>
                `,
            });

            this.logger.log(`Email sent: ${info.messageId}`);
            return true;
        } catch (error: any) {
            this.logger.error(`Failed to send email: ${error.message}`);
            return false;
        }
    }
}
