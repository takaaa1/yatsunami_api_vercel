import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../../../prisma';

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    aud?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        const supabaseUrl = configService.get<string>('supabase.url');
        if (!supabaseUrl) {
            throw new Error('SUPABASE_URL is not configured');
        }

        const jwksUri = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // Use JWKS to dynamically fetch the public key for ES256 verification
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri,
                handleSigningKeyError: (err, cb) => {
                    console.error('[JwtStrategy] JWKS Error:', err);
                    cb(err);
                },
            }),
            algorithms: ['ES256'],
            audience: 'authenticated',
        });
    }

    async validate(payload: JwtPayload) {
        // Supabase JWT uses 'sub' for the user ID (auth.users.id)
        const user = await this.prisma.usuario.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                tema: true,
                idioma: true,
                telefone: true,
                endereco: true,
                receberNotificacoes: true,
                ativo: true,
            },
        });

        if (!user) {
            this.logger.warn(`User with id ${payload.sub} not found in database`);
            throw new UnauthorizedException('Usuário não encontrado');
        }

        if (!user.ativo) {
            this.logger.warn(`Blocked request from inactive user: ${user.email}`);
            throw new UnauthorizedException('Conta desativada.');
        }

        return user;
    }
}
